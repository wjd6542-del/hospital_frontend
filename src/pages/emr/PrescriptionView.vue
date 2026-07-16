<template>
  <div class="enc">
    <header class="phead">
      <h1 class="ttl">{{ $t("처방") }}</h1>
    </header>

    <div class="filterbar">
      <span class="f-label">{{ $t("상태") }}</span>
      <SearchSelect v-model="filter.status" size="xs" :options="statusFilterOptions" :placeholder="$t('전체')" @change="load(1)" />
      <span class="f-label">{{ $t("구분") }}</span>
      <SearchSelect v-model="filter.type" size="xs" :options="typeFilterOptions" :placeholder="$t('전체')" @change="load(1)" />
      <span class="f-label">{{ $t("기간") }}</span>
      <DateRangePicker v-model="range" mode="date" size="xs" @change="onRangeChange" />
      <input v-model="filter.q" class="field field-xs" style="width: 180px" :placeholder="$t('환자 · 약품 검색')" @keyup.enter="load(1)" />
      <button class="btn btn-xs" @click="load(1)">{{ $t("검색") }}</button>
      <button class="btn btn-xs btn-primary" style="margin-left: auto" @click="openNew">＋ {{ $t("처방 작성") }}</button>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("처방일") }}</th>
            <th>{{ $t("환자") }}</th>
            <th>{{ $t("구분") }}</th>
            <th>{{ $t("약품") }}</th>
            <th>{{ $t("상태") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="6"><EmptyState icon="fa-prescription" :title="$t('처방 내역이 없습니다')" :desc="$t('처방 작성 버튼으로 새 처방을 등록하세요.')" compact /></td>
          </tr>
          <tr v-for="r in rows" :key="r.id" class="rowclick" @click="canEdit(r) && openEdit(r.id)">
            <td class="num">{{ ymd(r.prescribed_at) }}</td>
            <td>{{ r.patient?.name }} <span class="pno">{{ r.patient?.patient_no }}</span></td>
            <td>{{ r.type === "EXTERNAL" ? $t("원외") : $t("원내") }}</td>
            <td class="clip">{{ drugSummary(r.items) }}</td>
            <td><span class="badge" :class="STATUS[r.status]?.cls">{{ $t(STATUS[r.status]?.label || r.status) }}</span></td>
            <td class="acts" @click.stop>
              <template v-if="r.status === 'DRAFT' || r.status === 'ISSUED'">
                <button class="btn btn-xs" @click="openEdit(r.id)">{{ $t("수정") }}</button>
                <button class="btn btn-xs btn-primary" :disabled="busy === r.id" @click="dispense(r)">{{ $t("조제") }}</button>
                <button class="btn btn-xs btn-ghost" :disabled="busy === r.id" @click="cancel(r)">{{ $t("취소") }}</button>
              </template>
              <template v-else-if="r.status === 'DISPENSED'">
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

    <!-- 작성/수정 드로어 -->
    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel wide">
        <header class="dhead"><h2>{{ form.id ? $t("처방 수정") : $t("처방 작성") }}</h2></header>

        <section class="sec">
          <div class="grid2">
            <label class="fld"><span class="form-label">{{ $t("환자") }}<span class="req">*</span></span>
              <SearchSelect v-model="form.patient_id" :options="patientOptions" :placeholder="$t('환자 선택')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("처방일") }}<span class="req">*</span></span>
              <DatePicker v-model="form.prescribed_at" mode="date" :placeholder="$t('처방일')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("의사") }}</span>
              <SearchSelect v-model="form.doctor_id" :options="doctorOptions" :placeholder="$t('선택 안 함')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("구분") }}</span>
              <SearchSelect v-model="form.type" :options="typeOptions" :clearable="false" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("상태") }}</span>
              <SearchSelect v-model="form.status" :options="statusFormOptions" :clearable="false" />
            </label>
          </div>
          <label class="fld" style="margin-top: 0.7rem"><span class="form-label">{{ $t("메모") }}</span>
            <input v-model="form.memo" class="field" :placeholder="$t('메모(선택)')" />
          </label>
        </section>

        <section class="sec">
          <div class="itemhead">
            <span class="form-label">{{ $t("약품") }}</span>
            <button class="btn btn-xs" @click="addItem">＋ {{ $t("약품 추가") }}</button>
          </div>
          <table class="itbl">
            <thead>
              <tr>
                <th style="width: 160px">{{ $t("약품") }}</th>
                <th>{{ $t("약품명") }}</th>
                <th style="width: 80px">{{ $t("용량") }}</th>
                <th style="width: 80px">{{ $t("횟수") }}</th>
                <th style="width: 70px">{{ $t("투약일수") }}</th>
                <th style="width: 100px">{{ $t("경로") }}</th>
                <th style="width: 70px">{{ $t("총량") }}</th>
                <th>{{ $t("복약지도") }}</th>
                <th style="width: 34px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, i) in form.items" :key="i">
                <td><SearchSelect v-model="it.item_id" size="xs" :options="drugOptions" :placeholder="$t('선택')" @change="onDrugPick(it)" /></td>
                <td><input v-model="it.drug_name" class="cell-input" :placeholder="$t('약품명')" /></td>
                <td><input v-model="it.dosage" class="cell-input" :placeholder="$t('용량')" /></td>
                <td><input v-model="it.frequency" class="cell-input" :placeholder="$t('횟수')" /></td>
                <td><input v-model.number="it.duration_days" type="number" min="0" class="cell-input" placeholder="0" /></td>
                <td><SearchSelect v-model="it.route" size="xs" :options="routeOptions" :placeholder="$t('경로')" /></td>
                <td><input v-model.number="it.qty" type="number" min="0" class="cell-input" placeholder="0" /></td>
                <td><input v-model="it.instruction" class="cell-input" :placeholder="$t('복약지도')" /></td>
                <td><button class="irm" @click="form.items.splice(i, 1)"><i class="fa-solid fa-xmark"></i></button></td>
              </tr>
              <tr v-if="!form.items.length"><td colspan="9" class="iempty">{{ $t("약품을 추가하세요.") }}</td></tr>
            </tbody>
          </table>
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
import { prescriptionApi } from "@/api/prescription";
import { patientApi } from "@/api/emr";
import { employeeApi } from "@/api/hr";
import { itemApi } from "@/api/inventory";
import { formatDateOnly } from "@/utils/date";
import { useToast } from "vue-toastification";
import { useI18nStore } from "@/stores/i18n";

const toast = useToast();
const i18n = useI18nStore();

const STATUS = {
  DRAFT: { label: "작성", cls: "badge-neutral" },
  ISSUED: { label: "발행", cls: "badge-warning" },
  DISPENSED: { label: "조제완료", cls: "badge-success" },
  CANCELED: { label: "취소", cls: "badge-muted" },
};
const statusFilterOptions = computed(() => [
  { value: null, label: i18n.t("전체") },
  ...Object.entries(STATUS).map(([value, s]) => ({ value, label: i18n.t(s.label) })),
]);
// save 로는 DRAFT/ISSUED 만 허용
const statusFormOptions = computed(() => [
  { value: "DRAFT", label: i18n.t("작성") },
  { value: "ISSUED", label: i18n.t("발행") },
]);

const TYPE = { INTERNAL: "원내", EXTERNAL: "원외" };
const typeOptions = computed(() => Object.entries(TYPE).map(([value, label]) => ({ value, label: i18n.t(label) })));
const typeFilterOptions = computed(() => [{ value: null, label: i18n.t("전체") }, ...typeOptions.value]);

const routeOptions = computed(() => ["경구", "주사", "외용"].map((v) => ({ value: v, label: i18n.t(v) })));

const ymd = (v) => (v ? String(v).slice(0, 10) : "-");
const drugSummary = (items) => {
  const list = items || [];
  if (!list.length) return "-";
  const first = list[0].drug_name || list[0].item?.name || "-";
  return list.length > 1 ? `${first} ${i18n.t("외")} ${list.length - 1}${i18n.t("건")}` : first;
};
const canEdit = (r) => r.status === "DRAFT" || r.status === "ISSUED";

const rows = ref([]);
const total = ref(0);
const totalPages = ref(0);
const page = ref(1);
const limit = ref(30);
const busy = ref(null);
const saving = ref(false);
const showForm = ref(false);

const doctorOptions = ref([]);
const patientOptions = ref([]);
const drugOptions = ref([]);
const drugMap = ref({});

const filter = reactive({ status: null, type: null, date_from: null, date_to: null, q: "" });
const range = ref({ start: null, end: null });

function onRangeChange() {
  filter.date_from = range.value?.start ? formatDateOnly(range.value.start) : null;
  filter.date_to = range.value?.end ? formatDateOnly(range.value.end) : null;
  load(1);
}

const blank = () => ({
  id: null,
  patient_id: null,
  doctor_id: null,
  prescribed_at: "",
  type: "INTERNAL",
  status: "DRAFT",
  memo: "",
  items: [],
});
const form = reactive(blank());

function reset(src = blank()) {
  Object.assign(form, blank(), src);
}

function addItem() {
  form.items.push({ item_id: null, drug_name: "", dosage: "", frequency: "", duration_days: null, route: null, qty: null, instruction: "" });
}
function onDrugPick(it) {
  const name = drugMap.value[it.item_id];
  if (name) it.drug_name = name;
}

async function load(p = page.value) {
  page.value = p;
  const res = await prescriptionApi.list({
    status: filter.status || undefined,
    type: filter.type || undefined,
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

function openNew() {
  reset({ prescribed_at: formatDateOnly(new Date()) });
  showForm.value = true;
}

async function openEdit(id) {
  const e = await prescriptionApi.get(id);
  reset({
    id: e.id,
    patient_id: e.patient?.id ?? null,
    doctor_id: e.doctor?.id ?? null,
    prescribed_at: e.prescribed_at ? String(e.prescribed_at).slice(0, 10) : "",
    type: e.type || "INTERNAL",
    status: e.status === "ISSUED" ? "ISSUED" : "DRAFT",
    memo: e.memo || "",
    items: (e.items || []).map((it) => ({
      item_id: it.item_id ?? null,
      drug_name: it.drug_name || "",
      dosage: it.dosage || "",
      frequency: it.frequency || "",
      duration_days: it.duration_days ?? null,
      route: it.route || null,
      qty: it.qty ?? null,
      instruction: it.instruction || "",
    })),
  });
  showForm.value = true;
}

// 빈 숫자 필드는 아예 보내지 않는다
const num = (v) => (v === null || v === "" || v === undefined || Number.isNaN(v) ? undefined : Number(v));

async function save() {
  if (!form.patient_id || !form.prescribed_at) {
    toast.warning("환자·처방일은 필수입니다.");
    return;
  }
  const items = form.items.filter((it) => it.drug_name?.trim() || it.item_id);
  if (!items.length || items.some((it) => !it.drug_name?.trim())) {
    toast.warning("각 약품 행의 약품명은 필수입니다.");
    return;
  }
  saving.value = true;
  try {
    await prescriptionApi.save({
      id: form.id || undefined,
      patient_id: form.patient_id,
      doctor_id: form.doctor_id || undefined,
      prescribed_at: form.prescribed_at,
      type: form.type,
      status: form.status,
      memo: form.memo || undefined,
      items: items.map((it) => ({
        item_id: it.item_id || undefined,
        drug_name: it.drug_name.trim(),
        dosage: it.dosage || undefined,
        frequency: it.frequency || undefined,
        duration_days: num(it.duration_days),
        route: it.route || undefined,
        qty: num(it.qty),
        instruction: it.instruction || undefined,
      })),
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

async function dispense(r) {
  if (!confirm("이 처방을 조제하시겠습니까? (재고 차감)")) return;
  busy.value = r.id;
  try {
    await prescriptionApi.dispense(r.id);
    toast.success("조제되었습니다 (재고 차감)");
    await load();
  } catch (e) {
    toast.error(e?.message || "조제에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

async function cancel(r) {
  if (!confirm("이 처방을 취소하시겠습니까?")) return;
  busy.value = r.id;
  try {
    await prescriptionApi.cancel(r.id);
    toast.success("취소되었습니다.");
    await load();
  } catch (e) {
    toast.error(e?.message || "취소에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

async function remove(r) {
  if (!confirm("이 처방을 삭제하시겠습니까?")) return;
  busy.value = r.id;
  try {
    await prescriptionApi.remove(r.id);
    toast.success("삭제되었습니다.");
    await load();
  } catch (e) {
    toast.error(e?.message || "삭제에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

onMounted(async () => {
  const [docs, patients, items] = await Promise.all([
    employeeApi.options(),
    patientApi.list({ limit: 500 }),
    itemApi.list(),
  ]);
  doctorOptions.value = docs.map((e) => ({ value: e.id, label: e.emp_no ? `${e.name} (${e.emp_no})` : e.name }));
  patientOptions.value = (patients.rows || []).map((p) => ({ value: p.id, label: `${p.name} (${p.patient_no})` }));
  const itemRows = Array.isArray(items) ? items : items?.rows || [];
  drugOptions.value = itemRows.map((it) => ({ value: it.id, label: it.name }));
  drugMap.value = Object.fromEntries(itemRows.map((it) => [it.id, it.name]));
  await load(1);
});
</script>

<style scoped>
.enc { max-width: 1300px; margin: 0 auto; }
.phead { margin-bottom: 1.1rem; }
.ttl { font-size: 1.5rem; font-weight: 700; color: var(--text); }
.req { color: var(--danger); margin-left: 2px; }
.pno { color: var(--text-subtle); font-family: var(--font-num); font-size: 0.78rem; }
.clip { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.rowclick { cursor: pointer; }
.rowclick:hover { background: var(--surface-2); }
.acts { display: flex; gap: 0.3rem; white-space: nowrap; }

.drawer { position: fixed; inset: 0; z-index: 70; background: rgba(15, 23, 42, 0.45); display: flex; justify-content: flex-end; }
.panel { width: 560px; max-width: 100%; height: 100%; overflow-y: auto; background: var(--surface); padding: 1.4rem 1.6rem; display: flex; flex-direction: column; }
.panel.wide { width: 960px; }
.dhead { margin-bottom: 1.2rem; }
.dhead h2 { font-size: 1.1rem; font-weight: 700; color: var(--text); }

.sec { margin-bottom: 1.4rem; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem 0.9rem; }
.fld { display: block; }

.itemhead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.itbl { width: 100%; border-collapse: collapse; }
.itbl th { text-align: left; font-size: 0.68rem; color: var(--text-subtle); font-weight: 600; padding: 0.3rem 0.4rem; border-bottom: 1px solid var(--border); }
.itbl td { padding: 0.25rem 0.35rem; vertical-align: middle; }
.irm { color: var(--text-subtle); width: 24px; height: 24px; }
.irm:hover { color: var(--danger); }
.iempty { text-align: center; color: var(--text-subtle); font-size: 0.8rem; padding: 0.8rem; }

.dfoot { margin-top: auto; padding-top: 1.2rem; display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); }
</style>
