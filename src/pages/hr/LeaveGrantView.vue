<template>
  <div class="att">
    <header class="phead">
      <h1 class="ttl">{{ $t("연차 부여") }}</h1>
    </header>

    <div class="filterbar">
      <span class="f-label">{{ $t("부서") }}</span>
      <SearchSelect v-model="filter.department_id" size="xs" :options="deptOptions" :placeholder="$t('전체')" />
      <span class="f-label">{{ $t("연도") }}</span>
      <SearchSelect v-model="filter.year" size="xs" :options="yearOptions" :clearable="false" @change="load" />
      <input v-model="filter.q" class="field field-xs" style="width: 150px" :placeholder="$t('이름 · 사번')" @keyup.enter="load" />
      <button class="btn btn-xs" @click="load">{{ $t("검색") }}</button>
      <button class="btn btn-xs btn-primary" style="margin-left: auto" :disabled="applying || !rows.length" @click="applySuggested">
        {{ applying ? $t("적용 중…") : $t("제안값 일괄 적용") }}
      </button>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("사번") }}</th>
            <th>{{ $t("이름") }}</th>
            <th>{{ $t("부서") }}</th>
            <th>{{ $t("입사일") }}</th>
            <th class="right">{{ $t("부여") }}</th>
            <th class="right">{{ $t("사용") }}</th>
            <th class="right">{{ $t("잔여") }}</th>
            <th class="right">{{ $t("법정제안") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="9">
              <EmptyState icon="fa-calendar-check" :title="$t('대상 직원이 없습니다')" :desc="$t('부서와 연도를 고르고 검색하세요.')" compact />
            </td>
          </tr>
          <tr v-for="r in rows" :key="r.employee_id">
            <td class="num">{{ r.emp_no }}</td>
            <td>{{ r.name }}</td>
            <td>{{ r.department?.name || "-" }}</td>
            <td class="num">{{ ymd(r.hired_at) }}</td>
            <td class="right">
              <input v-model="r.granted_days" type="number" step="0.5" min="0" class="field field-xs gcell" :placeholder="$t('미부여')" />
            </td>
            <td class="num right">{{ r.used_days }}</td>
            <td class="num right">{{ r.remaining_days == null ? "-" : r.remaining_days }}</td>
            <td class="num right muted">{{ r.suggested_days }}</td>
            <td class="right">
              <button class="btn btn-xs btn-primary" :disabled="busy === r.employee_id" @click="saveRow(r)">{{ $t("저장") }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from "vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import { leaveGrantApi } from "@/api/leave";
import { departmentApi } from "@/api/hr";
import { useToast } from "vue-toastification";

const toast = useToast();

const thisYear = new Date().getFullYear();
const yearOptions = [thisYear + 1, thisYear, thisYear - 1, thisYear - 2, thisYear - 3].map((y) => ({ value: y, label: String(y) }));

const rows = ref([]);
const deptOptions = ref([]);
const busy = ref(null);
const applying = ref(false);

const filter = reactive({
  department_id: null,
  year: thisYear,
  q: "",
});

/** ISO → "2026-08-03" */
const ymd = (v) => (v ? String(v).slice(0, 10) : "-");

async function load() {
  const res = await leaveGrantApi.list({
    department_id: filter.department_id || null,
    year: filter.year,
    q: filter.q || undefined,
  });
  rows.value = res || [];
}

/** 행 하나의 부여일수 저장 */
async function saveRow(r) {
  busy.value = r.employee_id;
  try {
    const granted = r.granted_days === "" || r.granted_days == null ? 0 : Number(r.granted_days);
    const grant = await leaveGrantApi.save({
      employee_id: r.employee_id,
      year: filter.year,
      granted_days: granted,
      note: r.note || undefined,
    });
    // 서버가 계산한 잔여 등을 반영
    if (grant) {
      r.grant_id = grant.id ?? r.grant_id;
      if (grant.granted_days != null) r.granted_days = grant.granted_days;
    }
    r.remaining_days = granted - (r.used_days || 0);
    toast.success("부여가 저장되었습니다.");
  } catch (e) {
    toast.error(e?.message || "저장에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

/** 부여가 비었거나 0인 행을 제안값으로 채워 순차 저장 */
async function applySuggested() {
  const targets = rows.value.filter((r) => {
    const g = r.granted_days === "" || r.granted_days == null ? 0 : Number(r.granted_days);
    return g === 0 && r.suggested_days > 0;
  });
  if (!targets.length) {
    toast.info("적용할 대상이 없습니다.");
    return;
  }
  if (!confirm(`${targets.length}명에게 법정 제안값을 부여하시겠습니까?`)) return;
  applying.value = true;
  try {
    for (const r of targets) {
      r.granted_days = r.suggested_days;
      await leaveGrantApi.save({
        employee_id: r.employee_id,
        year: filter.year,
        granted_days: r.suggested_days,
        note: r.note || undefined,
      });
      r.remaining_days = r.suggested_days - (r.used_days || 0);
    }
    toast.success(`${targets.length}명 부여 완료`);
    await load();
  } catch (e) {
    toast.error(e?.message || "일괄 적용에 실패했습니다.");
  } finally {
    applying.value = false;
  }
}

onMounted(async () => {
  const depts = await departmentApi.options();
  deptOptions.value = depts.map((d) => ({ value: d.id, label: `${"　".repeat(d.depth)}${d.name}` }));
  await load();
});
</script>

<style scoped>
.att { margin: 0; }
.phead { margin-bottom: 1.1rem; }
.ttl { font-size: 1.5rem; font-weight: 700; color: var(--text); }
.muted { color: var(--text-subtle); }
.gcell { width: 90px; display: inline-block; text-align: right; }
</style>
