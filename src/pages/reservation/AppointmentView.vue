<template>
  <div class="rsv">
    <div class="filterbar">
      <span class="f-label">{{ $t("기간") }}</span>
      <DateRangePicker v-model="range" mode="date" size="xs" @change="onRangeChange" />
      <span class="f-label">{{ $t("상태") }}</span>
      <SearchSelect v-model="filter.status" size="xs" :options="statusFilterOptions" :placeholder="$t('전체')" @change="load(1)" />
      <span class="f-label">{{ $t("부서") }}</span>
      <SearchSelect v-model="filter.department_id" size="xs" :options="deptOptions" :placeholder="$t('전체')" @change="load(1)" />
      <input v-model="filter.q" class="field field-xs" style="width: 150px" :placeholder="$t('환자명 · 연락처')" @keyup.enter="load(1)" />
      <button class="btn btn-xs" @click="load(1)">{{ $t("검색") }}</button>
      <button class="btn btn-xs btn-primary" style="margin-left: auto" @click="openNew">＋ {{ $t("예약 등록") }}</button>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("예약일시") }}</th>
            <th>{{ $t("환자명") }}</th>
            <th>{{ $t("연락처") }}</th>
            <th>{{ $t("부서") }}</th>
            <th>{{ $t("담당의") }}</th>
            <th>{{ $t("상태") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="7"><EmptyState icon="fa-calendar-check" :title="$t('예약이 없습니다')" :desc="$t('예약 등록 버튼으로 진료 예약을 추가하세요.')" compact /></td>
          </tr>
          <tr v-for="r in rows" :key="r.id" class="rowclick" @click="openEdit(r)">
            <td class="num">{{ dt(r.reserved_at) }}</td>
            <td class="strong">{{ r.patient_name }}</td>
            <td class="num">{{ r.patient_phone || "-" }}</td>
            <td>{{ r.department?.name || "-" }}</td>
            <td>{{ r.doctor?.name || "-" }}</td>
            <td><span class="badge" :class="STATUS[r.status].cls">{{ $t(STATUS[r.status].label) }}</span></td>
            <td class="acts" @click.stop>
              <template v-if="r.status === 'BOOKED'">
                <button class="btn btn-xs btn-primary" :disabled="busy === r.id" @click="setStatus(r, 'VISITED')">{{ $t("방문") }}</button>
                <button class="btn btn-xs" :disabled="busy === r.id" @click="setStatus(r, 'NOSHOW')">{{ $t("노쇼") }}</button>
              </template>
              <button class="btn btn-xs" @click="openEdit(r)">{{ $t("수정") }}</button>
              <button v-if="r.status === 'BOOKED'" class="btn btn-xs btn-ghost" :disabled="busy === r.id" @click="setStatus(r, 'CANCELED')">{{ $t("취소") }}</button>
              <button class="btn btn-xs btn-ghost" :disabled="busy === r.id" @click="remove(r)">{{ $t("삭제") }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <Pager v-if="totalPages > 1" :page="page" :total="total" :total-pages="totalPages" @change="load" />
    </div>

    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel small">
        <header class="dhead"><h2>{{ form.id ? $t("예약 수정") : $t("진료 예약 등록") }}</h2></header>
        <section class="sec">
          <div class="grid2">
            <label class="fld"><span class="form-label">{{ $t("환자명") }}<span class="req">*</span></span>
              <input v-model="form.patient_name" class="field" :placeholder="$t('환자명')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("연락처") }}</span>
              <input v-model="form.patient_phone" class="field" placeholder="010-0000-0000" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("예약일시") }}<span class="req">*</span></span>
              <DatePicker v-model="form.reserved_at" mode="dateTime" :placeholder="$t('예약 일시')" />
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
import { appointmentApi } from "@/api/reservation";
import { departmentApi, employeeApi } from "@/api/hr";
import { formatDateOnly } from "@/utils/date";
import { useToast } from "vue-toastification";
import { useI18nStore } from "@/stores/i18n";

const toast = useToast();
const i18n = useI18nStore();

const STATUS = {
  BOOKED: { label: "예약", cls: "badge-info" },
  VISITED: { label: "방문", cls: "badge-success" },
  NOSHOW: { label: "노쇼", cls: "badge-error" },
  CANCELED: { label: "취소", cls: "badge-neutral" },
};
const statusOptions = computed(() => Object.entries(STATUS).map(([value, s]) => ({ value, label: i18n.t(s.label) })));
const statusFilterOptions = computed(() => [{ value: null, label: i18n.t("전체") }, ...statusOptions.value]);

const pad = (n) => String(n).padStart(2, "0");
// ISO → "2026-07-16 14:30" (로컬)
const dt = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

const _today = new Date();
const filter = reactive({ date_from: formatDateOnly(_today), date_to: formatDateOnly(_today), status: null, department_id: null, q: "" });
const range = ref({ start: new Date(_today), end: new Date(_today) });

function onRangeChange() {
  filter.date_from = range.value?.start ? formatDateOnly(range.value.start) : null;
  filter.date_to = range.value?.end ? formatDateOnly(range.value.end) : null;
  load(1);
}

const form = reactive({ id: null, patient_name: "", patient_phone: "", reserved_at: "", status: "BOOKED", department_id: null, doctor_id: null, memo: "" });

function openNew() {
  const now = new Date();
  const dtStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  Object.assign(form, { id: null, patient_name: "", patient_phone: "", reserved_at: dtStr, status: "BOOKED", department_id: null, doctor_id: null, memo: "" });
  showForm.value = true;
}
function openEdit(r) {
  Object.assign(form, {
    id: r.id, patient_name: r.patient_name, patient_phone: r.patient_phone || "",
    reserved_at: dt(r.reserved_at), status: r.status,
    department_id: r.department_id, doctor_id: r.doctor_id, memo: r.memo || "",
  });
  showForm.value = true;
}

async function load(p = page.value) {
  page.value = p;
  const res = await appointmentApi.list({
    date_from: filter.date_from || undefined,
    date_to: filter.date_to || undefined,
    status: filter.status || undefined,
    department_id: filter.department_id || undefined,
    q: filter.q || undefined,
    page: p,
    limit: limit.value,
  });
  rows.value = res.rows || [];
  total.value = res.total || 0;
  totalPages.value = res.totalPages || 0;
}

async function save() {
  if (!form.patient_name.trim() || !form.reserved_at) { toast.warning("환자명·예약일시는 필수입니다."); return; }
  saving.value = true;
  try {
    await appointmentApi.save({
      id: form.id || undefined,
      patient_name: form.patient_name.trim(),
      patient_phone: form.patient_phone || undefined,
      reserved_at: form.reserved_at,
      status: form.status,
      department_id: form.department_id || undefined,
      doctor_id: form.doctor_id || undefined,
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
    await appointmentApi.setStatus(r.id, status);
    await load();
  } catch (e) {
    toast.error(e?.message || "상태 변경에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

async function remove(r) {
  if (!confirm("이 예약을 삭제하시겠습니까?")) return;
  busy.value = r.id;
  try {
    await appointmentApi.remove(r.id);
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
.rsv { margin: 0; }
.tbl td.strong { font-weight: 700; color: var(--text); }
.rowclick { cursor: pointer; }
.rowclick:hover td { background: var(--surface-2); }
.acts { display: flex; gap: 0.3rem; white-space: nowrap; }
.req { color: var(--danger); margin-left: 2px; }

.drawer { position: fixed; inset: 0; z-index: 70; background: rgba(15, 23, 42, 0.45); display: flex; justify-content: flex-end; }
.panel { width: 520px; max-width: 100%; height: 100%; overflow-y: auto; background: var(--surface); padding: 1.4rem 1.6rem; display: flex; flex-direction: column; }
.dhead { margin-bottom: 1.2rem; }
.dhead h2 { font-size: 1.1rem; font-weight: 700; color: var(--text); }
.sec { display: flex; flex-direction: column; gap: 0.7rem; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem 0.9rem; }
.fld { display: block; }
.dfoot { margin-top: auto; padding-top: 1.2rem; display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); }
</style>
