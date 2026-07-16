<template>
  <div class="wrd">
    <div class="cards">
      <div class="scard admit">
        <span class="lbl">{{ $t("재원 환자") }}</span>
        <b class="val num">{{ summary.admitted }}<span class="unit">{{ $t("명") }}</span></b>
      </div>
      <div class="scard">
        <span class="lbl">{{ $t("전체 기록") }}</span>
        <b class="val num">{{ summary.total }}<span class="unit">{{ $t("건") }}</span></b>
      </div>
    </div>

    <div class="filterbar">
      <span class="f-label">{{ $t("상태") }}</span>
      <SearchSelect v-model="filter.status" size="xs" :options="statusFilterOptions" :placeholder="$t('전체')" @change="load(1)" />
      <span class="f-label">{{ $t("부서") }}</span>
      <SearchSelect v-model="filter.department_id" size="xs" :options="deptOptions" :placeholder="$t('전체')" @change="load(1)" />
      <input v-model="filter.q" class="field field-xs" style="width: 160px" :placeholder="$t('환자명 · 병실 · 진단')" @keyup.enter="load(1)" />
      <button class="btn btn-xs" @click="load(1)">{{ $t("검색") }}</button>
      <button class="btn btn-xs btn-primary" style="margin-left: auto" @click="openNew">＋ {{ $t("입원 등록") }}</button>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("환자명") }}</th>
            <th>{{ $t("병실") }}</th>
            <th>{{ $t("부서") }}</th>
            <th>{{ $t("담당의") }}</th>
            <th>{{ $t("진단") }}</th>
            <th>{{ $t("입원일") }}</th>
            <th>{{ $t("퇴원일") }}</th>
            <th>{{ $t("상태") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="9"><EmptyState icon="fa-bed-pulse" :title="$t('입원 기록이 없습니다')" :desc="$t('입원 등록 버튼으로 입원 환자를 등록하세요.')" compact /></td>
          </tr>
          <tr v-for="r in rows" :key="r.id" class="rowclick" @click="openEdit(r)">
            <td class="strong">{{ r.patient_name }}</td>
            <td class="num">{{ r.room || "-" }}</td>
            <td>{{ r.department?.name || "-" }}</td>
            <td>{{ r.doctor?.name || "-" }}</td>
            <td>{{ r.diagnosis || "-" }}</td>
            <td class="num">{{ ymd(r.admitted_at) }}</td>
            <td class="num">{{ ymd(r.discharged_at) }}</td>
            <td><span class="badge" :class="STATUS[r.status].cls">{{ $t(STATUS[r.status].label) }}</span></td>
            <td class="acts" @click.stop>
              <button v-if="r.status === 'ADMITTED'" class="btn btn-xs btn-primary" :disabled="busy === r.id" @click="discharge(r)">{{ $t("퇴원") }}</button>
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
        <header class="dhead"><h2>{{ form.id ? $t("입원 수정") : $t("입원 등록") }}</h2></header>
        <section class="sec">
          <div class="grid2">
            <label class="fld"><span class="form-label">{{ $t("환자명") }}<span class="req">*</span></span>
              <input v-model="form.patient_name" class="field" :placeholder="$t('환자명')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("연락처") }}</span>
              <input v-model="form.patient_phone" class="field" placeholder="010-0000-0000" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("병실/병상") }}</span>
              <input v-model="form.room" class="field" placeholder="301-A" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("상태") }}</span>
              <SearchSelect v-model="form.status" :options="statusOptions" :clearable="false" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("부서") }}</span>
              <SearchSelect v-model="form.department_id" :options="deptOptions" :placeholder="$t('선택 안 함')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("담당의") }}</span>
              <SearchSelect v-model="form.doctor_id" :options="doctorOptions" :placeholder="$t('선택 안 함')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("입원일") }}<span class="req">*</span></span>
              <DatePicker v-model="form.admitted_at" mode="date" :placeholder="$t('입원일')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("퇴원일") }}</span>
              <DatePicker v-model="form.discharged_at" mode="date" :placeholder="$t('퇴원 시')" />
            </label>
          </div>
          <label class="fld"><span class="form-label">{{ $t("진단/사유") }}</span>
            <input v-model="form.diagnosis" class="field" :placeholder="$t('진단명')" />
          </label>
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
import EmptyState from "@/components/base/EmptyState.vue";
import Pager from "@/components/base/Pager.vue";
import { admissionApi } from "@/api/ward";
import { departmentApi, employeeApi } from "@/api/hr";
import { formatDateOnly } from "@/utils/date";
import { useToast } from "vue-toastification";
import { useI18nStore } from "@/stores/i18n";

const toast = useToast();
const i18n = useI18nStore();

const STATUS = {
  ADMITTED: { label: "입원중", cls: "badge-info" },
  DISCHARGED: { label: "퇴원", cls: "badge-neutral" },
};
const statusOptions = computed(() => Object.entries(STATUS).map(([value, s]) => ({ value, label: i18n.t(s.label) })));
const statusFilterOptions = computed(() => [{ value: null, label: i18n.t("전체") }, ...statusOptions.value]);

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
const doctorOptions = ref([]);
const summary = reactive({ admitted: 0, total: 0 });

const filter = reactive({ status: null, department_id: null, q: "" });

const form = reactive({ id: null, patient_name: "", patient_phone: "", room: "", status: "ADMITTED", department_id: null, doctor_id: null, admitted_at: "", discharged_at: "", diagnosis: "", memo: "" });

function openNew() {
  Object.assign(form, { id: null, patient_name: "", patient_phone: "", room: "", status: "ADMITTED", department_id: null, doctor_id: null, admitted_at: formatDateOnly(new Date()), discharged_at: "", diagnosis: "", memo: "" });
  showForm.value = true;
}
function openEdit(r) {
  Object.assign(form, {
    id: r.id, patient_name: r.patient_name, patient_phone: r.patient_phone || "", room: r.room || "",
    status: r.status, department_id: r.department_id, doctor_id: r.doctor_id,
    admitted_at: ymd(r.admitted_at) === "-" ? "" : ymd(r.admitted_at),
    discharged_at: ymd(r.discharged_at) === "-" ? "" : ymd(r.discharged_at),
    diagnosis: r.diagnosis || "", memo: r.memo || "",
  });
  showForm.value = true;
}

async function load(p = page.value) {
  page.value = p;
  const [res, sum] = await Promise.all([
    admissionApi.list({
      status: filter.status || undefined,
      department_id: filter.department_id || undefined,
      q: filter.q || undefined,
      page: p,
      limit: limit.value,
    }),
    admissionApi.summary(),
  ]);
  rows.value = res.rows || [];
  total.value = res.total || 0;
  totalPages.value = res.totalPages || 0;
  Object.assign(summary, sum);
}

async function save() {
  if (!form.patient_name.trim() || !form.admitted_at) { toast.warning("환자명·입원일은 필수입니다."); return; }
  saving.value = true;
  try {
    await admissionApi.save({
      id: form.id || undefined,
      patient_name: form.patient_name.trim(),
      patient_phone: form.patient_phone || undefined,
      room: form.room || undefined,
      status: form.status,
      department_id: form.department_id || undefined,
      doctor_id: form.doctor_id || undefined,
      admitted_at: form.admitted_at,
      discharged_at: form.discharged_at || undefined,
      diagnosis: form.diagnosis || undefined,
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

async function discharge(r) {
  if (!confirm(`'${r.patient_name}' 환자를 퇴원 처리하시겠습니까?`)) return;
  busy.value = r.id;
  try {
    await admissionApi.discharge(r.id, formatDateOnly(new Date()));
    toast.success("퇴원 처리되었습니다.");
    await load();
  } catch (e) {
    toast.error(e?.message || "퇴원 처리에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

async function remove(r) {
  if (!confirm("이 입원 기록을 삭제하시겠습니까?")) return;
  busy.value = r.id;
  try {
    await admissionApi.remove(r.id);
    toast.success("삭제되었습니다.");
    await load();
  } catch (e) {
    toast.error(e?.message || "삭제에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

onMounted(async () => {
  const [depts, emps] = await Promise.all([departmentApi.options(), employeeApi.options()]);
  deptOptions.value = depts.map((d) => ({ value: d.id, label: `${"　".repeat(d.depth)}${d.name}` }));
  doctorOptions.value = emps.map((e) => ({ value: e.id, label: `${e.name} (${e.emp_no})` }));
  await load(1);
});
</script>

<style scoped>
.wrd { max-width: 1300px; margin: 0 auto; }
.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-bottom: 1rem; max-width: 460px; }
.scard { display: flex; flex-direction: column; gap: 0.3rem; padding: 0.8rem 1rem; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); box-shadow: var(--shadow-sm); }
.scard .lbl { font-size: 0.7rem; font-weight: 600; color: var(--text-subtle); }
.scard .val { font-size: 1.4rem; font-weight: 800; color: var(--text); }
.scard .val .unit { font-size: 0.8rem; font-weight: 600; color: var(--text-subtle); margin-left: 2px; }
.scard.admit { border-left: 3px solid var(--accent); }
.scard.admit .val { color: var(--accent); }

.tbl td.strong { font-weight: 700; color: var(--text); }
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
