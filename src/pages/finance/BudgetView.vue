<template>
  <div class="fbud">
    <div class="topbar">
      <SearchSelect v-model="year" size="xs" :options="yearOptions" :clearable="false" @change="load" />
      <span class="hint">{{ $t("계정과목별 연간 예산을 편성하고 실적 대비 집행률을 확인합니다.") }}</span>
    </div>

    <!-- 요약 -->
    <div class="cards">
      <div class="scard income">
        <span class="lbl">{{ $t("수입 예산 · 실적") }}</span>
        <b class="val num">{{ won(sum.incomeActual) }} <span class="of">/ {{ won(sum.incomeBudget) }}</span></b>
      </div>
      <div class="scard expense">
        <span class="lbl">{{ $t("지출 예산 · 실적") }}</span>
        <b class="val num">{{ won(sum.expenseActual) }} <span class="of">/ {{ won(sum.expenseBudget) }}</span></b>
      </div>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th style="width: 90px">{{ $t("구분") }}</th>
            <th>{{ $t("계정과목") }}</th>
            <th class="right" style="width: 170px">{{ $t("예산") }}</th>
            <th class="right" style="width: 150px">{{ $t("실적") }}</th>
            <th class="right" style="width: 150px">{{ $t("잔액") }}</th>
            <th style="width: 220px">{{ $t("집행률") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="6"><EmptyState icon="fa-coins" :title="$t('계정과목이 없습니다')" :desc="$t('환경설정 > 계정과목에서 먼저 등록하세요.')" compact /></td>
          </tr>
          <tr v-for="r in rows" :key="r.account_item_id">
            <td>
              <span class="badge" :class="r.type === 'INCOME' ? 'badge-success' : 'badge-error'">
                {{ r.type === "INCOME" ? $t("수입") : $t("지출") }}
              </span>
            </td>
            <td>{{ r.name }}</td>
            <td class="right">
              <input
                v-model.number="r.budget"
                type="number"
                min="0"
                class="cell-input bin"
                @change="saveBudget(r)"
              />
            </td>
            <td class="num right">{{ won(r.actual) }}</td>
            <td class="num right" :class="r.remain < 0 ? 'neg' : ''">{{ won(r.remain) }}</td>
            <td>
              <div v-if="r.budget > 0" class="prog">
                <div class="bar"><div class="fill" :class="barClass(r)" :style="{ width: Math.min(pct(r), 100) + '%' }"></div></div>
                <span class="pct" :class="{ over: r.type === 'EXPENSE' && pct(r) > 100 }">{{ pct(r) }}%</span>
              </div>
              <span v-else class="muted">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from "vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import { budgetApi } from "@/api/finance";
import { useToast } from "vue-toastification";
import { useI18nStore } from "@/stores/i18n";

const toast = useToast();
const i18n = useI18nStore();

const won = (v) => `${Number(v || 0).toLocaleString()}${i18n.t("원")}`;

const _now = new Date();
const year = ref(_now.getFullYear());
const yearOptions = computed(() => {
  const y = _now.getFullYear();
  return [y + 1, y, y - 1, y - 2, y - 3].map((v) => ({ value: v, label: `${v}${i18n.t("년")}` }));
});

const rows = ref([]);

const sum = computed(() => {
  const s = { incomeBudget: 0, incomeActual: 0, expenseBudget: 0, expenseActual: 0 };
  for (const r of rows.value) {
    if (r.type === "INCOME") { s.incomeBudget += r.budget || 0; s.incomeActual += r.actual || 0; }
    else { s.expenseBudget += r.budget || 0; s.expenseActual += r.actual || 0; }
  }
  return s;
});

const pct = (r) => (r.budget > 0 ? Math.round((r.actual / r.budget) * 1000) / 10 : 0);
function barClass(r) {
  if (r.type === "EXPENSE") return pct(r) > 100 ? "over" : "exp";
  return "inc";
}

async function load() {
  rows.value = await budgetApi.list({ year: year.value });
}

async function saveBudget(r) {
  try {
    await budgetApi.save({ account_item_id: r.account_item_id, year: year.value, amount: Number(r.budget) || 0 });
    r.remain = (Number(r.budget) || 0) - r.actual;
  } catch (e) {
    toast.error(e?.message || "예산 저장에 실패했습니다.");
    await load();
  }
}

onMounted(load);
</script>

<style scoped>
.fbud { margin: 0; }
.topbar { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1rem; }
.topbar > :first-child { width: 110px; flex: 0 0 auto; }
.hint { font-size: 0.78rem; color: var(--text-subtle); }

.cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.8rem; margin-bottom: 1rem; }
.scard { display: flex; flex-direction: column; gap: 0.35rem; padding: 0.9rem 1.1rem; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); box-shadow: var(--shadow-sm); }
.scard .lbl { font-size: 0.72rem; font-weight: 600; color: var(--text-subtle); }
.scard .val { font-size: 1.2rem; font-weight: 800; }
.scard .val .of { font-size: 0.82rem; font-weight: 600; color: var(--text-subtle); }
.scard.income { border-left: 3px solid var(--positive); }
.scard.income .val { color: var(--positive); }
.scard.expense { border-left: 3px solid var(--danger); }
.scard.expense .val { color: var(--danger); }

.bin { max-width: 150px; text-align: right; }
.tbl td.neg { color: var(--danger); font-weight: 700; }
.muted { color: var(--text-subtle); }

.prog { display: flex; align-items: center; gap: 0.5rem; }
.bar { flex: 1; height: 8px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
.fill { height: 100%; border-radius: 999px; transition: width 0.2s; }
.fill.inc { background: var(--positive); }
.fill.exp { background: var(--accent); }
.fill.over { background: var(--danger); }
.pct { font-size: 0.72rem; font-weight: 700; color: var(--text-muted); min-width: 42px; text-align: right; }
.pct.over { color: var(--danger); }
</style>
