<template>
  <div class="sch">
    <header class="phead">
      <h1 class="ttl">{{ $t("근무표") }}</h1>
    </header>

    <div class="filterbar">
      <span class="f-label">{{ $t("부서") }}</span>
      <SearchSelect v-model="deptId" :options="deptOptions" :placeholder="$t('부서 선택')" @change="load" />
      <select v-model.number="year" class="field field-xs" style="width: 100px" @change="load">
        <option v-for="y in years" :key="y" :value="y">{{ y }}년</option>
      </select>
      <select v-model.number="month" class="field field-xs" style="width: 90px" @change="load">
        <option v-for="m in 12" :key="m" :value="m">{{ m }}월</option>
      </select>
      <button class="btn btn-xs" :disabled="!deptId || copying" @click="copyLastMonth">
        {{ copying ? $t("복사 중…") : $t("지난달 복사") }}
      </button>
    </div>

    <!-- 팔레트 -->
    <div v-if="deptId" class="palette">
      <span class="plabel">{{ $t("근무유형") }}</span>
      <button
        v-for="t in shiftTypes"
        :key="t.id"
        class="pchip"
        :class="{ on: brush?.id === t.id }"
        :style="{ background: t.color, color: '#fff' }"
        @click="brush = brush?.id === t.id ? null : t"
      >
        {{ t.code }}
      </button>
      <button class="pchip erase" :class="{ on: brush === 'ERASE' }" @click="brush = brush === 'ERASE' ? null : 'ERASE'">
        {{ $t("지우기") }}
      </button>
      <span class="phint">{{ brush ? $t("셀을 클릭하거나 드래그하세요") : $t("유형을 먼저 고르세요") }}</span>
    </div>

    <EmptyState v-if="!deptId" icon="fa-calendar-days" :title="$t('부서를 선택하세요')" :desc="$t('부서를 고르면 그 달의 근무표가 표시됩니다.')" />

    <div v-else-if="!grid.employees.length" class="pcard">
      <EmptyState icon="fa-user" :title="$t('재직 중인 직원이 없습니다')" :desc="$t('직원 관리에서 등록하세요.')" compact />
    </div>

    <div v-else class="pcard gridwrap">
      <table class="gtbl" @mouseleave="endDrag">
        <thead>
          <tr>
            <th class="namecol">{{ $t("직원") }}</th>
            <th
              v-for="d in grid.days"
              :key="d.date"
              class="daycol"
              :class="{ sun: d.weekday === 0, sat: d.weekday === 6 }"
            >
              <div class="dnum">{{ d.day }}</div>
              <div class="dwk">{{ WEEK[d.weekday] }}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in grid.employees" :key="e.id">
            <td class="namecol">
              <div class="ename">{{ e.name }}</div>
              <div class="emeta">{{ e.emp_no }} · {{ e.job_type || "-" }}</div>
            </td>
            <td
              v-for="d in grid.days"
              :key="d.date"
              class="cell"
              :class="{ sun: d.weekday === 0, sat: d.weekday === 6 }"
              @mousedown="startDrag(e.id, d.date)"
              @mouseenter="dragOver(e.id, d.date)"
              @mouseup="endDrag"
            >
              <span
                v-if="cellOf(e.id, d.date)"
                class="chip"
                :style="{ background: cellOf(e.id, d.date).color }"
              >
                {{ cellOf(e.id, d.date).code }}
              </span>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr v-for="t in workTypes" :key="t.id" class="cntrow">
            <td class="namecol cntlabel">{{ t.code }}</td>
            <td v-for="d in grid.days" :key="d.date" class="cell cnt">
              {{ grid.counts[d.date]?.[t.code] || "" }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted } from "vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import { shiftScheduleApi, shiftTypeApi } from "@/api/attendance";
import { departmentApi } from "@/api/hr";
import { useToast } from "vue-toastification";

const toast = useToast();
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

const now = new Date();
const deptId = ref(null);
const year = ref(now.getFullYear());
const month = ref(now.getMonth() + 1);
const years = computed(() => {
  const y = now.getFullYear();
  return [y - 1, y, y + 1];
});

const deptOptions = ref([]);
const shiftTypes = ref([]);
const workTypes = computed(() => shiftTypes.value.filter((t) => t.is_work));

const grid = reactive({ employees: [], days: [], cells: {}, counts: {} });
const brush = ref(null); // ShiftType 객체 | "ERASE" | null
const copying = ref(false);

const cellOf = (empId, date) => grid.cells[`${empId}:${date}`];

async function load() {
  if (!deptId.value) return;
  const g = await shiftScheduleApi.grid(deptId.value, year.value, month.value);
  grid.employees = g.employees;
  grid.days = g.days;
  grid.cells = g.cells;
  grid.counts = g.counts;
}

// ── 드래그로 여러 칸 칠하기 ──
let dragging = false;
let painted = [];

function startDrag(empId, date) {
  if (!brush.value) {
    toast.warning("근무유형을 먼저 고르세요.");
    return;
  }
  dragging = true;
  painted = [];
  paint(empId, date);
}

function dragOver(empId, date) {
  if (dragging) paint(empId, date);
}

function paint(empId, date) {
  const key = `${empId}:${date}`;
  if (painted.includes(key)) return;
  painted.push(key);

  if (brush.value === "ERASE") {
    delete grid.cells[key];
  } else {
    grid.cells[key] = {
      shift_type_id: brush.value.id,
      code: brush.value.code,
      color: brush.value.color,
      memo: null,
    };
  }
}

async function endDrag() {
  if (!dragging) return;
  dragging = false;
  if (!painted.length) return;

  const cells = painted.map((k) => {
    const [employee_id, work_date] = k.split(":");
    return { employee_id: Number(employee_id), work_date, key: k };
  });
  painted = [];

  try {
    if (brush.value === "ERASE") {
      let failed = 0;
      for (const c of cells) {
        try {
          await shiftScheduleApi.deleteCell(c.employee_id, c.work_date);
        } catch (e) {
          // 근무가 없는 칸을 드래그로 지우는 건 정상 동작이라 404 NOT_FOUND는 실패로 세지 않는다.
          const isNotFound = e?.code === "NOT_FOUND" || String(e?.message || "").includes("찾을 수 없");
          if (!isNotFound) failed++;
        }
      }
      if (failed) toast.error(`${failed}칸을 지우지 못했습니다.`);
    } else {
      await shiftScheduleApi.saveBulk(
        cells.map((c) => ({
          employee_id: c.employee_id,
          work_date: c.work_date,
          shift_type_id: brush.value.id,
        })),
      );
    }
    await load(); // counts 를 서버에서 다시 받는다
  } catch (e) {
    toast.error(e?.message || "저장에 실패했습니다.");
    await load();
  }
}

async function copyLastMonth() {
  const from = month.value === 1
    ? { y: year.value - 1, m: 12 }
    : { y: year.value, m: month.value - 1 };

  copying.value = true;
  try {
    const r = await shiftScheduleApi.copyMonth({
      department_id: deptId.value,
      from_year: from.y,
      from_month: from.m,
      to_year: year.value,
      to_month: month.value,
    });
    toast.success(`${r.copied}건 복사, ${r.skipped}건 건너뜀 (이미 있는 근무는 덮어쓰지 않습니다)`);
    await load();
  } catch (e) {
    toast.error(e?.message || "복사에 실패했습니다.");
  } finally {
    copying.value = false;
  }
}

onMounted(async () => {
  const [depts, types] = await Promise.all([
    departmentApi.options(),
    shiftTypeApi.list({ only_active: true }),
  ]);
  deptOptions.value = depts.map((d) => ({
    value: d.id,
    label: `${"　".repeat(d.depth)}${d.name}`,
  }));
  shiftTypes.value = types;
});
</script>

<style scoped>
.sch { max-width: 100%; }
.phead { margin-bottom: 1.1rem; }
.ttl { font-size: 1.5rem; font-weight: 700; color: var(--text); }

.palette { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.9rem; }
.plabel { font-size: 0.72rem; color: var(--text-subtle); margin-right: 0.2rem; }
.pchip {
  min-width: 42px; padding: 0.3rem 0.6rem; border-radius: var(--radius);
  font-size: 0.75rem; font-weight: 700; border: 2px solid transparent;
  transition: border-color 0.12s, transform 0.08s;
}
.pchip.on { border-color: var(--text); transform: translateY(-1px); }
.pchip.erase { background: var(--surface-2); color: var(--text-muted); }
.phint { font-size: 0.72rem; color: var(--text-subtle); margin-left: 0.4rem; }

.gridwrap { overflow-x: auto; padding: 0; }
.gtbl { border-collapse: collapse; user-select: none; }

.namecol {
  position: sticky; left: 0; z-index: 2;
  width: 150px; min-width: 150px;
  background: var(--surface);
  border-right: 1px solid var(--border-strong);
  text-align: left; padding: 0.4rem 0.7rem;
}
thead .namecol { background: var(--surface-2); }
.ename { font-size: 0.82rem; font-weight: 600; color: var(--text); }
.emeta { font-size: 0.66rem; color: var(--text-subtle); }

.daycol {
  width: 34px; min-width: 34px;
  padding: 0.3rem 0; text-align: center;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border-strong);
}
.dnum { font-size: 0.74rem; font-weight: 600; color: var(--text-muted); }
.dwk { font-size: 0.6rem; color: var(--text-subtle); }
.daycol.sun .dnum, .daycol.sun .dwk { color: var(--danger); }
.daycol.sat .dnum, .daycol.sat .dwk { color: var(--info); }

.cell {
  width: 34px; height: 34px; padding: 2px;
  text-align: center; vertical-align: middle;
  border-bottom: 1px solid var(--border);
  border-right: 1px solid var(--border);
  cursor: pointer;
}
.cell:hover { background: var(--accent-soft); }
.cell.sun, .cell.sat { background: color-mix(in srgb, var(--surface-2) 60%, transparent); }
.chip {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 24px; border-radius: 4px;
  font-size: 0.66rem; font-weight: 700; color: #fff;
}

.cntrow { background: var(--surface-2); }
.cntlabel { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); }
.cnt { font-size: 0.72rem; color: var(--text-muted); cursor: default; }
.cnt:hover { background: none; }
</style>
