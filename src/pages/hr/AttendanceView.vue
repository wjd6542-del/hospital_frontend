<template>
  <div class="att">
    <header class="phead">
      <h1 class="ttl">{{ $t("출퇴근") }}</h1>
    </header>

    <div class="filterbar">
      <span class="f-label">{{ $t("부서") }}</span>
      <SearchSelect v-model="filter.department_id" :options="deptOptions" :placeholder="$t('전체')" />
      <span class="f-label">{{ $t("기간") }}</span>
      <DateRangePicker v-model="range" mode="date" @change="onRangeChange" />
      <BaseSelect v-model="filter.status" :options="statusOptions" size="xs" style="width: 110px" />
      <input v-model="filter.q" class="field field-xs" style="width: 150px" :placeholder="$t('이름 · 사번')" @keyup.enter="load(1)" />
      <button class="btn btn-xs" @click="load(1)">{{ $t("검색") }}</button>
      <button class="btn btn-xs btn-primary" style="margin-left: auto" :disabled="!filter.department_id || generating" @click="generate">
        {{ generating ? $t("생성 중…") : $t("근무자 불러오기") }}
      </button>
    </div>

    <!-- 월별 요약 — 부서를 골랐을 때만 -->
    <div v-if="filter.department_id && summary.length" class="sumwrap">
      <div v-for="s in summary" :key="s.employee_id" class="sumcard">
        <div class="sname">{{ s.name }}</div>
        <div class="srow"><span>{{ $t("근무") }}</span><b>{{ s.work_days }}{{ $t("일") }}</b></div>
        <div class="srow"><span>{{ $t("연장") }}</span><b>{{ hm(s.overtime_minutes) }}</b></div>
        <div class="srow"><span>{{ $t("지각") }}</span><b :class="{ warn: s.late_count }">{{ s.late_count }}</b></div>
        <div class="srow"><span>{{ $t("결근") }}</span><b :class="{ bad: s.absent_count }">{{ s.absent_count }}</b></div>
      </div>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("날짜") }}</th>
            <th>{{ $t("사번") }}</th>
            <th>{{ $t("이름") }}</th>
            <th>{{ $t("예정") }}</th>
            <th>{{ $t("출근") }}</th>
            <th>{{ $t("퇴근") }}</th>
            <th>{{ $t("상태") }}</th>
            <th class="right">{{ $t("근무") }}</th>
            <th class="right">{{ $t("연장") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="10">
              <EmptyState icon="fa-clock" :title="$t('근태 기록이 없습니다')" :desc="$t('부서와 날짜를 고르고 근무자 불러오기를 누르세요.')" compact />
            </td>
          </tr>
          <tr v-for="r in rows" :key="r.id">
            <td class="num">{{ ymd(r.work_date) }}</td>
            <td class="num">{{ r.employee.emp_no }}</td>
            <td>{{ r.employee.name }}</td>
            <td>
              <span v-if="r.shift_type" class="chip" :style="{ background: r.shift_type.color }">{{ r.shift_type.code }}</span>
              <span v-else class="muted">-</span>
            </td>
            <td>
              <input
                :value="toLocal(r.check_in)"
                type="datetime-local"
                class="cell-input"
                :disabled="saving === r.id"
                @change="onTime(r, 'check_in', $event.target.value)"
              />
            </td>
            <td>
              <input
                :value="toLocal(r.check_out)"
                type="datetime-local"
                class="cell-input"
                :disabled="saving === r.id"
                @change="onTime(r, 'check_out', $event.target.value)"
              />
            </td>
            <td><span class="badge" :class="STATUS[r.status].cls">{{ $t(STATUS[r.status].label) }}</span></td>
            <td class="num right">{{ hm(r.work_minutes) }}</td>
            <td class="num right">{{ r.overtime_minutes ? hm(r.overtime_minutes) : "-" }}</td>
            <td><button class="btn btn-xs btn-ghost" @click="remove(r)">{{ $t("삭제") }}</button></td>
          </tr>
        </tbody>
      </table>
      <Pager v-if="totalPages > 1" :page="page" :total="total" :total-pages="totalPages" @change="load" />
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from "vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import Pager from "@/components/base/Pager.vue";
import DateRangePicker from "@/components/base/DateRangePicker.vue";
import { attendanceApi } from "@/api/attendance";
import { departmentApi } from "@/api/hr";
import { formatDateOnly } from "@/utils/date";
import { useToast } from "vue-toastification";

const toast = useToast();

const STATUS = {
  NORMAL: { label: "정상", cls: "badge-success" },
  LATE: { label: "지각", cls: "badge-warning" },
  EARLY_LEAVE: { label: "조퇴", cls: "badge-warning" },
  ABSENT: { label: "결근", cls: "badge-error" },
  LEAVE: { label: "휴가", cls: "badge-neutral" },
};

const statusOptions = [
  { value: null, label: "전체" },
  ...Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label })),
];

const today = new Date().toISOString().slice(0, 10);
const rows = ref([]);
const total = ref(0);
const totalPages = ref(0);
const page = ref(1);
const limit = ref(30);
const saving = ref(null);
const generating = ref(false);
const deptOptions = ref([]);
const summary = ref([]);

const filter = reactive({
  department_id: null,
  date_from: today,
  date_to: today,
  status: null,
  q: "",
});

// DateRangePicker 는 { start, end } Date 객체로 v-model 한다.
// 백엔드는 date_from/date_to 를 "YYYY-MM-DD" 로 받으므로 어댑터로 변환한다.
const range = ref({ start: new Date(), end: new Date() });

function onRangeChange() {
  if (range.value?.start) filter.date_from = formatDateOnly(range.value.start);
  if (range.value?.end) filter.date_to = formatDateOnly(range.value.end);
  load(1);
}

/** ISO → "2026-08-03" */
const ymd = (v) => (v ? String(v).slice(0, 10) : "-");

/** 서버 ISO(UTC) → datetime-local 이 요구하는 로컬 벽시계 "YYYY-MM-DDTHH:MM"
 *  주의: .slice(0, 16) 로 문자열만 잘라내면 UTC 벽시계가 그대로 보여 KST(+9)에서
 *  9시간이 어긋난다. new Date() 로 파싱해 로컬 getHours 등을 읽어야 저장 경로
 *  (new Date(datetime-local 값) → 서버 로컬로 해석) 와 왕복이 맞는다. */
const toLocal = (v) => {
  if (!v) return "";
  const d = new Date(v);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 분 → "8h 30m" */
const hm = (m) => (m ? `${Math.floor(m / 60)}h ${m % 60}m` : "-");

async function load(p = page.value) {
  page.value = p;
  const res = await attendanceApi.list({
    department_id: filter.department_id || null,
    date_from: filter.date_from,
    date_to: filter.date_to,
    status: filter.status || null,
    q: filter.q || undefined,
    page: p,
    limit: limit.value,
  });
  rows.value = res.rows || [];
  total.value = res.total || 0;
  totalPages.value = res.totalPages || 0;
  await loadSummary();
}

/** 월별 요약 — date_from 이 속한 달 기준 */
async function loadSummary() {
  if (!filter.department_id) {
    summary.value = [];
    return;
  }
  const d = new Date(filter.date_from);
  try {
    summary.value = await attendanceApi.summary(
      filter.department_id,
      d.getFullYear(),
      d.getMonth() + 1,
    );
  } catch (e) {
    summary.value = [];
  }
}

/** 시각을 고치면 즉시 저장 — 서버가 근무표와 대조해 상태를 판정한다 */
async function onTime(r, field, value) {
  saving.value = r.id;
  try {
    const updated = await attendanceApi.save({
      employee_id: r.employee.id,
      work_date: ymd(r.work_date),
      check_in: field === "check_in" ? value : toLocal(r.check_in),
      check_out: field === "check_out" ? value : toLocal(r.check_out),
      memo: r.memo,
    });
    Object.assign(r, updated);
  } catch (e) {
    toast.error(e?.message || "저장에 실패했습니다.");
    await load();
  } finally {
    saving.value = null;
  }
}

async function generate() {
  generating.value = true;
  try {
    const res = await attendanceApi.bulkGenerate(filter.department_id, filter.date_from);
    toast.success(`${res.created}건 생성, ${res.skipped}건 건너뜀`);
    filter.date_to = filter.date_from;
    await load(1);
  } catch (e) {
    toast.error(e?.message || "생성에 실패했습니다.");
  } finally {
    generating.value = false;
  }
}

async function remove(r) {
  try {
    await attendanceApi.remove(r.id);
    await load();
  } catch (e) {
    toast.error(e?.message || "삭제에 실패했습니다.");
  }
}

onMounted(async () => {
  const depts = await departmentApi.options();
  deptOptions.value = depts.map((d) => ({
    value: d.id,
    label: `${"　".repeat(d.depth)}${d.name}`,
  }));
  await load(1);
});
</script>

<style scoped>
.att { max-width: 1300px; margin: 0 auto; }
.phead { margin-bottom: 1.1rem; }
.ttl { font-size: 1.5rem; font-weight: 700; color: var(--text); }
.muted { color: var(--text-subtle); }
.chip {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 30px; height: 22px; padding: 0 6px; border-radius: 4px;
  font-size: 0.68rem; font-weight: 700; color: #fff;
}

.sumwrap { display: flex; gap: 0.6rem; overflow-x: auto; margin-bottom: 0.9rem; padding-bottom: 0.2rem; }
.sumcard {
  flex: 0 0 auto; min-width: 130px; padding: 0.6rem 0.8rem;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);
}
.sname { font-size: 0.82rem; font-weight: 600; color: var(--text); margin-bottom: 0.4rem; }
.srow { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-subtle); line-height: 1.7; }
.srow b { color: var(--text); font-variant-numeric: tabular-nums; }
.srow b.warn { color: var(--warning); }
.srow b.bad { color: var(--danger); }
</style>
