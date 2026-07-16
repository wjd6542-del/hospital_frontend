<template>
  <div class="fdash">
    <div class="topbar">
      <SearchSelect v-model="year" size="xs" :options="yearOptions" :clearable="false" @change="load" />
      <SearchSelect v-model="deptId" size="xs" :options="deptOptions" :placeholder="$t('전체 부서')" @change="load" />
    </div>

    <!-- KPI -->
    <div class="cards">
      <div class="scard income">
        <span class="lbl">{{ $t("연간 수입") }}</span>
        <b class="val num">{{ won(data.totals.income) }}</b>
      </div>
      <div class="scard expense">
        <span class="lbl">{{ $t("연간 지출") }}</span>
        <b class="val num">{{ won(data.totals.expense) }}</b>
      </div>
      <div class="scard net" :class="{ minus: data.totals.net < 0 }">
        <span class="lbl">{{ $t("순액") }}</span>
        <b class="val num">{{ won(data.totals.net) }}</b>
      </div>
    </div>

    <!-- 월별 추이 -->
    <div class="pcard chartcard">
      <h3 class="ctitle">{{ $t("월별 수입·지출 추이") }}</h3>
      <v-chart class="chart tall" :option="monthlyOption" autoresize />
    </div>

    <div class="chartgrid">
      <div class="pcard chartcard">
        <h3 class="ctitle">{{ $t("지출 계정과목별 구성") }}</h3>
        <v-chart v-if="expenseAccounts.length" class="chart" :option="accountOption" autoresize />
        <div v-else class="cempty">{{ $t("지출 데이터가 없습니다.") }}</div>
      </div>
      <div class="pcard chartcard">
        <h3 class="ctitle">{{ $t("부서별 수입·지출") }}</h3>
        <v-chart v-if="data.by_department.length" class="chart" :option="deptOption" autoresize />
        <div v-else class="cempty">{{ $t("부서 데이터가 없습니다.") }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted } from "vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import { txnApi } from "@/api/finance";
import { departmentApi } from "@/api/hr";
import { useThemeStore } from "@/stores/theme";
import { useI18nStore } from "@/stores/i18n";

const theme = useThemeStore();
const i18n = useI18nStore();

const INCOME_C = "#10b981";
const EXPENSE_C = "#ef4444";
const PIE_PALETTE = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899"];

const won = (v) => `${Number(v || 0).toLocaleString()}${i18n.t("원")}`;
const axisColor = computed(() => (theme.dark ? "#94a3b8" : "#475569"));
const splitColor = computed(() => (theme.dark ? "rgba(148,163,184,0.15)" : "rgba(15,23,42,0.08)"));

const _now = new Date();
const year = ref(_now.getFullYear());
const deptId = ref(null);
const yearOptions = computed(() => {
  const y = _now.getFullYear();
  return [y + 1, y, y - 1, y - 2, y - 3].map((v) => ({ value: v, label: `${v}${i18n.t("년")}` }));
});
const deptOptions = ref([]);

const data = reactive({
  monthly: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, income: 0, expense: 0 })),
  by_account: [],
  by_department: [],
  totals: { income: 0, expense: 0, net: 0 },
});

const expenseAccounts = computed(() => data.by_account.filter((a) => a.type === "EXPENSE"));

const monthlyOption = computed(() => ({
  tooltip: { trigger: "axis", valueFormatter: (v) => won(v) },
  legend: { data: [i18n.t("수입"), i18n.t("지출")], textStyle: { color: axisColor.value }, top: 0 },
  grid: { left: 60, right: 20, top: 36, bottom: 28 },
  xAxis: { type: "category", data: data.monthly.map((m) => `${m.month}${i18n.t("월")}`), axisLabel: { color: axisColor.value }, axisLine: { lineStyle: { color: splitColor.value } } },
  yAxis: { type: "value", axisLabel: { color: axisColor.value, formatter: (v) => (v >= 10000 ? `${v / 10000}만` : v) }, splitLine: { lineStyle: { color: splitColor.value } } },
  series: [
    { name: i18n.t("수입"), type: "bar", data: data.monthly.map((m) => m.income), itemStyle: { color: INCOME_C, borderRadius: [3, 3, 0, 0] } },
    { name: i18n.t("지출"), type: "bar", data: data.monthly.map((m) => m.expense), itemStyle: { color: EXPENSE_C, borderRadius: [3, 3, 0, 0] } },
  ],
}));

const accountOption = computed(() => ({
  tooltip: { trigger: "item", formatter: (p) => `${p.name}: ${won(p.value)} (${p.percent}%)` },
  legend: { bottom: 0, textStyle: { color: axisColor.value }, type: "scroll" },
  color: PIE_PALETTE,
  series: [
    {
      type: "pie",
      radius: ["45%", "70%"],
      center: ["50%", "44%"],
      avoidLabelOverlap: true,
      itemStyle: { borderColor: theme.dark ? "#111a2c" : "#fff", borderWidth: 2 },
      label: { color: axisColor.value },
      data: expenseAccounts.value.map((a) => ({ name: a.name, value: a.total })),
    },
  ],
}));

const deptOption = computed(() => {
  const depts = data.by_department;
  return {
    tooltip: { trigger: "axis", valueFormatter: (v) => won(v) },
    legend: { data: [i18n.t("수입"), i18n.t("지출")], textStyle: { color: axisColor.value }, top: 0 },
    grid: { left: 90, right: 20, top: 36, bottom: 20 },
    xAxis: { type: "value", axisLabel: { color: axisColor.value, formatter: (v) => (v >= 10000 ? `${v / 10000}만` : v) }, splitLine: { lineStyle: { color: splitColor.value } } },
    yAxis: { type: "category", data: depts.map((d) => d.name), axisLabel: { color: axisColor.value } },
    series: [
      { name: i18n.t("수입"), type: "bar", data: depts.map((d) => d.income), itemStyle: { color: INCOME_C } },
      { name: i18n.t("지출"), type: "bar", data: depts.map((d) => d.expense), itemStyle: { color: EXPENSE_C } },
    ],
  };
});

async function load() {
  const res = await txnApi.dashboard({ year: year.value, department_id: deptId.value || undefined });
  data.monthly = res.monthly;
  data.by_account = res.by_account;
  data.by_department = res.by_department;
  data.totals = res.totals;
}

onMounted(async () => {
  const depts = await departmentApi.options();
  deptOptions.value = depts.map((d) => ({ value: d.id, label: `${"　".repeat(d.depth)}${d.name}` }));
  await load();
});
</script>

<style scoped>
.fdash { max-width: 1300px; margin: 0 auto; }
.topbar { display: flex; gap: 0.6rem; margin-bottom: 1rem; }
.topbar > :nth-child(1) { width: 110px; flex: 0 0 auto; }
.topbar > :nth-child(2) { width: 180px; flex: 0 0 auto; }

.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8rem; margin-bottom: 1rem; }
.scard { display: flex; flex-direction: column; gap: 0.35rem; padding: 0.9rem 1.1rem; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); box-shadow: var(--shadow-sm); }
.scard .lbl { font-size: 0.72rem; font-weight: 600; color: var(--text-subtle); }
.scard .val { font-size: 1.35rem; font-weight: 800; letter-spacing: -0.01em; }
.scard.income { border-left: 3px solid var(--positive); }
.scard.income .val { color: var(--positive); }
.scard.expense { border-left: 3px solid var(--danger); }
.scard.expense .val { color: var(--danger); }
.scard.net { border-left: 3px solid var(--accent); }
.scard.net .val { color: var(--accent); }
.scard.net.minus .val { color: var(--danger); }

.chartcard { padding: 1rem 1.1rem; margin-bottom: 1rem; }
.ctitle { font-size: 0.85rem; font-weight: 700; color: var(--text); margin-bottom: 0.6rem; }
.chart { height: 300px; width: 100%; }
.chart.tall { height: 340px; }
.chartgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.chartgrid .chartcard { margin-bottom: 0; }
.cempty { height: 300px; display: flex; align-items: center; justify-content: center; color: var(--text-subtle); font-size: 0.85rem; }
</style>
