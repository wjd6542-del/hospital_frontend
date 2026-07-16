<template>
  <div class="enc">
    <header class="phead">
      <h1 class="ttl">{{ $t("진료") }}</h1>
    </header>

    <div class="filterbar">
      <span class="f-label">{{ $t("부서") }}</span>
      <SearchSelect v-model="filter.department_id" size="xs" :options="deptOptions" :placeholder="$t('전체')" @change="load(1)" />
      <span class="f-label">{{ $t("의사") }}</span>
      <SearchSelect v-model="filter.doctor_id" size="xs" :options="doctorOptions" :placeholder="$t('전체')" @change="load(1)" />
      <span class="f-label">{{ $t("상태") }}</span>
      <SearchSelect v-model="filter.status" size="xs" :options="statusFilterOptions" :placeholder="$t('전체')" @change="load(1)" />
      <span class="f-label">{{ $t("기간") }}</span>
      <DateRangePicker v-model="range" mode="date" size="xs" @change="onRangeChange" />
      <input v-model="filter.q" class="field field-xs" style="width: 160px" :placeholder="$t('환자명 · 번호')" @keyup.enter="load(1)" />
      <button class="btn btn-xs" @click="load(1)">{{ $t("검색") }}</button>
      <button class="btn btn-xs btn-primary" style="margin-left: auto" @click="openNew">＋ {{ $t("진료 작성") }}</button>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("진료일") }}</th>
            <th>{{ $t("환자") }}</th>
            <th>{{ $t("부서") }}</th>
            <th>{{ $t("의사") }}</th>
            <th>{{ $t("주호소") }}</th>
            <th>{{ $t("주상병") }}</th>
            <th>{{ $t("상태") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="8"><EmptyState icon="fa-stethoscope" :title="$t('진료 기록이 없습니다')" :desc="$t('진료 작성 버튼으로 새 진료를 등록하세요.')" compact /></td>
          </tr>
          <tr v-for="r in rows" :key="r.id" class="rowclick" @click="openEdit(r.id)">
            <td class="num">{{ ymd(r.encounter_date) }}</td>
            <td>{{ r.patient?.name }} <span class="pno">{{ r.patient?.patient_no }}</span></td>
            <td>{{ r.department?.name || "-" }}</td>
            <td>{{ r.doctor?.name || "-" }}</td>
            <td class="clip">{{ r.chief_complaint || "-" }}</td>
            <td>{{ primaryDx(r.diagnoses) }}</td>
            <td>
              <span v-if="r.status === 'CLOSED'" class="badge badge-success">{{ $t("완료") }}</span>
              <span v-else class="badge badge-warning">{{ $t("진료중") }}</span>
            </td>
            <td class="acts" @click.stop>
              <button class="btn btn-xs" @click="openEdit(r.id)">{{ $t("수정") }}</button>
              <button class="btn btn-xs btn-ghost" :disabled="busy === r.id" @click="remove(r)">{{ $t("삭제") }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <Pager v-if="totalPages > 1" :page="page" :total="total" :total-pages="totalPages" @change="load" />
    </div>

    <!-- 작성/수정 드로어 -->
    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel wide">
        <header class="dhead"><h2>{{ form.id ? $t("진료 수정") : $t("진료 작성") }}</h2></header>

        <section class="sec">
          <div class="grid2">
            <label class="fld"><span class="form-label">{{ $t("환자") }}<span class="req">*</span></span>
              <SearchSelect v-model="form.patient_id" :options="patientOptions" :placeholder="$t('환자 선택')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("진료일") }}<span class="req">*</span></span>
              <DatePicker v-model="form.encounter_date" mode="date" :placeholder="$t('진료일')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("부서") }}</span>
              <SearchSelect v-model="form.department_id" :options="deptOptions" :placeholder="$t('선택 안 함')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("의사") }}</span>
              <SearchSelect v-model="form.doctor_id" :options="doctorOptions" :placeholder="$t('선택 안 함')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("상태") }}</span>
              <SearchSelect v-model="form.status" :options="statusOptions" :clearable="false" />
            </label>
          </div>
          <label class="fld" style="margin-top: 0.7rem"><span class="form-label">{{ $t("주호소") }}</span>
            <input v-model="form.chief_complaint" class="field" :placeholder="$t('주호소(선택)')" />
          </label>
        </section>

        <section class="sec">
          <h3 class="sttl">{{ $t("SOAP") }}</h3>
          <div class="soap">
            <label class="fld"><span class="form-label">{{ $t("S 주관적") }}</span>
              <textarea v-model="form.subjective" class="field" rows="2" :placeholder="$t('주관적 정보')"></textarea>
            </label>
            <label class="fld"><span class="form-label">{{ $t("O 객관적") }}</span>
              <textarea v-model="form.objective" class="field" rows="2" :placeholder="$t('객관적 정보')"></textarea>
            </label>
            <label class="fld"><span class="form-label">{{ $t("A 평가") }}</span>
              <textarea v-model="form.assessment" class="field" rows="2" :placeholder="$t('평가')"></textarea>
            </label>
            <label class="fld"><span class="form-label">{{ $t("P 계획") }}</span>
              <textarea v-model="form.plan" class="field" rows="2" :placeholder="$t('계획')"></textarea>
            </label>
          </div>
        </section>

        <section class="sec">
          <h3 class="sttl">{{ $t("바이탈") }}</h3>
          <div class="vitals">
            <label class="vf"><span>{{ $t("수축기") }}</span><input v-model.number="form.bp_systolic" type="number" min="0" class="field field-xs" /></label>
            <label class="vf"><span>{{ $t("이완기") }}</span><input v-model.number="form.bp_diastolic" type="number" min="0" class="field field-xs" /></label>
            <label class="vf"><span>{{ $t("맥박") }}</span><input v-model.number="form.pulse" type="number" min="0" class="field field-xs" /></label>
            <label class="vf"><span>{{ $t("체온") }}</span><input v-model.number="form.temp" type="number" step="0.1" min="0" class="field field-xs" /></label>
            <label class="vf"><span>{{ $t("호흡") }}</span><input v-model.number="form.resp" type="number" min="0" class="field field-xs" /></label>
            <label class="vf"><span>SpO2</span><input v-model.number="form.spo2" type="number" min="0" class="field field-xs" /></label>
            <label class="vf"><span>{{ $t("신장") }}</span><input v-model.number="form.height" type="number" step="0.1" min="0" class="field field-xs" /></label>
            <label class="vf"><span>{{ $t("체중") }}</span><input v-model.number="form.weight" type="number" step="0.1" min="0" class="field field-xs" /></label>
          </div>
        </section>

        <section class="sec">
          <div class="itemhead">
            <span class="form-label">{{ $t("진단") }}</span>
            <button class="btn btn-xs" @click="addDx">＋ {{ $t("진단 추가") }}</button>
          </div>
          <table class="itbl">
            <thead>
              <tr><th style="width: 120px">{{ $t("상병코드") }}</th><th>{{ $t("진단명") }}</th><th style="width: 70px" class="ctr">{{ $t("주상병") }}</th><th style="width: 34px"></th></tr>
            </thead>
            <tbody>
              <tr v-for="(d, i) in form.diagnoses" :key="i">
                <td><input v-model="d.code" class="cell-input" :placeholder="$t('코드')" /></td>
                <td><input v-model="d.name" class="cell-input" :placeholder="$t('진단명')" /></td>
                <td class="ctr"><input type="radio" :checked="d.is_primary" @change="setPrimary(i)" /></td>
                <td><button class="irm" @click="form.diagnoses.splice(i, 1)"><i class="fa-solid fa-xmark"></i></button></td>
              </tr>
              <tr v-if="!form.diagnoses.length"><td colspan="4" class="iempty">{{ $t("진단을 추가하세요.") }}</td></tr>
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
import { patientApi, encounterApi } from "@/api/emr";
import { departmentApi, employeeApi } from "@/api/hr";
import { formatDateOnly } from "@/utils/date";
import { useToast } from "vue-toastification";
import { useI18nStore } from "@/stores/i18n";

const toast = useToast();
const i18n = useI18nStore();

const STATUS = {
  OPEN: { label: "진료중", cls: "badge-warning" },
  CLOSED: { label: "완료", cls: "badge-success" },
};
const statusOptions = computed(() => Object.entries(STATUS).map(([value, s]) => ({ value, label: i18n.t(s.label) })));
const statusFilterOptions = computed(() => [{ value: null, label: i18n.t("전체") }, ...statusOptions.value]);

const ymd = (v) => (v ? String(v).slice(0, 10) : "-");
const primaryDx = (dxs) => {
  const p = (dxs || []).find((d) => d.is_primary) || (dxs || [])[0];
  return p ? p.name : "-";
};

const rows = ref([]);
const total = ref(0);
const totalPages = ref(0);
const page = ref(1);
const limit = ref(30);
const busy = ref(null);
const saving = ref(false);
const showForm = ref(false);

const deptOptions = ref([]);
const doctorOptions = ref([]);
const patientOptions = ref([]);

const filter = reactive({ department_id: null, doctor_id: null, status: null, date_from: null, date_to: null, q: "" });
const range = ref({ start: null, end: null });

function onRangeChange() {
  filter.date_from = range.value?.start ? formatDateOnly(range.value.start) : null;
  filter.date_to = range.value?.end ? formatDateOnly(range.value.end) : null;
  load(1);
}

const blank = () => ({
  id: null,
  patient_id: null,
  department_id: null,
  doctor_id: null,
  encounter_date: "",
  status: "OPEN",
  chief_complaint: "",
  subjective: "",
  objective: "",
  assessment: "",
  plan: "",
  bp_systolic: null,
  bp_diastolic: null,
  pulse: null,
  temp: null,
  resp: null,
  spo2: null,
  height: null,
  weight: null,
  memo: "",
  diagnoses: [],
});
const form = reactive(blank());

function reset(src = blank()) {
  Object.assign(form, blank(), src);
}

function addDx() {
  form.diagnoses.push({ code: "", name: "", is_primary: !form.diagnoses.length, note: "" });
}
function setPrimary(i) {
  form.diagnoses.forEach((d, idx) => (d.is_primary = idx === i));
}

async function load(p = page.value) {
  page.value = p;
  const res = await encounterApi.list({
    department_id: filter.department_id || undefined,
    doctor_id: filter.doctor_id || undefined,
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

function openNew() {
  reset({ encounter_date: formatDateOnly(new Date()) });
  showForm.value = true;
}

async function openEdit(id) {
  const e = await encounterApi.get(id);
  reset({
    id: e.id,
    patient_id: e.patient?.id ?? null,
    department_id: e.department?.id ?? null,
    doctor_id: e.doctor?.id ?? null,
    encounter_date: e.encounter_date ? String(e.encounter_date).slice(0, 10) : "",
    status: e.status || "OPEN",
    chief_complaint: e.chief_complaint || "",
    subjective: e.subjective || "",
    objective: e.objective || "",
    assessment: e.assessment || "",
    plan: e.plan || "",
    bp_systolic: e.bp_systolic ?? null,
    bp_diastolic: e.bp_diastolic ?? null,
    pulse: e.pulse ?? null,
    temp: e.temp ?? null,
    resp: e.resp ?? null,
    spo2: e.spo2 ?? null,
    height: e.height ?? null,
    weight: e.weight ?? null,
    memo: e.memo || "",
    diagnoses: (e.diagnoses || []).map((d) => ({ code: d.code || "", name: d.name || "", is_primary: !!d.is_primary, note: d.note || "" })),
  });
  showForm.value = true;
}

// 빈 숫자 필드는 아예 보내지 않는다
const num = (v) => (v === null || v === "" || v === undefined || Number.isNaN(v) ? undefined : Number(v));

async function save() {
  if (!form.patient_id || !form.encounter_date) {
    toast.warning("환자·진료일은 필수입니다.");
    return;
  }
  saving.value = true;
  try {
    await encounterApi.save({
      id: form.id || undefined,
      patient_id: form.patient_id,
      department_id: form.department_id || undefined,
      doctor_id: form.doctor_id || undefined,
      encounter_date: form.encounter_date,
      status: form.status,
      chief_complaint: form.chief_complaint || undefined,
      subjective: form.subjective || undefined,
      objective: form.objective || undefined,
      assessment: form.assessment || undefined,
      plan: form.plan || undefined,
      bp_systolic: num(form.bp_systolic),
      bp_diastolic: num(form.bp_diastolic),
      pulse: num(form.pulse),
      temp: num(form.temp),
      resp: num(form.resp),
      spo2: num(form.spo2),
      height: num(form.height),
      weight: num(form.weight),
      memo: form.memo || undefined,
      diagnoses: form.diagnoses
        .filter((d) => d.name?.trim() || d.code?.trim())
        .map((d) => ({ code: d.code?.trim() || undefined, name: d.name?.trim() || "", is_primary: !!d.is_primary, note: d.note || undefined })),
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

async function remove(r) {
  if (!confirm("이 진료 기록을 삭제하시겠습니까?")) return;
  busy.value = r.id;
  try {
    await encounterApi.remove(r.id);
    toast.success("삭제되었습니다.");
    await load();
  } catch (e) {
    toast.error(e?.message || "삭제에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

onMounted(async () => {
  const [depts, docs, patients] = await Promise.all([
    departmentApi.options(),
    employeeApi.options(),
    patientApi.list({ limit: 500 }),
  ]);
  deptOptions.value = depts.map((d) => ({ value: d.id, label: `${"　".repeat(d.depth)}${d.name}` }));
  doctorOptions.value = docs.map((e) => ({ value: e.id, label: e.emp_no ? `${e.name} (${e.emp_no})` : e.name }));
  patientOptions.value = (patients.rows || []).map((p) => ({ value: p.id, label: `${p.name} (${p.patient_no})` }));
  await load(1);
});
</script>

<style scoped>
.enc { margin: 0; }
.phead { margin-bottom: 1.1rem; }
.ttl { font-size: 1.5rem; font-weight: 700; color: var(--text); }
.req { color: var(--danger); margin-left: 2px; }
.pno { color: var(--text-subtle); font-family: var(--font-num); font-size: 0.78rem; }
.clip { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.rowclick { cursor: pointer; }
.rowclick:hover { background: var(--surface-2); }
.acts { display: flex; gap: 0.3rem; white-space: nowrap; }

.drawer { position: fixed; inset: 0; z-index: 70; background: rgba(15, 23, 42, 0.45); display: flex; justify-content: flex-end; }
.panel { width: 560px; max-width: 100%; height: 100%; overflow-y: auto; background: var(--surface); padding: 1.4rem 1.6rem; display: flex; flex-direction: column; }
.panel.wide { width: 720px; }
.dhead { margin-bottom: 1.2rem; }
.dhead h2 { font-size: 1.1rem; font-weight: 700; color: var(--text); }

.sec { margin-bottom: 1.4rem; }
.sttl { font-size: 0.88rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.7rem; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem 0.9rem; }
.fld { display: block; }
.soap { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem 0.9rem; }

.vitals { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.6rem 0.8rem; }
.vf { display: flex; flex-direction: column; gap: 0.2rem; }
.vf span { font-size: 0.72rem; color: var(--text-subtle); }

.itemhead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.itbl { width: 100%; border-collapse: collapse; }
.itbl th { text-align: left; font-size: 0.68rem; color: var(--text-subtle); font-weight: 600; padding: 0.3rem 0.4rem; border-bottom: 1px solid var(--border); }
.itbl th.ctr { text-align: center; }
.itbl td { padding: 0.25rem 0.35rem; vertical-align: middle; }
.itbl td.ctr { text-align: center; }
.irm { color: var(--text-subtle); width: 24px; height: 24px; }
.irm:hover { color: var(--danger); }
.iempty { text-align: center; color: var(--text-subtle); font-size: 0.8rem; padding: 0.8rem; }

.dfoot { margin-top: auto; padding-top: 1.2rem; display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); }
</style>
