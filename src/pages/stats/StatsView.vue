<template>
  <div class="stat">
    <!-- KPI 타일 -->
    <div class="kgrid">
      <router-link v-for="k in kpis" :key="k.label" :to="k.to" class="ktile" :class="k.tone">
        <div class="kicon"><i class="fa-solid" :class="k.icon"></i></div>
        <div class="kbody">
          <span class="klbl">{{ $t(k.label) }}</span>
          <b class="kval num">{{ k.value }}<span v-if="k.unit" class="kunit">{{ $t(k.unit) }}</span></b>
          <span v-if="k.sub" class="ksub">{{ k.sub }}</span>
        </div>
      </router-link>
    </div>

    <!-- 월별 수입·지출 -->
    <div class="pcard chartcard">
      <h3 class="ctitle">{{ $t("월별 수입·지출") }} ({{ year }}{{ $t("년") }})</h3>
      <v-chart class="chart" :option="monthlyOption" autoresize />
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted } from "vue";
import { statsApi } from "@/api/stats";
import { useThemeStore } from "@/stores/theme";
import { useI18nStore } from "@/stores/i18n";

const theme = useThemeStore();
const i18n = useI18nStore();

const won = (v) => `${Number(v || 0).toLocaleString()}${i18n.t("원")}`;
const axisColor = computed(() => (theme.dark ? "#94a3b8" : "#475569"));
const splitColor = computed(() => (theme.dark ? "rgba(148,163,184,0.15)" : "rgba(15,23,42,0.08)"));

const year = new Date().getFullYear();
const data = reactive({
  hr: { employees: 0 },
  finance: { income: 0, expense: 0, net: 0 },
  reservation: { today: 0, month: 0 },
  ward: { admitted: 0 },
  insurance: { unpaid: 0 },
  asset: { count: 0, cost: 0 },
  facility: { open: 0 },
  inventory: { low: 0 },
  monthly: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, income: 0, expense: 0 })),
});

const kpis = computed(() => [
  { label: "재직 직원", value: data.hr.employees, unit: "명", to: "/hr/employee", icon: "fa-user-group", tone: "accent" },
  { label: "이번달 순액", value: won(data.finance.net), to: "/finance/dashboard", icon: "fa-won-sign", tone: data.finance.net < 0 ? "danger" : "positive" },
  { label: "오늘 예약", value: data.reservation.today, unit: "건", to: "/reservation/appointments", icon: "fa-calendar-check", tone: "accent" },
  { label: "재원 환자", value: data.ward.admitted, unit: "명", to: "/ward/admissions", icon: "fa-bed-pulse", tone: "accent" },
  { label: "미지급 청구액", value: won(data.insurance.unpaid), to: "/insurance/claims", icon: "fa-file-invoice-dollar", tone: "warning" },
  { label: "안전재고 미달", value: data.inventory.low, unit: "품목", to: "/inventory/items", icon: "fa-triangle-exclamation", tone: data.inventory.low > 0 ? "danger" : "positive" },
  { label: "총 자산", value: won(data.asset.cost), sub: `${data.asset.count}${i18n.t("건")}`, to: "/assets", icon: "fa-heart-pulse", tone: "accent" },
  { label: "유지보수 대기", value: data.facility.open, unit: "건", to: "/facility/maintenance", icon: "fa-screwdriver-wrench", tone: data.facility.open > 0 ? "warning" : "positive" },
]);

const monthlyOption = computed(() => ({
  tooltip: { trigger: "axis", valueFormatter: (v) => won(v) },
  legend: { data: [i18n.t("수입"), i18n.t("지출")], textStyle: { color: axisColor.value }, top: 0 },
  grid: { left: 60, right: 20, top: 36, bottom: 28 },
  xAxis: { type: "category", data: data.monthly.map((m) => `${m.month}${i18n.t("월")}`), axisLabel: { color: axisColor.value }, axisLine: { lineStyle: { color: splitColor.value } } },
  yAxis: { type: "value", axisLabel: { color: axisColor.value, formatter: (v) => (v >= 10000 ? `${v / 10000}만` : v) }, splitLine: { lineStyle: { color: splitColor.value } } },
  series: [
    { name: i18n.t("수입"), type: "bar", data: data.monthly.map((m) => m.income), itemStyle: { color: "#10b981", borderRadius: [3, 3, 0, 0] } },
    { name: i18n.t("지출"), type: "bar", data: data.monthly.map((m) => m.expense), itemStyle: { color: "#ef4444", borderRadius: [3, 3, 0, 0] } },
  ],
}));

onMounted(async () => {
  const res = await statsApi.overview();
  Object.assign(data, res);
});
</script>

<style scoped>
.stat { margin: 0; }
.kgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8rem; margin-bottom: 1rem; }
.ktile { display: flex; align-items: center; gap: 0.8rem; padding: 0.9rem 1rem; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); box-shadow: var(--shadow-sm); transition: border-color 0.12s, transform 0.12s; }
.ktile:hover { border-color: var(--accent); transform: translateY(-1px); }
.kicon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; background: var(--surface-2); color: var(--text-muted); }
.ktile.accent .kicon { background: var(--accent-soft); color: var(--accent); }
.ktile.positive .kicon { background: var(--positive-soft); color: var(--positive); }
.ktile.danger .kicon { background: var(--danger-soft); color: var(--danger); }
.ktile.warning .kicon { background: var(--warning-soft); color: var(--warning); }
.kbody { display: flex; flex-direction: column; min-width: 0; }
.klbl { font-size: 0.7rem; font-weight: 600; color: var(--text-subtle); }
.kval { font-size: 1.2rem; font-weight: 800; color: var(--text); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kunit { font-size: 0.75rem; font-weight: 600; color: var(--text-subtle); margin-left: 2px; }
.ksub { font-size: 0.68rem; color: var(--text-subtle); }

.chartcard { padding: 1rem 1.1rem; }
.ctitle { font-size: 0.85rem; font-weight: 700; color: var(--text); margin-bottom: 0.6rem; }
.chart { height: 320px; width: 100%; }
</style>
