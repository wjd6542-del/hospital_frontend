<template>
  <div class="ins">
    <div class="cards">
      <div class="scard"><span class="lbl">{{ $t("청구 건수") }}</span><b class="val num">{{ summary.count }}<span class="unit">{{ $t("건") }}</span></b></div>
      <div class="scard claim"><span class="lbl">{{ $t("총 청구액") }}</span><b class="val num">{{ won(summary.total_claim) }}</b></div>
      <div class="scard paid"><span class="lbl">{{ $t("지급액") }}</span><b class="val num">{{ won(summary.total_paid) }}</b></div>
    </div>

    <div class="filterbar">
      <span class="f-label">{{ $t("기간") }}</span>
      <DateRangePicker v-model="range" mode="date" size="xs" @change="onRangeChange" />
      <span class="f-label">{{ $t("상태") }}</span>
      <SearchSelect v-model="filter.status" size="xs" :options="statusFilterOptions" :placeholder="$t('전체')" @change="load(1)" />
      <span class="f-label">{{ $t("보험자") }}</span>
      <SearchSelect v-model="filter.insurer" size="xs" :options="insurerFilterOptions" :placeholder="$t('전체')" @change="load(1)" />
      <input v-model="filter.q" class="field field-xs" style="width: 150px" :placeholder="$t('환자명 · 청구번호')" @keyup.enter="load(1)" />
      <button class="btn btn-xs" @click="load(1)">{{ $t("검색") }}</button>
      <button class="btn btn-xs btn-primary" style="margin-left: auto" @click="openNew">＋ {{ $t("청구 등록") }}</button>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("청구번호") }}</th>
            <th>{{ $t("환자명") }}</th>
            <th>{{ $t("보험자") }}</th>
            <th>{{ $t("청구일") }}</th>
            <th class="right">{{ $t("총진료비") }}</th>
            <th class="right">{{ $t("청구액") }}</th>
            <th>{{ $t("상태") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="8"><EmptyState icon="fa-file-invoice-dollar" :title="$t('보험청구가 없습니다')" :desc="$t('청구 등록 버튼으로 추가하세요.')" compact /></td>
          </tr>
          <tr v-for="r in rows" :key="r.id" class="rowclick" @click="openEdit(r)">
            <td class="num">{{ r.claim_no || "-" }}</td>
            <td class="strong">{{ r.patient_name }}</td>
            <td>{{ $t(INSURER[r.insurer] || r.insurer) }}</td>
            <td class="num">{{ ymd(r.claim_date) }}</td>
            <td class="num right">{{ won(r.total_amount) }}</td>
            <td class="num right strong">{{ won(r.claim_amount) }}</td>
            <td><span class="badge" :class="STATUS[r.status].cls">{{ $t(STATUS[r.status].label) }}</span></td>
            <td class="acts" @click.stop>
              <button v-if="r.status === 'DRAFT'" class="btn btn-xs btn-primary" :disabled="busy === r.id" @click="setStatus(r, 'CLAIMED')">{{ $t("청구") }}</button>
              <template v-if="r.status === 'CLAIMED'">
                <button class="btn btn-xs btn-primary" :disabled="busy === r.id" @click="setStatus(r, 'APPROVED')">{{ $t("승인") }}</button>
                <button class="btn btn-xs" :disabled="busy === r.id" @click="setStatus(r, 'REJECTED')">{{ $t("반려") }}</button>
              </template>
              <button v-if="r.status === 'APPROVED'" class="btn btn-xs btn-primary" :disabled="busy === r.id" @click="setStatus(r, 'PAID')">{{ $t("지급") }}</button>
              <button class="btn btn-xs" @click="openEdit(r)">{{ $t("수정") }}</button>
              <button class="btn btn-xs btn-ghost" :disabled="busy === r.id" @click="remove(r)">{{ $t("삭제") }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <Pager v-if="totalPages > 1" :page="page" :total="total" :total-pages="totalPages" @change="load" />
    </div>

    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel small">
        <header class="dhead"><h2>{{ form.id ? $t("청구 수정") : $t("보험청구 등록") }}</h2></header>
        <section class="sec">
          <div class="grid2">
            <label class="fld"><span class="form-label">{{ $t("환자명") }}<span class="req">*</span></span>
              <input v-model="form.patient_name" class="field" :placeholder="$t('환자명')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("청구번호") }}</span>
              <input v-model="form.claim_no" class="field" placeholder="CLM-001" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("보험자") }}<span class="req">*</span></span>
              <SearchSelect v-model="form.insurer" :options="insurerOptions" :clearable="false" :placeholder="$t('보험자 선택')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("청구일") }}<span class="req">*</span></span>
              <DatePicker v-model="form.claim_date" mode="date" :placeholder="$t('청구일')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("총진료비") }}</span>
              <input v-model.number="form.total_amount" type="number" min="0" class="field" :placeholder="$t('총진료비(원)')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("청구액") }}</span>
              <input v-model.number="form.claim_amount" type="number" min="0" class="field" :placeholder="$t('청구액(원)')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("부서") }}</span>
              <SearchSelect v-model="form.department_id" :options="deptOptions" :placeholder="$t('선택 안 함')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("상태") }}</span>
              <SearchSelect v-model="form.status" :options="statusOptions" :clearable="false" />
            </label>
          </div>
          <label class="fld"><span class="form-label">{{ $t("메모") }}</span>
            <textarea v-model="form.memo" class="field" rows="2" :placeholder="$t('메모(선택)')"></textarea>
          </label>
        </section>
        <footer class="dfoot">
          <span style="flex: 1"></span>
          <button class="btn btn-xs" @click="showForm = false">{{ $t("닫기") }}</button>
          <button class="btn btn-xs btn-primary" :disabled="saving" @click="save">{{ saving ? $t("저장 중…") : $t("저장") }}</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted } from "vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import DatePicker from "@/components/base/DatePicker.vue";
import DateRangePicker from "@/components/base/DateRangePicker.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import Pager from "@/components/base/Pager.vue";
import { claimApi } from "@/api/insurance";
import { departmentApi } from "@/api/hr";
import { formatDateOnly } from "@/utils/date";
import { useToast } from "vue-toastification";
import { useI18nStore } from "@/stores/i18n";

const toast = useToast();
const i18n = useI18nStore();

const INSURER = { HEALTH: "건강보험", MEDICAID: "의료급여", AUTO: "자동차보험", PRIVATE: "실손보험", OTHER: "기타" };
const STATUS = {
  DRAFT: { label: "작성", cls: "badge-neutral" },
  CLAIMED: { label: "청구", cls: "badge-info" },
  APPROVED: { label: "승인", cls: "badge-warning" },
  PAID: { label: "지급", cls: "badge-success" },
  REJECTED: { label: "반려", cls: "badge-error" },
};
const insurerOptions = computed(() => Object.entries(INSURER).map(([value, label]) => ({ value, label: i18n.t(label) })));
const insurerFilterOptions = computed(() => [{ value: null, label: i18n.t("전체") }, ...insurerOptions.value]);
const statusOptions = computed(() => Object.entries(STATUS).map(([value, s]) => ({ value, label: i18n.t(s.label) })));
const statusFilterOptions = computed(() => [{ value: null, label: i18n.t("전체") }, ...statusOptions.value]);

const won = (v) => `${Number(v || 0).toLocaleString()}${i18n.t("원")}`;
const ymd = (v) => (v ? String(v).slice(0, 10) : "-");

const rows = ref([]);
const total = ref(0);
const totalPages = ref(0);
const page = ref(1);
const limit = ref(30);
const busy = ref(null);
const saving = ref(false);
const showForm = ref(false);
const deptOptions = ref([]);
const summary = reactive({ byStatus: {}, count: 0, total_claim: 0, total_paid: 0 });

const filter = reactive({ date_from: null, date_to: null, status: null, insurer: null, q: "" });
const range = ref({ start: null, end: null });

function onRangeChange() {
  filter.date_from = range.value?.start ? formatDateOnly(range.value.start) : null;
  filter.date_to = range.value?.end ? formatDateOnly(range.value.end) : null;
  load(1);
}

const form = reactive({ id: null, claim_no: "", patient_name: "", insurer: "HEALTH", claim_date: "", total_amount: 0, claim_amount: 0, department_id: null, status: "DRAFT", memo: "" });

function openNew() {
  Object.assign(form, { id: null, claim_no: "", patient_name: "", insurer: "HEALTH", claim_date: formatDateOnly(new Date()), total_amount: 0, claim_amount: 0, department_id: null, status: "DRAFT", memo: "" });
  showForm.value = true;
}
function openEdit(r) {
  Object.assign(form, {
    id: r.id, claim_no: r.claim_no || "", patient_name: r.patient_name, insurer: r.insurer,
    claim_date: ymd(r.claim_date) === "-" ? "" : ymd(r.claim_date),
    total_amount: Number(r.total_amount), claim_amount: Number(r.claim_amount),
    department_id: r.department_id, status: r.status, memo: r.memo || "",
  });
  showForm.value = true;
}

async function load(p = page.value) {
  page.value = p;
  const [res, sum] = await Promise.all([
    claimApi.list({
      date_from: filter.date_from || undefined,
      date_to: filter.date_to || undefined,
      status: filter.status || undefined,
      insurer: filter.insurer || undefined,
      q: filter.q || undefined,
      page: p,
      limit: limit.value,
    }),
    claimApi.summary(),
  ]);
  rows.value = res.rows || [];
  total.value = res.total || 0;
  totalPages.value = res.totalPages || 0;
  Object.assign(summary, sum);
}

async function save() {
  if (!form.patient_name.trim() || !form.insurer || !form.claim_date) { toast.warning("환자명·보험자·청구일은 필수입니다."); return; }
  saving.value = true;
  try {
    await claimApi.save({
      id: form.id || undefined,
      claim_no: form.claim_no || undefined,
      patient_name: form.patient_name.trim(),
      insurer: form.insurer,
      claim_date: form.claim_date,
      total_amount: Number(form.total_amount) || 0,
      claim_amount: Number(form.claim_amount) || 0,
      department_id: form.department_id || undefined,
      status: form.status,
      memo: form.memo || undefined,
    });
    toast.success("저장되었습니다.");
    showForm.value = false;
    await load(form.id ? page.value : 1);
  } catch (e) {
    toast.error(e?.message || "저장에 실패했습니다.");
  } finally {
    saving.value = false;
  }
}

async function setStatus(r, status) {
  busy.value = r.id;
  try {
    await claimApi.setStatus(r.id, status);
    await load();
  } catch (e) {
    toast.error(e?.message || "상태 변경에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

async function remove(r) {
  if (!confirm("이 청구를 삭제하시겠습니까?")) return;
  busy.value = r.id;
  try {
    await claimApi.remove(r.id);
    toast.success("삭제되었습니다.");
    await load();
  } catch (e) {
    toast.error(e?.message || "삭제에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

onMounted(async () => {
  const depts = await departmentApi.options();
  deptOptions.value = depts.map((d) => ({ value: d.id, label: `${"　".repeat(d.depth)}${d.name}` }));
  await load(1);
});
</script>

<style scoped>
.ins { max-width: 1300px; margin: 0 auto; }
.cards { display: grid; grid-template-columns: 1fr 1.4fr 1.4fr; gap: 0.8rem; margin-bottom: 1rem; max-width: 720px; }
.scard { display: flex; flex-direction: column; gap: 0.3rem; padding: 0.8rem 1rem; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); box-shadow: var(--shadow-sm); }
.scard .lbl { font-size: 0.7rem; font-weight: 600; color: var(--text-subtle); }
.scard .val { font-size: 1.3rem; font-weight: 800; color: var(--text); }
.scard .val .unit { font-size: 0.8rem; font-weight: 600; color: var(--text-subtle); margin-left: 2px; }
.scard.claim { border-left: 3px solid var(--accent); }
.scard.claim .val { color: var(--accent); }
.scard.paid { border-left: 3px solid var(--positive); }
.scard.paid .val { color: var(--positive); }

.tbl td.strong { font-weight: 800; color: var(--text); }
.rowclick { cursor: pointer; }
.rowclick:hover td { background: var(--surface-2); }
.acts { display: flex; gap: 0.3rem; white-space: nowrap; }
.req { color: var(--danger); margin-left: 2px; }

.drawer { position: fixed; inset: 0; z-index: 70; background: rgba(15, 23, 42, 0.45); display: flex; justify-content: flex-end; }
.panel { width: 540px; max-width: 100%; height: 100%; overflow-y: auto; background: var(--surface); padding: 1.4rem 1.6rem; display: flex; flex-direction: column; }
.dhead { margin-bottom: 1.2rem; }
.dhead h2 { font-size: 1.1rem; font-weight: 700; color: var(--text); }
.sec { display: flex; flex-direction: column; gap: 0.7rem; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem 0.9rem; }
.fld { display: block; }
.dfoot { margin-top: auto; padding-top: 1.2rem; display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); }
</style>
