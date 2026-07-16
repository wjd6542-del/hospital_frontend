<template>
  <div class="enc">
    <header class="phead">
      <h1 class="ttl">{{ $t("수납·정산") }}</h1>
    </header>

    <div class="filterbar">
      <span class="f-label">{{ $t("상태") }}</span>
      <SearchSelect v-model="filter.status" size="xs" :options="statusFilterOptions" :placeholder="$t('전체')" @change="load(1)" />
      <span class="f-label">{{ $t("기간") }}</span>
      <DateRangePicker v-model="range" mode="date" size="xs" @change="onRangeChange" />
      <input v-model="filter.q" class="field field-xs" style="width: 180px" :placeholder="$t('환자 검색')" @keyup.enter="load(1)" />
      <button class="btn btn-xs" @click="load(1)">{{ $t("검색") }}</button>
      <button class="btn btn-xs btn-primary" style="margin-left: auto" @click="openNew">＋ {{ $t("수납 작성") }}</button>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("수납일") }}</th>
            <th>{{ $t("환자") }}</th>
            <th class="num">{{ $t("총액") }}</th>
            <th class="num">{{ $t("보험") }}</th>
            <th class="num">{{ $t("본인부담") }}</th>
            <th class="num">{{ $t("수납액") }}</th>
            <th>{{ $t("상태") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="8"><EmptyState icon="fa-receipt" :title="$t('수납 내역이 없습니다')" :desc="$t('수납 작성 버튼으로 새 수납을 등록하세요.')" compact /></td>
          </tr>
          <tr v-for="r in rows" :key="r.id" class="rowclick" @click="canEdit(r) && openEdit(r.id)">
            <td class="num">{{ ymd(r.billed_at) }}</td>
            <td>{{ r.patient?.name }} <span class="pno">{{ r.patient?.patient_no }}</span></td>
            <td class="num">{{ won(r.total_amount) }}</td>
            <td class="num">{{ won(r.insurance_amount) }}</td>
            <td class="num">{{ won(r.patient_amount) }}</td>
            <td class="num">{{ won(r.paid_amount) }}</td>
            <td><span class="badge" :class="STATUS[r.status]?.cls">{{ $t(STATUS[r.status]?.label || r.status) }}</span></td>
            <td class="acts" @click.stop>
              <template v-if="r.status === 'UNPAID' || r.status === 'PARTIAL'">
                <button class="btn btn-xs" @click="openEdit(r.id)">{{ $t("수정") }}</button>
                <button class="btn btn-xs btn-primary" @click="openPay(r.id)">{{ $t("수납") }}</button>
                <button class="btn btn-xs" :disabled="busy === r.id" @click="createClaim(r)">{{ $t("보험청구") }}</button>
                <button class="btn btn-xs btn-ghost" :disabled="busy === r.id" @click="cancel(r)">{{ $t("취소") }}</button>
              </template>
              <template v-else-if="r.status === 'PAID'">
                <button class="btn btn-xs" :disabled="busy === r.id" @click="createClaim(r)">{{ $t("보험청구") }}</button>
                <button class="btn btn-xs btn-ghost" :disabled="busy === r.id" @click="cancel(r)">{{ $t("취소") }}</button>
              </template>
              <template v-else-if="r.status === 'CANCELED'">
                <button class="btn btn-xs btn-ghost" :disabled="busy === r.id" @click="remove(r)">{{ $t("삭제") }}</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <Pager v-if="totalPages > 1" :page="page" :total="total" :total-pages="totalPages" @change="load" />
    </div>

    <!-- 수납 작성/수정 드로어 -->
    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel wide">
        <header class="dhead"><h2>{{ form.id ? $t("수납 수정") : $t("수납 작성") }}</h2></header>

        <section class="sec">
          <div class="grid2">
            <label class="fld"><span class="form-label">{{ $t("환자") }}<span class="req">*</span></span>
              <SearchSelect v-model="form.patient_id" :options="patientOptions" :placeholder="$t('환자 선택')" @change="onPatientPick" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("수납일") }}<span class="req">*</span></span>
              <DatePicker v-model="form.billed_at" mode="date" :placeholder="$t('수납일')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("진료 선택") }}</span>
              <div class="encpick">
                <SearchSelect v-model="pickEncounterId" :options="encounterOptions" :placeholder="encounterOptions.length ? $t('진료 선택(선택)') : $t('환자를 먼저 선택')" style="flex: 1" />
                <button class="btn btn-xs" :disabled="!pickEncounterId || suggesting" @click="applySuggest">{{ suggesting ? $t("산정 중…") : $t("산정") }}</button>
              </div>
            </label>
            <label class="fld"><span class="form-label">{{ $t("부서") }}</span>
              <SearchSelect v-model="form.department_id" :options="deptOptions" :placeholder="$t('선택 안 함')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("보험부담액") }}</span>
              <input v-model.number="form.insurance_amount" type="number" min="0" class="field" placeholder="0" />
            </label>
          </div>
          <label class="fld" style="margin-top: 0.7rem"><span class="form-label">{{ $t("메모") }}</span>
            <input v-model="form.memo" class="field" :placeholder="$t('메모(선택)')" />
          </label>
        </section>

        <section class="sec">
          <div class="itemhead">
            <span class="form-label">{{ $t("수납 항목") }}</span>
            <button class="btn btn-xs" @click="addItem">＋ {{ $t("항목 추가") }}</button>
          </div>
          <table class="itbl">
            <thead>
              <tr>
                <th style="width: 130px">{{ $t("구분") }}</th>
                <th>{{ $t("명칭") }}</th>
                <th style="width: 80px">{{ $t("수량") }}</th>
                <th style="width: 120px">{{ $t("단가") }}</th>
                <th style="width: 120px" class="num">{{ $t("금액") }}</th>
                <th style="width: 34px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, i) in form.items" :key="i">
                <td><SearchSelect v-model="it.category" size="xs" :options="categoryOptions" :placeholder="$t('구분')" /></td>
                <td><input v-model="it.name" class="cell-input" :placeholder="$t('명칭')" /></td>
                <td><input v-model.number="it.qty" type="number" min="0" class="cell-input" placeholder="1" /></td>
                <td><input v-model.number="it.unit_price" type="number" min="0" class="cell-input" placeholder="0" /></td>
                <td class="num rowamt">{{ won(lineAmount(it)) }}</td>
                <td><button class="irm" @click="form.items.splice(i, 1)"><i class="fa-solid fa-xmark"></i></button></td>
              </tr>
              <tr v-if="!form.items.length"><td colspan="6" class="iempty">{{ $t("항목을 추가하세요.") }}</td></tr>
            </tbody>
          </table>
        </section>

        <section class="sec summ">
          <div class="srow"><span>{{ $t("총액") }}</span><b class="num">{{ won(sumTotal) }}</b></div>
          <div class="srow"><span>{{ $t("보험부담") }}</span><b class="num">{{ won(insNum) }}</b></div>
          <div class="srow strong"><span>{{ $t("본인부담") }}</span><b class="num">{{ won(patientDue) }}</b></div>
        </section>

        <footer class="dfoot">
          <span style="flex: 1"></span>
          <button class="btn btn-xs" @click="showForm = false">{{ $t("닫기") }}</button>
          <button class="btn btn-xs btn-primary" :disabled="saving" @click="save">{{ saving ? $t("저장 중…") : $t("저장") }}</button>
        </footer>
      </div>
    </div>

    <!-- 수납 처리 드로어 -->
    <div v-if="showPay" class="drawer" @click.self="showPay = false">
      <div class="panel">
        <header class="dhead">
          <h2>{{ $t("수납 처리") }}</h2>
          <p class="dsub">{{ pay.patientName }} <span class="pno">{{ pay.patientNo }}</span></p>
        </header>

        <section class="sec">
          <div class="paylines">
            <div class="srow"><span>{{ $t("본인부담") }}</span><b class="num">{{ won(pay.patientAmount) }}</b></div>
            <div class="srow"><span>{{ $t("기수납") }}</span><b class="num">{{ won(pay.paidAmount) }}</b></div>
            <div class="srow strong"><span>{{ $t("미수납 잔액") }}</span><b class="num">{{ won(payBalance) }}</b></div>
          </div>
          <label class="fld" style="margin-top: 1rem"><span class="form-label">{{ $t("수납금액") }}<span class="req">*</span></span>
            <input v-model.number="pay.amount" type="number" min="0" class="field" placeholder="0" />
          </label>
          <label class="fld" style="margin-top: 0.7rem"><span class="form-label">{{ $t("수납수단") }}</span>
            <SearchSelect v-model="pay.method" :options="methodOptions" :clearable="false" />
          </label>
        </section>

        <footer class="dfoot">
          <span style="flex: 1"></span>
          <button class="btn btn-xs" @click="showPay = false">{{ $t("닫기") }}</button>
          <button class="btn btn-xs btn-primary" :disabled="paying" @click="submitPay">{{ paying ? $t("수납 중…") : $t("수납") }}</button>
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
import { billApi } from "@/api/billing";
import { patientApi, encounterApi } from "@/api/emr";
import { departmentApi } from "@/api/hr";
import { formatDateOnly } from "@/utils/date";
import { useToast } from "vue-toastification";
import { useI18nStore } from "@/stores/i18n";

const toast = useToast();
const i18n = useI18nStore();

const STATUS = {
  UNPAID: { label: "미수납", cls: "badge-warning" },
  PARTIAL: { label: "부분수납", cls: "badge-info" },
  PAID: { label: "완납", cls: "badge-success" },
  CANCELED: { label: "취소", cls: "badge-muted" },
};
const statusFilterOptions = computed(() => [
  { value: null, label: i18n.t("전체") },
  ...Object.entries(STATUS).map(([value, s]) => ({ value, label: i18n.t(s.label) })),
]);

const CATEGORY = ["진찰", "처방", "검사", "처치", "기타"];
const categoryOptions = computed(() => CATEGORY.map((v) => ({ value: v, label: i18n.t(v) })));

const METHOD = { CASH: "현금", CARD: "카드", TRANSFER: "이체", OTHER: "기타" };
const methodOptions = computed(() => Object.entries(METHOD).map(([value, label]) => ({ value, label: i18n.t(label) })));

const ymd = (v) => (v ? String(v).slice(0, 10) : "-");
const won = (v) => Number(v || 0).toLocaleString();
const canEdit = (r) => r.status === "UNPAID" || r.status === "PARTIAL";

const rows = ref([]);
const total = ref(0);
const totalPages = ref(0);
const page = ref(1);
const limit = ref(30);
const busy = ref(null);
const saving = ref(false);
const showForm = ref(false);
const showPay = ref(false);
const paying = ref(false);
const suggesting = ref(false);

const patientOptions = ref([]);
const deptOptions = ref([]);
const encounterOptions = ref([]);
const pickEncounterId = ref(null);

const filter = reactive({ status: null, date_from: null, date_to: null, q: "" });
const range = ref({ start: null, end: null });

function onRangeChange() {
  filter.date_from = range.value?.start ? formatDateOnly(range.value.start) : null;
  filter.date_to = range.value?.end ? formatDateOnly(range.value.end) : null;
  load(1);
}

// ---- 수납 작성/수정 ----
const blank = () => ({
  id: null,
  patient_id: null,
  encounter_id: null,
  department_id: null,
  billed_at: "",
  insurance_amount: null,
  memo: "",
  items: [],
});
const form = reactive(blank());

function reset(src = blank()) {
  Object.assign(form, blank(), src);
}

const lineAmount = (it) => (Number(it.qty ?? 1) || 0) * (Number(it.unit_price ?? 0) || 0);
const sumTotal = computed(() => form.items.reduce((s, it) => s + lineAmount(it), 0));
const insNum = computed(() => Number(form.insurance_amount || 0) || 0);
const patientDue = computed(() => Math.max(0, sumTotal.value - insNum.value));

function addItem() {
  form.items.push({ category: null, name: "", qty: null, unit_price: null });
}

async function loadEncounters(patientId) {
  encounterOptions.value = [];
  pickEncounterId.value = null;
  if (!patientId) return;
  const res = await encounterApi.list({ patient_id: patientId, limit: 100 });
  encounterOptions.value = (res.rows || []).map((e) => ({
    value: e.id,
    label: `${ymd(e.encounter_date)}${e.chief_complaint ? " · " + e.chief_complaint : ""}`,
  }));
}

async function onPatientPick() {
  await loadEncounters(form.patient_id);
}

async function applySuggest() {
  if (!pickEncounterId.value) return;
  suggesting.value = true;
  try {
    const s = await billApi.suggest(pickEncounterId.value);
    form.encounter_id = s.encounter_id ?? pickEncounterId.value;
    if (s.department_id) form.department_id = s.department_id;
    form.items = (s.items || []).map((it) => ({
      category: it.category ?? null,
      name: it.name || "",
      qty: it.qty ?? null,
      unit_price: it.unit_price ?? null,
    }));
    toast.success(i18n.t("진료 기준으로 산정했습니다."));
  } catch (e) {
    toast.error(e?.message || i18n.t("산정에 실패했습니다."));
  } finally {
    suggesting.value = false;
  }
}

async function load(p = page.value) {
  page.value = p;
  const res = await billApi.list({
    status: filter.status || undefined,
    date_from: filter.date_from || undefined,
    date_to: filter.date_to || undefined,
    q: filter.q || undefined,
    page: p,
    limit: limit.value,
  });
  rows.value = res.rows || [];
  total.value = res.total || 0;
  totalPages.value = res.totalPages || 0;
}

async function openNew() {
  reset({ billed_at: formatDateOnly(new Date()) });
  encounterOptions.value = [];
  pickEncounterId.value = null;
  showForm.value = true;
}

async function openEdit(id) {
  const e = await billApi.get(id);
  reset({
    id: e.id,
    patient_id: e.patient?.id ?? null,
    encounter_id: e.encounter?.id ?? null,
    department_id: e.department?.id ?? null,
    billed_at: e.billed_at ? String(e.billed_at).slice(0, 10) : "",
    insurance_amount: e.insurance_amount ?? null,
    memo: e.memo || "",
    items: (e.items || []).map((it) => ({
      category: it.category ?? null,
      name: it.name || "",
      qty: it.qty ?? null,
      unit_price: it.unit_price ?? null,
    })),
  });
  await loadEncounters(form.patient_id);
  showForm.value = true;
}

const num = (v) => (v === null || v === "" || v === undefined || Number.isNaN(v) ? undefined : Number(v));

async function save() {
  if (!form.patient_id || !form.billed_at) {
    toast.warning(i18n.t("환자·수납일은 필수입니다."));
    return;
  }
  const items = form.items.filter((it) => it.name?.trim());
  if (!items.length || items.some((it) => !it.name?.trim())) {
    toast.warning(i18n.t("각 항목의 명칭은 필수입니다."));
    return;
  }
  saving.value = true;
  try {
    await billApi.save({
      id: form.id || undefined,
      patient_id: form.patient_id,
      encounter_id: form.encounter_id || undefined,
      department_id: form.department_id || undefined,
      billed_at: form.billed_at,
      insurance_amount: num(form.insurance_amount),
      memo: form.memo || undefined,
      items: items.map((it) => ({
        category: it.category || undefined,
        name: it.name.trim(),
        qty: num(it.qty),
        unit_price: num(it.unit_price),
      })),
    });
    toast.success(i18n.t("저장되었습니다."));
    showForm.value = false;
    await load(form.id ? page.value : 1);
  } catch (e) {
    toast.error(e?.message || i18n.t("저장에 실패했습니다."));
  } finally {
    saving.value = false;
  }
}

// ---- 수납 처리 ----
const pay = reactive({ id: null, patientName: "", patientNo: "", patientAmount: 0, paidAmount: 0, amount: null, method: "CASH" });
const payBalance = computed(() => Math.max(0, Number(pay.patientAmount || 0) - Number(pay.paidAmount || 0)));

async function openPay(id) {
  const e = await billApi.get(id);
  pay.id = e.id;
  pay.patientName = e.patient?.name || "";
  pay.patientNo = e.patient?.patient_no || "";
  pay.patientAmount = e.patient_amount || 0;
  pay.paidAmount = e.paid_amount || 0;
  pay.amount = Math.max(0, Number(e.patient_amount || 0) - Number(e.paid_amount || 0));
  pay.method = "CASH";
  showPay.value = true;
}

async function submitPay() {
  const amount = Number(pay.amount);
  if (!amount || amount <= 0) {
    toast.warning(i18n.t("수납금액을 입력하세요."));
    return;
  }
  paying.value = true;
  try {
    await billApi.pay(pay.id, amount, pay.method);
    toast.success(i18n.t("수납되었습니다"));
    showPay.value = false;
    await load();
  } catch (e) {
    toast.error(e?.message || i18n.t("수납에 실패했습니다."));
  } finally {
    paying.value = false;
  }
}

// ---- 행 액션 ----
async function createClaim(r) {
  if (!confirm(i18n.t("이 수납으로 보험청구를 생성하시겠습니까?"))) return;
  busy.value = r.id;
  try {
    await billApi.createClaim(r.id);
    toast.success(i18n.t("보험청구가 생성되었습니다"));
    await load();
  } catch (e) {
    toast.error(e?.message || i18n.t("보험청구에 실패했습니다."));
  } finally {
    busy.value = null;
  }
}

async function cancel(r) {
  if (!confirm(i18n.t("이 수납을 취소하시겠습니까?"))) return;
  busy.value = r.id;
  try {
    await billApi.cancel(r.id);
    toast.success(i18n.t("취소되었습니다."));
    await load();
  } catch (e) {
    toast.error(e?.message || i18n.t("취소에 실패했습니다."));
  } finally {
    busy.value = null;
  }
}

async function remove(r) {
  if (!confirm(i18n.t("이 수납을 삭제하시겠습니까?"))) return;
  busy.value = r.id;
  try {
    await billApi.remove(r.id);
    toast.success(i18n.t("삭제되었습니다."));
    await load();
  } catch (e) {
    toast.error(e?.message || i18n.t("삭제에 실패했습니다."));
  } finally {
    busy.value = null;
  }
}

onMounted(async () => {
  const [patients, depts] = await Promise.all([
    patientApi.list({ limit: 500 }),
    departmentApi.options(),
  ]);
  patientOptions.value = (patients.rows || []).map((p) => ({ value: p.id, label: `${p.name} (${p.patient_no})` }));
  deptOptions.value = (depts || []).map((d) => ({ value: d.id, label: d.depth != null ? `${"　".repeat(d.depth)}${d.name}` : d.name }));
  await load(1);
});
</script>

<style scoped>
.enc { margin: 0; }
.phead { margin-bottom: 1.1rem; }
.ttl { font-size: 1.5rem; font-weight: 700; color: var(--text); }
.req { color: var(--danger); margin-left: 2px; }
.pno { color: var(--text-subtle); font-family: var(--font-num); font-size: 0.78rem; }

.rowclick { cursor: pointer; }
.rowclick:hover { background: var(--surface-2); }
.acts { display: flex; gap: 0.3rem; white-space: nowrap; }

.drawer { position: fixed; inset: 0; z-index: 70; background: rgba(15, 23, 42, 0.45); display: flex; justify-content: flex-end; }
.panel { width: 560px; max-width: 100%; height: 100%; overflow-y: auto; background: var(--surface); padding: 1.4rem 1.6rem; display: flex; flex-direction: column; }
.panel.wide { width: 920px; }
.dhead { margin-bottom: 1.2rem; }
.dhead h2 { font-size: 1.1rem; font-weight: 700; color: var(--text); }
.dsub { margin-top: 0.3rem; font-size: 0.82rem; color: var(--text-muted); }

.sec { margin-bottom: 1.4rem; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem 0.9rem; }
.fld { display: block; }
.encpick { display: flex; align-items: center; gap: 0.4rem; }

.itemhead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.itbl { width: 100%; border-collapse: collapse; }
.itbl th { text-align: left; font-size: 0.68rem; color: var(--text-subtle); font-weight: 600; padding: 0.3rem 0.4rem; border-bottom: 1px solid var(--border); }
.itbl th.num { text-align: right; }
.itbl td { padding: 0.25rem 0.35rem; vertical-align: middle; }
.rowamt { font-family: var(--font-num); color: var(--text); }
.irm { color: var(--text-subtle); width: 24px; height: 24px; }
.irm:hover { color: var(--danger); }
.iempty { text-align: center; color: var(--text-subtle); font-size: 0.8rem; padding: 0.8rem; }

.summ, .paylines { border: 1px solid var(--border); border-radius: var(--radius); padding: 0.7rem 0.9rem; display: flex; flex-direction: column; gap: 0.35rem; }
.srow { display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted); }
.srow b { font-family: var(--font-num); color: var(--text); }
.srow.strong { border-top: 1px solid var(--border); margin-top: 0.2rem; padding-top: 0.45rem; font-weight: 600; }
.srow.strong span, .srow.strong b { color: var(--text); font-size: 0.95rem; }

.dfoot { margin-top: auto; padding-top: 1.2rem; display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); }
</style>
