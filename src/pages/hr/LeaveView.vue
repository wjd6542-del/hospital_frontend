<template>
  <div class="att">
    <header class="phead">
      <h1 class="ttl">{{ $t("휴가 관리") }}</h1>
    </header>

    <div class="filterbar">
      <span class="f-label">{{ $t("부서") }}</span>
      <SearchSelect v-model="filter.department_id" :options="deptOptions" :placeholder="$t('전체')" />
      <span class="f-label">{{ $t("상태") }}</span>
      <select v-model="filter.status" class="field field-xs" style="width: 110px" @change="load(1)">
        <option v-for="s in statusOptions" :key="String(s.value)" :value="s.value">{{ $t(s.label) }}</option>
      </select>
      <span class="f-label">{{ $t("기간") }}</span>
      <DateRangePicker v-model="range" mode="date" @change="onRangeChange" />
      <input v-model="filter.q" class="field field-xs" style="width: 150px" :placeholder="$t('이름 · 사번')" @keyup.enter="load(1)" />
      <button class="btn btn-xs" @click="load(1)">{{ $t("검색") }}</button>
      <button class="btn btn-xs btn-primary" style="margin-left: auto" @click="openNew">＋ {{ $t("휴가 신청") }}</button>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("신청일") }}</th>
            <th>{{ $t("사번") }}</th>
            <th>{{ $t("이름") }}</th>
            <th>{{ $t("유형") }}</th>
            <th>{{ $t("기간") }}</th>
            <th class="right">{{ $t("일수") }}</th>
            <th>{{ $t("상태") }}</th>
            <th>{{ $t("처리자") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="9">
              <EmptyState icon="fa-plane-departure" :title="$t('휴가 신청이 없습니다')" :desc="$t('휴가 신청 버튼으로 새 신청을 등록하세요.')" compact />
            </td>
          </tr>
          <tr v-for="r in rows" :key="r.id">
            <td class="num">{{ ymd(r.created_at) }}</td>
            <td class="num">{{ r.employee.emp_no }}</td>
            <td>{{ r.employee.name }}</td>
            <td>
              <span class="chip" :style="{ background: r.leave_type.color || '#64748b' }">{{ r.leave_type.name }}</span>
            </td>
            <td class="num">{{ ymd(r.start_date) }} ~ {{ ymd(r.end_date) }}</td>
            <td class="num right">{{ r.days }}</td>
            <td><span class="badge" :class="STATUS[r.status].cls">{{ $t(STATUS[r.status].label) }}</span></td>
            <td>{{ r.approver?.name || "-" }}</td>
            <td class="acts">
              <template v-if="r.status === 'PENDING'">
                <button class="btn btn-xs btn-primary" :disabled="busy === r.id" @click="approve(r)">{{ $t("승인") }}</button>
                <button class="btn btn-xs" :disabled="busy === r.id" @click="openReject(r)">{{ $t("반려") }}</button>
                <button class="btn btn-xs btn-ghost" :disabled="busy === r.id" @click="cancel(r)">{{ $t("취소") }}</button>
              </template>
              <template v-else-if="r.status === 'APPROVED'">
                <button class="btn btn-xs btn-ghost" :disabled="busy === r.id" @click="cancel(r)">{{ $t("취소") }}</button>
              </template>
              <template v-else>
                <button class="btn btn-xs btn-ghost" :disabled="busy === r.id" @click="remove(r)">{{ $t("삭제") }}</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <Pager v-if="totalPages > 1" :page="page" :total="total" :total-pages="totalPages" @change="load" />
    </div>

    <!-- 휴가 신청 모달 -->
    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel">
        <header class="dhead">
          <h2>{{ $t("휴가 신청") }}</h2>
        </header>

        <section class="sec">
          <div class="grid2">
            <label class="fld"><span class="form-label">{{ $t("직원") }}</span>
              <SearchSelect v-model="form.employee_id" :options="empOptions" :placeholder="$t('직원 선택')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("휴가유형") }}</span>
              <SearchSelect v-model="form.leave_type_id" :options="typeOptions" :placeholder="$t('유형 선택')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("시작일") }}</span>
              <DatePicker v-model="form.start_date" mode="date" :placeholder="$t('시작일')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("종료일") }}</span>
              <DatePicker v-model="form.end_date" mode="date" :placeholder="$t('종료일')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("일수") }}</span>
              <input v-model="form.days" type="number" step="0.5" min="0" class="field" :placeholder="$t('비우면 자동 계산 · 반차는 0.5')" />
            </label>
          </div>
        </section>

        <section class="sec">
          <label class="fld"><span class="form-label">{{ $t("사유") }}</span>
            <textarea v-model="form.reason" class="field" rows="3" :placeholder="$t('사유(선택)')"></textarea>
          </label>
        </section>

        <footer class="dfoot">
          <span style="flex: 1"></span>
          <button class="btn btn-xs" @click="showForm = false">{{ $t("닫기") }}</button>
          <button class="btn btn-xs btn-primary" :disabled="saving" @click="save">
            {{ saving ? $t("저장 중…") : $t("신청") }}
          </button>
        </footer>
      </div>
    </div>

    <!-- 반려 사유 모달 -->
    <div v-if="rejectTarget" class="drawer" @click.self="rejectTarget = null">
      <div class="panel small">
        <header class="dhead">
          <h2>{{ $t("반려 사유") }}</h2>
        </header>
        <label class="fld"><span class="form-label">{{ $t("사유") }}</span>
          <textarea v-model="rejectReason" class="field" rows="3" :placeholder="$t('반려 사유를 입력하세요')"></textarea>
        </label>
        <footer class="dfoot">
          <span style="flex: 1"></span>
          <button class="btn btn-xs" @click="rejectTarget = null">{{ $t("닫기") }}</button>
          <button class="btn btn-xs btn-primary" :disabled="busy === rejectTarget.id" @click="confirmReject">{{ $t("반려") }}</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from "vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import DatePicker from "@/components/base/DatePicker.vue";
import DateRangePicker from "@/components/base/DateRangePicker.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import Pager from "@/components/base/Pager.vue";
import { leaveTypeApi, leaveRequestApi } from "@/api/leave";
import { departmentApi, employeeApi } from "@/api/hr";
import { formatDateOnly } from "@/utils/date";
import { useToast } from "vue-toastification";

const toast = useToast();

const STATUS = {
  PENDING: { label: "대기", cls: "badge-neutral" },
  APPROVED: { label: "승인", cls: "badge-success" },
  REJECTED: { label: "반려", cls: "badge-error" },
  CANCELED: { label: "취소", cls: "badge-neutral" },
};

const statusOptions = [
  { value: null, label: "전체" },
  { value: "PENDING", label: "대기" },
  { value: "APPROVED", label: "승인" },
  { value: "REJECTED", label: "반려" },
  { value: "CANCELED", label: "취소" },
];

const rows = ref([]);
const total = ref(0);
const totalPages = ref(0);
const page = ref(1);
const limit = ref(30);
const busy = ref(null);
const saving = ref(false);
const showForm = ref(false);
const deptOptions = ref([]);
const empOptions = ref([]);
const typeOptions = ref([]);
const rejectTarget = ref(null);
const rejectReason = ref("");

const filter = reactive({
  department_id: null,
  status: null,
  date_from: null,
  date_to: null,
  q: "",
});

// DateRangePicker 는 { start, end } Date 객체로 v-model 한다. (선택)
const range = ref({ start: null, end: null });

function onRangeChange() {
  filter.date_from = range.value?.start ? formatDateOnly(range.value.start) : null;
  filter.date_to = range.value?.end ? formatDateOnly(range.value.end) : null;
  load(1);
}

/** ISO → "2026-08-03" */
const ymd = (v) => (v ? String(v).slice(0, 10) : "-");

const form = reactive({
  employee_id: null,
  leave_type_id: null,
  start_date: "",
  end_date: "",
  days: "",
  reason: "",
});

function openNew() {
  Object.assign(form, { employee_id: null, leave_type_id: null, start_date: "", end_date: "", days: "", reason: "" });
  showForm.value = true;
}

async function load(p = page.value) {
  page.value = p;
  const res = await leaveRequestApi.list({
    department_id: filter.department_id || null,
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

async function save() {
  if (!form.employee_id || !form.leave_type_id || !form.start_date || !form.end_date) {
    toast.warning("직원·유형·기간은 필수입니다.");
    return;
  }
  saving.value = true;
  try {
    await leaveRequestApi.create({
      employee_id: form.employee_id,
      leave_type_id: form.leave_type_id,
      start_date: form.start_date,
      end_date: form.end_date,
      days: form.days === "" || form.days === null ? undefined : Number(form.days),
      reason: form.reason || undefined,
    });
    toast.success("휴가가 신청되었습니다.");
    showForm.value = false;
    await load(1);
  } catch (e) {
    toast.error(e?.message || "신청에 실패했습니다.");
  } finally {
    saving.value = false;
  }
}

async function approve(r) {
  busy.value = r.id;
  try {
    await leaveRequestApi.approve(r.id);
    toast.success("승인되었습니다.");
    await load();
  } catch (e) {
    toast.error(e?.message || "승인에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

function openReject(r) {
  rejectTarget.value = r;
  rejectReason.value = "";
}

async function confirmReject() {
  const r = rejectTarget.value;
  busy.value = r.id;
  try {
    await leaveRequestApi.reject(r.id, rejectReason.value || "");
    toast.success("반려되었습니다.");
    rejectTarget.value = null;
    await load();
  } catch (e) {
    toast.error(e?.message || "반려에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

async function cancel(r) {
  if (!confirm("이 휴가 신청을 취소하시겠습니까?")) return;
  busy.value = r.id;
  try {
    await leaveRequestApi.cancel(r.id);
    toast.success("취소되었습니다.");
    await load();
  } catch (e) {
    toast.error(e?.message || "취소에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

async function remove(r) {
  if (!confirm("이 휴가 신청을 삭제하시겠습니까?")) return;
  busy.value = r.id;
  try {
    await leaveRequestApi.remove(r.id);
    toast.success("삭제되었습니다.");
    await load();
  } catch (e) {
    toast.error(e?.message || "삭제에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

onMounted(async () => {
  const [depts, emps, types] = await Promise.all([
    departmentApi.options(),
    employeeApi.options(),
    leaveTypeApi.list(),
  ]);
  deptOptions.value = depts.map((d) => ({ value: d.id, label: `${"　".repeat(d.depth)}${d.name}` }));
  empOptions.value = emps.map((e) => ({ value: e.id, label: `${e.name} (${e.emp_no})` }));
  typeOptions.value = types.map((t) => ({ value: t.id, label: t.name, color: t.color }));
  await load(1);
});
</script>

<style scoped>
.att { max-width: 1300px; margin: 0 auto; }
.phead { margin-bottom: 1.1rem; }
.ttl { font-size: 1.5rem; font-weight: 700; color: var(--text); }
.chip {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 30px; height: 22px; padding: 0 8px; border-radius: 4px;
  font-size: 0.68rem; font-weight: 700; color: #fff;
}
.acts { display: flex; gap: 0.3rem; white-space: nowrap; }

.drawer { position: fixed; inset: 0; z-index: 70; background: rgba(15, 23, 42, 0.45); display: flex; justify-content: flex-end; }
.panel { width: 520px; max-width: 100%; height: 100%; overflow-y: auto; background: var(--surface); padding: 1.4rem 1.6rem; display: flex; flex-direction: column; }
.panel.small { width: 420px; }
.dhead { display: flex; align-items: center; gap: 0.7rem; margin-bottom: 1.2rem; }
.dhead h2 { font-size: 1.1rem; font-weight: 700; color: var(--text); }
.sec { margin-bottom: 1.6rem; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem 0.9rem; }
.fld { display: block; }
.dfoot { margin-top: auto; padding-top: 1.2rem; display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); }
</style>
