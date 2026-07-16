<template>
  <div class="enc">
    <header class="phead">
      <h1 class="ttl">{{ $t("검사") }}</h1>
    </header>

    <div class="filterbar">
      <span class="f-label">{{ $t("상태") }}</span>
      <SearchSelect v-model="filter.status" size="xs" :options="statusFilterOptions" :placeholder="$t('전체')" @change="load(1)" />
      <span class="f-label">{{ $t("우선순위") }}</span>
      <SearchSelect v-model="filter.priority" size="xs" :options="priorityFilterOptions" :placeholder="$t('전체')" @change="load(1)" />
      <span class="f-label">{{ $t("기간") }}</span>
      <DateRangePicker v-model="range" mode="date" size="xs" @change="onRangeChange" />
      <input v-model="filter.q" class="field field-xs" style="width: 180px" :placeholder="$t('환자 · 검사 검색')" @keyup.enter="load(1)" />
      <button class="btn btn-xs" @click="load(1)">{{ $t("검색") }}</button>
      <button class="btn btn-xs btn-primary" style="margin-left: auto" @click="openNew">＋ {{ $t("검사 오더") }}</button>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("오더일") }}</th>
            <th>{{ $t("환자") }}</th>
            <th>{{ $t("우선순위") }}</th>
            <th>{{ $t("검사") }}</th>
            <th>{{ $t("상태") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="6"><EmptyState icon="fa-flask" :title="$t('검사 오더가 없습니다')" :desc="$t('검사 오더 버튼으로 새 오더를 등록하세요.')" compact /></td>
          </tr>
          <tr v-for="r in rows" :key="r.id" class="rowclick" @click="onRowClick(r)">
            <td class="num">{{ ymd(r.ordered_at) }}</td>
            <td>{{ r.patient?.name }} <span class="pno">{{ r.patient?.patient_no }}</span></td>
            <td>
              <span v-if="r.priority === 'STAT'" class="badge badge-error">{{ $t("응급") }}</span>
              <span v-else>{{ $t("일반") }}</span>
            </td>
            <td class="clip">{{ testSummary(r.items) }}</td>
            <td><span class="badge" :class="STATUS[r.status]?.cls">{{ $t(STATUS[r.status]?.label || r.status) }}</span></td>
            <td class="acts" @click.stop>
              <template v-if="r.status === 'ORDERED'">
                <button class="btn btn-xs" @click="openEdit(r.id)">{{ $t("수정") }}</button>
                <button class="btn btn-xs btn-primary" @click="openResult(r.id)">{{ $t("결과입력") }}</button>
                <button class="btn btn-xs btn-ghost" :disabled="busy === r.id" @click="cancel(r)">{{ $t("취소") }}</button>
              </template>
              <template v-else-if="r.status === 'RESULTED'">
                <button class="btn btn-xs" @click="openResult(r.id)">{{ $t("결과보기") }}</button>
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

    <!-- 오더 작성/수정 드로어 -->
    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel wide">
        <header class="dhead"><h2>{{ form.id ? $t("검사 오더 수정") : $t("검사 오더") }}</h2></header>

        <section class="sec">
          <div class="grid2">
            <label class="fld"><span class="form-label">{{ $t("환자") }}<span class="req">*</span></span>
              <SearchSelect v-model="form.patient_id" :options="patientOptions" :placeholder="$t('환자 선택')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("오더일") }}<span class="req">*</span></span>
              <DatePicker v-model="form.ordered_at" mode="date" :placeholder="$t('오더일')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("의사") }}</span>
              <SearchSelect v-model="form.doctor_id" :options="doctorOptions" :placeholder="$t('선택 안 함')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("우선순위") }}</span>
              <SearchSelect v-model="form.priority" :options="priorityOptions" :clearable="false" />
            </label>
          </div>
          <label class="fld" style="margin-top: 0.7rem"><span class="form-label">{{ $t("메모") }}</span>
            <input v-model="form.memo" class="field" :placeholder="$t('메모(선택)')" />
          </label>
        </section>

        <section class="sec">
          <div class="itemhead">
            <span class="form-label">{{ $t("검사 항목") }}</span>
            <button class="btn btn-xs" @click="addItem">＋ {{ $t("검사 추가") }}</button>
          </div>
          <table class="itbl">
            <thead>
              <tr>
                <th style="width: 220px">{{ $t("검사") }}</th>
                <th>{{ $t("검사명") }}</th>
                <th style="width: 90px">{{ $t("단위") }}</th>
                <th style="width: 150px">{{ $t("참고범위") }}</th>
                <th style="width: 34px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, i) in form.items" :key="i">
                <td><SearchSelect v-model="it.lab_test_id" size="xs" :options="testOptions" :placeholder="$t('선택')" @change="onTestPick(it)" /></td>
                <td><input v-model="it.test_name" class="cell-input" :placeholder="$t('검사명')" /></td>
                <td><input v-model="it.unit" class="cell-input" :placeholder="$t('단위')" /></td>
                <td><input v-model="it.ref_range" class="cell-input" :placeholder="$t('참고범위')" /></td>
                <td><button class="irm" @click="form.items.splice(i, 1)"><i class="fa-solid fa-xmark"></i></button></td>
              </tr>
              <tr v-if="!form.items.length"><td colspan="5" class="iempty">{{ $t("검사를 추가하세요.") }}</td></tr>
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

    <!-- 결과 입력 드로어 -->
    <div v-if="showResult" class="drawer" @click.self="showResult = false">
      <div class="panel wide">
        <header class="dhead">
          <h2>{{ $t("검사 결과") }}</h2>
          <p class="dsub">{{ result.patientName }} <span class="pno">{{ result.patientNo }}</span> · {{ ymd(result.orderedAt) }}</p>
        </header>

        <section class="sec">
          <table class="itbl">
            <thead>
              <tr>
                <th>{{ $t("검사명") }}</th>
                <th style="width: 150px">{{ $t("참고범위") }}</th>
                <th style="width: 80px">{{ $t("단위") }}</th>
                <th style="width: 140px">{{ $t("결과값") }}</th>
                <th style="width: 130px">{{ $t("플래그") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in result.items" :key="it.id">
                <td>{{ it.test_name }}</td>
                <td>{{ it.ref_range || "-" }}</td>
                <td>{{ it.unit || "-" }}</td>
                <td><input v-model="it.result_value" class="cell-input" :placeholder="$t('결과값')" /></td>
                <td>
                  <div class="flagcell">
                    <span v-if="it.flag" class="badge" :class="FLAG[it.flag]?.cls">{{ $t(FLAG[it.flag]?.label || it.flag) }}</span>
                    <span v-else class="flagdash">-</span>
                    <SearchSelect v-model="it.flag" size="xs" style="width: 84px" :options="flagOptions" :placeholder="$t('자동')" />
                  </div>
                </td>
              </tr>
              <tr v-if="!result.items.length"><td colspan="5" class="iempty">{{ $t("검사 항목이 없습니다.") }}</td></tr>
            </tbody>
          </table>
        </section>

        <footer class="dfoot">
          <span style="flex: 1"></span>
          <button class="btn btn-xs" @click="showResult = false">{{ $t("닫기") }}</button>
          <button class="btn btn-xs btn-primary" :disabled="savingResult" @click="saveResult">{{ savingResult ? $t("저장 중…") : $t("결과 저장") }}</button>
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
import { labOrderApi, labTestApi } from "@/api/lab";
import { patientApi } from "@/api/emr";
import { employeeApi } from "@/api/hr";
import { formatDateOnly } from "@/utils/date";
import { useToast } from "vue-toastification";
import { useI18nStore } from "@/stores/i18n";

const toast = useToast();
const i18n = useI18nStore();

const STATUS = {
  ORDERED: { label: "오더", cls: "badge-warning" },
  RESULTED: { label: "결과완료", cls: "badge-success" },
  CANCELED: { label: "취소", cls: "badge-muted" },
};
const statusFilterOptions = computed(() => [
  { value: null, label: i18n.t("전체") },
  ...Object.entries(STATUS).map(([value, s]) => ({ value, label: i18n.t(s.label) })),
]);

const PRIORITY = { ROUTINE: "일반", STAT: "응급" };
const priorityOptions = computed(() => Object.entries(PRIORITY).map(([value, label]) => ({ value, label: i18n.t(label) })));
const priorityFilterOptions = computed(() => [{ value: null, label: i18n.t("전체") }, ...priorityOptions.value]);

const FLAG = {
  HIGH: { label: "높음", cls: "badge-error" },
  LOW: { label: "낮음", cls: "badge-info" },
  ABNORMAL: { label: "이상", cls: "badge-warning" },
  NORMAL: { label: "정상", cls: "badge-success" },
};
const flagOptions = computed(() => [
  { value: null, label: i18n.t("자동") },
  ...Object.entries(FLAG).map(([value, f]) => ({ value, label: i18n.t(f.label) })),
]);

const ymd = (v) => (v ? String(v).slice(0, 10) : "-");
const testSummary = (items) => {
  const list = items || [];
  if (!list.length) return "-";
  const first = list[0].test_name || list[0].lab_test?.name || "-";
  return list.length > 1 ? `${first} ${i18n.t("외")} ${list.length - 1}${i18n.t("건")}` : first;
};

const rows = ref([]);
const total = ref(0);
const totalPages = ref(0);
const page = ref(1);
const limit = ref(30);
const busy = ref(null);
const saving = ref(false);
const savingResult = ref(false);
const showForm = ref(false);
const showResult = ref(false);

const doctorOptions = ref([]);
const patientOptions = ref([]);
const testOptions = ref([]);
const testMap = ref({});

const filter = reactive({ status: null, priority: null, date_from: null, date_to: null, q: "" });
const range = ref({ start: null, end: null });

function onRangeChange() {
  filter.date_from = range.value?.start ? formatDateOnly(range.value.start) : null;
  filter.date_to = range.value?.end ? formatDateOnly(range.value.end) : null;
  load(1);
}

function onRowClick(r) {
  if (r.status === "ORDERED") openEdit(r.id);
  else if (r.status === "RESULTED") openResult(r.id);
}

// ---- 오더 작성/수정 ----
const blank = () => ({
  id: null,
  patient_id: null,
  doctor_id: null,
  ordered_at: "",
  priority: "ROUTINE",
  memo: "",
  items: [],
});
const form = reactive(blank());

function reset(src = blank()) {
  Object.assign(form, blank(), src);
}

function addItem() {
  form.items.push({ lab_test_id: null, test_name: "", unit: "", ref_range: "" });
}
function refRangeOf(t) {
  if (t.ref_text) return t.ref_text;
  const lo = t.ref_low ?? null;
  const hi = t.ref_high ?? null;
  if (lo !== null && hi !== null) return `${lo} ~ ${hi}`;
  if (lo !== null) return `≥ ${lo}`;
  if (hi !== null) return `≤ ${hi}`;
  return "";
}
function onTestPick(it) {
  const t = testMap.value[it.lab_test_id];
  if (!t) return;
  it.test_name = t.name;
  it.unit = t.unit || "";
  it.ref_range = refRangeOf(t);
}

async function load(p = page.value) {
  page.value = p;
  const res = await labOrderApi.list({
    status: filter.status || undefined,
    priority: filter.priority || undefined,
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
  reset({ ordered_at: formatDateOnly(new Date()) });
  showForm.value = true;
}

async function openEdit(id) {
  const e = await labOrderApi.get(id);
  reset({
    id: e.id,
    patient_id: e.patient?.id ?? null,
    doctor_id: e.doctor?.id ?? null,
    ordered_at: e.ordered_at ? String(e.ordered_at).slice(0, 10) : "",
    priority: e.priority || "ROUTINE",
    memo: e.memo || "",
    items: (e.items || []).map((it) => ({
      lab_test_id: it.lab_test_id ?? null,
      test_name: it.test_name || "",
      unit: it.unit || "",
      ref_range: it.ref_range || "",
    })),
  });
  showForm.value = true;
}

async function save() {
  if (!form.patient_id || !form.ordered_at) {
    toast.warning("환자·오더일은 필수입니다.");
    return;
  }
  const items = form.items.filter((it) => it.test_name?.trim() || it.lab_test_id);
  if (!items.length || items.some((it) => !it.test_name?.trim())) {
    toast.warning("각 검사 행의 검사명은 필수입니다.");
    return;
  }
  saving.value = true;
  try {
    await labOrderApi.save({
      id: form.id || undefined,
      patient_id: form.patient_id,
      doctor_id: form.doctor_id || undefined,
      ordered_at: form.ordered_at,
      priority: form.priority,
      memo: form.memo || undefined,
      items: items.map((it) => ({
        lab_test_id: it.lab_test_id || undefined,
        test_name: it.test_name.trim(),
        unit: it.unit || undefined,
        ref_range: it.ref_range || undefined,
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

// ---- 결과 입력 ----
const result = reactive({ orderId: null, patientName: "", patientNo: "", orderedAt: "", items: [] });

async function openResult(id) {
  const e = await labOrderApi.get(id);
  result.orderId = e.id;
  result.patientName = e.patient?.name || "";
  result.patientNo = e.patient?.patient_no || "";
  result.orderedAt = e.ordered_at || "";
  result.items = (e.items || []).map((it) => ({
    id: it.id,
    test_name: it.test_name || it.lab_test?.name || "",
    ref_range: it.ref_range || "",
    unit: it.unit || "",
    result_value: it.result_value ?? "",
    flag: it.flag || null,
  }));
  showResult.value = true;
}

async function saveResult() {
  savingResult.value = true;
  try {
    const res = await labOrderApi.result(
      result.orderId,
      result.items.map((it) => ({ item_id: it.id, result_value: it.result_value, flag: it.flag || undefined })),
    );
    // 반환된 items 의 flag(자동판정 포함)로 화면 갱신
    const updated = res?.items || [];
    const byId = Object.fromEntries(updated.map((u) => [u.id, u]));
    result.items.forEach((it) => {
      const u = byId[it.id];
      if (u) {
        it.result_value = u.result_value ?? it.result_value;
        it.flag = u.flag || null;
      }
    });
    toast.success("결과가 저장되었습니다");
    await load();
  } catch (e) {
    toast.error(e?.message || "결과 저장에 실패했습니다.");
  } finally {
    savingResult.value = false;
  }
}

async function cancel(r) {
  if (!confirm("이 검사 오더를 취소하시겠습니까?")) return;
  busy.value = r.id;
  try {
    await labOrderApi.cancel(r.id);
    toast.success("취소되었습니다.");
    await load();
  } catch (e) {
    toast.error(e?.message || "취소에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

async function remove(r) {
  if (!confirm("이 검사 오더를 삭제하시겠습니까?")) return;
  busy.value = r.id;
  try {
    await labOrderApi.remove(r.id);
    toast.success("삭제되었습니다.");
    await load();
  } catch (e) {
    toast.error(e?.message || "삭제에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

onMounted(async () => {
  const [docs, patients, tests] = await Promise.all([
    employeeApi.options(),
    patientApi.list({ limit: 500 }),
    labTestApi.list(),
  ]);
  doctorOptions.value = docs.map((e) => ({ value: e.id, label: e.emp_no ? `${e.name} (${e.emp_no})` : e.name }));
  patientOptions.value = (patients.rows || []).map((p) => ({ value: p.id, label: `${p.name} (${p.patient_no})` }));
  const testRows = Array.isArray(tests) ? tests : tests?.rows || [];
  testOptions.value = testRows.map((t) => ({ value: t.id, label: t.code ? `${t.name} (${t.code})` : t.name }));
  testMap.value = Object.fromEntries(testRows.map((t) => [t.id, t]));
  await load(1);
});
</script>

<style scoped>
.enc { margin: 0; }
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
.panel.wide { width: 880px; }
.dhead { margin-bottom: 1.2rem; }
.dhead h2 { font-size: 1.1rem; font-weight: 700; color: var(--text); }
.dsub { margin-top: 0.3rem; font-size: 0.82rem; color: var(--text-muted); }

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
.flagcell { display: flex; align-items: center; gap: 0.4rem; }
.flagdash { color: var(--text-subtle); }

.dfoot { margin-top: auto; padding-top: 1.2rem; display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); }
</style>
