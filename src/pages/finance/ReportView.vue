<template>
  <div class="frep">
    <div class="topbar">
      <SearchSelect v-model="year" size="xs" :options="yearOptions" :clearable="false" @change="load" />
      <SearchSelect v-model="month" size="xs" :options="monthOptions" :clearable="false" @change="load" />
      <span class="hint">{{ $t("선택한 달을 지난달·전년동월과 비교합니다.") }}</span>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th style="width: 90px">{{ $t("구분") }}</th>
            <th class="right">{{ $t("이번달") }}</th>
            <th class="right">{{ $t("지난달") }}</th>
            <th class="right" style="width: 190px">{{ $t("전월 대비") }}</th>
            <th class="right">{{ $t("전년동월") }}</th>
            <th class="right" style="width: 190px">{{ $t("전년 대비") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in metrics" :key="r.key" :class="{ netrow: r.key === 'net' }">
            <td>
              <span class="badge" :class="r.badge">{{ $t(r.label) }}</span>
            </td>
            <td class="num right strong">{{ won(data.current[r.key]) }}</td>
            <td class="num right">{{ won(data.prevMonth[r.key]) }}</td>
            <td class="right"><DeltaCell :cur="data.current[r.key]" :prev="data.prevMonth[r.key]" :good-up="r.key !== 'expense'" /></td>
            <td class="num right">{{ won(data.prevYear[r.key]) }}</td>
            <td class="right"><DeltaCell :cur="data.current[r.key]" :prev="data.prevYear[r.key]" :good-up="r.key !== 'expense'" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, h } from "vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import { txnApi } from "@/api/finance";
import { useI18nStore } from "@/stores/i18n";

const i18n = useI18nStore();
const won = (v) => `${Number(v || 0).toLocaleString()}${i18n.t("원")}`;

// 증감 셀 — 함수형 컴포넌트로 화살표·색·증감률 표현
const DeltaCell = (props) => {
  const diff = (props.cur || 0) - (props.prev || 0);
  const pct = props.prev > 0 ? Math.round((diff / props.prev) * 1000) / 10 : props.cur > 0 ? 100 : 0;
  if (diff === 0) return h("span", { class: "delta flat" }, "—");
  const up = diff > 0;
  const good = up === !!props.goodUp; // 상승이면서 goodUp, 또는 하락이면서 !goodUp → 긍정
  const arrow = up ? "▲" : "▼";
  const sign = up ? "+" : "−";
  return h("span", { class: ["delta", good ? "good" : "bad"] }, [
    `${arrow} ${sign}${Math.abs(diff).toLocaleString()} `,
    h("small", `(${sign}${Math.abs(pct)}%)`),
  ]);
};
// 함수형 컴포넌트는 props 를 선언해야 kebab 속성(good-up)이 camelCase(goodUp)로 매핑된다
DeltaCell.props = ["cur", "prev", "goodUp"];

const _now = new Date();
const year = ref(_now.getFullYear());
const month = ref(_now.getMonth() + 1);
const yearOptions = computed(() => {
  const y = _now.getFullYear();
  return [y + 1, y, y - 1, y - 2].map((v) => ({ value: v, label: `${v}${i18n.t("년")}` }));
});
const monthOptions = computed(() => Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}${i18n.t("월")}` })));

const metrics = [
  { key: "income", label: "수입", badge: "badge-success" },
  { key: "expense", label: "지출", badge: "badge-error" },
  { key: "net", label: "순액", badge: "badge-info" },
];

const data = ref({
  current: { income: 0, expense: 0, net: 0 },
  prevMonth: { income: 0, expense: 0, net: 0 },
  prevYear: { income: 0, expense: 0, net: 0 },
});

async function load() {
  data.value = await txnApi.compare({ year: year.value, month: month.value });
}

onMounted(load);
</script>

<style scoped>
.frep { margin: 0; }
.topbar { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1rem; }
.topbar > :nth-child(1) { width: 110px; flex: 0 0 auto; }
.topbar > :nth-child(2) { width: 90px; flex: 0 0 auto; }
.hint { font-size: 0.78rem; color: var(--text-subtle); margin-left: 0.3rem; }

.tbl td.strong { font-weight: 800; color: var(--text); }
.tbl tr.netrow td { background: var(--surface-2); }
:deep(.delta) { font-size: 0.8rem; font-weight: 700; white-space: nowrap; }
:deep(.delta small) { font-weight: 600; opacity: 0.8; }
:deep(.delta.good) { color: var(--positive); }
:deep(.delta.bad) { color: var(--danger); }
:deep(.delta.flat) { color: var(--text-subtle); }
</style>
