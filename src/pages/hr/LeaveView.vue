<template>
  <div class="att">
    <div class="ltabs">
      <button class="ltab" :class="{ on: tab === 'list' }" @click="tab = 'list'"><i class="fa-solid fa-list-ul"></i> {{ $t("목록") }}</button>
      <button class="ltab" :class="{ on: tab === 'calendar' }" @click="openCalendar"><i class="fa-regular fa-calendar-days"></i> {{ $t("캘린더") }}</button>
    </div>

    <template v-if="tab === 'list'">
    <div class="filterbar">
      <span class="f-label">{{ $t("부서") }}</span>
      <SearchSelect v-model="filter.department_id" size="xs" :options="deptOptions" :placeholder="$t('전체')" />
      <span class="f-label">{{ $t("상태") }}</span>
      <SearchSelect v-model="filter.status" size="xs" :options="statusOptions" :placeholder="$t('전체')" @change="load(1)" />
      <span class="f-label">{{ $t("기간") }}</span>
      <DateRangePicker v-model="range" mode="date" size="xs" @change="onRangeChange" />
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
    </template>

    <!-- 캘린더 탭 — 휴가자 한눈에 -->
    <template v-else>
      <div class="calbar">
        <SearchSelect v-model="calDept" size="xs" :options="deptOptions" :placeholder="$t('전체 부서')" @change="loadCalendar" />
        <div class="navg">
          <button class="btn btn-xs" @click="moveMonth(-1)"><i class="fa-solid fa-chevron-left"></i></button>
          <span class="ymlabel">{{ calYear }}{{ $t("년") }} {{ calMonth }}{{ $t("월") }}</span>
          <button class="btn btn-xs" @click="moveMonth(1)"><i class="fa-solid fa-chevron-right"></i></button>
          <button class="btn btn-xs" @click="goToday">{{ $t("오늘") }}</button>
        </div>
        <div class="leg">
          <span class="lgi"><span class="dot solid"></span>{{ $t("승인") }}</span>
          <span class="lgi"><span class="dot dash"></span>{{ $t("대기") }}</span>
        </div>
      </div>

      <div class="pcard calwrap">
        <div class="calgrid">
          <div v-for="w in WEEK" :key="w" class="calhd" :class="{ sun: w === '일', sat: w === '토' }">{{ w }}</div>
          <div
            v-for="(c, i) in calCells"
            :key="i"
            class="calcell"
            :class="{ empty: !c, today: c && c.iso === todayIso, sun: c && c.dow === 0, sat: c && c.dow === 6 }"
          >
            <template v-if="c">
              <div class="cd">{{ c.day }}</div>
              <div class="cl">
                <span
                  v-for="l in c.leaves"
                  :key="l.id"
                  class="lchip"
                  :class="{ pend: l.status === 'PENDING' }"
                  :style="chipStyle(l)"
                  :title="`${l.employee.name} · ${l.leave_type.name}${l.status === 'PENDING' ? ' (대기)' : ''}`"
                >{{ l.employee.name }}</span>
              </div>
            </template>
          </div>
        </div>
        <div v-if="!calLeaves.length" class="calempty">{{ $t("이 달 휴가자가 없습니다.") }}</div>
      </div>
    </template>

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
import { ref, reactive, computed, onMounted } from "vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import DatePicker from "@/components/base/DatePicker.vue";
import DateRangePicker from "@/components/base/DateRangePicker.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import Pager from "@/components/base/Pager.vue";
import { leaveTypeApi, leaveRequestApi } from "@/api/leave";
import { departmentApi, employeeApi } from "@/api/hr";
import { formatDateOnly } from "@/utils/date";
import { useToast } from "vue-toastification";
import { useI18nStore } from "@/stores/i18n";

const toast = useToast();
const i18n = useI18nStore();

const STATUS = {
  PENDING: { label: "대기", cls: "badge-neutral" },
  APPROVED: { label: "승인", cls: "badge-success" },
  REJECTED: { label: "반려", cls: "badge-error" },
  CANCELED: { label: "취소", cls: "badge-neutral" },
};

const STATUS_OPTS = [
  { value: null, label: "전체" },
  { value: "PENDING", label: "대기" },
  { value: "APPROVED", label: "승인" },
  { value: "REJECTED", label: "반려" },
  { value: "CANCELED", label: "취소" },
];
// SearchSelect 는 라벨을 그대로 렌더하므로, 로케일 번역을 옵션에 미리 반영한다.
const statusOptions = computed(() => STATUS_OPTS.map((o) => ({ ...o, label: i18n.t(o.label) })));

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

// ── 캘린더 탭 (휴가자 한눈에) ──
const tab = ref("list");
const _now = new Date();
const calYear = ref(_now.getFullYear());
const calMonth = ref(_now.getMonth() + 1);
const calDept = ref(null);
const calLeaves = ref([]);
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const todayIso = formatDateOnly(new Date());

// 그 달의 달력 셀(앞뒤 빈칸 포함) — 각 날짜에 걸치는 휴가를 계산
const calCells = computed(() => {
  const y = calYear.value;
  const m = calMonth.value;
  const pad = new Date(y, m - 1, 1).getDay();
  const days = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let d = 1; d <= days; d++) {
    const date = new Date(y, m - 1, d);
    const iso = formatDateOnly(date);
    const leaves = calLeaves.value.filter((l) => {
      const s = String(l.start_date).slice(0, 10);
      const e = String(l.end_date).slice(0, 10);
      return s <= iso && iso <= e;
    });
    cells.push({ day: d, iso, dow: date.getDay(), leaves });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
});

// 승인=단색, 대기=점선 테두리
function chipStyle(l) {
  const c = l.leave_type?.color || "#64748b";
  if (l.status === "PENDING") return { color: c, borderColor: c, background: "transparent" };
  return { background: c, color: "#fff", borderColor: c };
}

async function loadCalendar() {
  const start = new Date(calYear.value, calMonth.value - 1, 1);
  const end = new Date(calYear.value, calMonth.value, 0);
  const res = await leaveRequestApi.list({
    department_id: calDept.value || undefined,
    date_from: formatDateOnly(start),
    date_to: formatDateOnly(end),
    limit: 500,
  });
  calLeaves.value = (res.rows || []).filter((l) => l.status === "APPROVED" || l.status === "PENDING");
}
function openCalendar() {
  tab.value = "calendar";
  loadCalendar();
}
function moveMonth(d) {
  let m = calMonth.value + d;
  let y = calYear.value;
  if (m < 1) { m = 12; y--; } else if (m > 12) { m = 1; y++; }
  calMonth.value = m;
  calYear.value = y;
  loadCalendar();
}
function goToday() {
  const t = new Date();
  calYear.value = t.getFullYear();
  calMonth.value = t.getMonth() + 1;
  loadCalendar();
}

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
.att { margin: 0; }
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

/* ── 탭 ── */
.ltabs { display: flex; gap: 2px; margin-bottom: 1rem; border-bottom: 1px solid var(--border); }
.ltab { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 0.95rem; font-size: 0.82rem; font-weight: 600; color: var(--text-subtle); border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 0.12s; }
.ltab:hover { color: var(--text); }
.ltab.on { color: var(--accent); border-bottom-color: var(--accent); }

/* ── 캘린더 ── */
.calbar { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.8rem; }
.calbar > :first-child { width: 170px; flex: 0 0 auto; }
.navg { display: flex; align-items: center; gap: 0.4rem; }
.ymlabel { font-size: 0.95rem; font-weight: 700; color: var(--text); min-width: 120px; text-align: center; }
.leg { display: flex; gap: 0.9rem; margin-left: auto; font-size: 0.7rem; color: var(--text-subtle); }
.lgi { display: inline-flex; align-items: center; gap: 0.3rem; }
.leg .dot { width: 12px; height: 12px; border-radius: 3px; border: 1px solid var(--accent); }
.leg .dot.solid { background: var(--accent); }
.leg .dot.dash { background: transparent; border-style: dashed; }

.calwrap { padding: 0; overflow: hidden; }
.calgrid { display: grid; grid-template-columns: repeat(7, 1fr); }
.calhd { padding: 0.5rem; text-align: center; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--surface-2); border-bottom: 1px solid var(--border-strong); }
.calhd.sun { color: var(--danger); }
.calhd.sat { color: var(--accent); }
.calcell { min-height: 98px; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 0.35rem; display: flex; flex-direction: column; gap: 0.25rem; }
.calcell:nth-child(7n) { border-right: none; }
.calcell.empty { background: var(--surface-2); }
.calcell.today { background: var(--accent-soft); }
.cd { font-size: 0.72rem; font-weight: 700; color: var(--text-muted); }
.calcell.sun .cd { color: var(--danger); }
.calcell.sat .cd { color: var(--accent); }
.cl { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
.lchip { font-size: 0.66rem; font-weight: 700; padding: 1px 5px; border-radius: 4px; border: 1px solid; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lchip.pend { border-style: dashed; }
.calempty { padding: 1.6rem; text-align: center; color: var(--text-subtle); font-size: 0.85rem; }
</style>
