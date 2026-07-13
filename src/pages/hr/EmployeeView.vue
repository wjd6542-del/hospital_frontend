<template>
  <div class="emp">
    <header class="phead">
      <h1 class="ttl">{{ $t("직원 관리") }}</h1>
    </header>

    <div class="filterbar">
      <span class="f-label">{{ $t("부서") }}</span>
      <SearchSelect v-model="filter.department_id" :options="deptOptions" :placeholder="$t('전체')" />
      <span class="f-label">{{ $t("직종") }}</span>
      <SearchSelect v-model="filter.job_type_id" :options="jobOptions" :placeholder="$t('전체')" />
      <span class="f-label">{{ $t("상태") }}</span>
      <select v-model="filter.status" class="field field-xs" style="width: 110px">
        <option :value="undefined">{{ $t("전체") }}</option>
        <option value="active">{{ $t("재직") }}</option>
        <option value="resigned">{{ $t("퇴사") }}</option>
      </select>
      <input v-model="filter.q" class="field field-xs" style="width: 180px" :placeholder="$t('이름 · 사번')" @keyup.enter="load(1)" />
      <button class="btn btn-xs" @click="load(1)">{{ $t("검색") }}</button>
      <button class="btn btn-xs btn-primary" style="margin-left: auto" @click="openNew">＋ {{ $t("직원 등록") }}</button>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th class="th">{{ $t("사번") }}</th>
            <th class="th">{{ $t("이름") }}</th>
            <th class="th">{{ $t("부서") }}</th>
            <th class="th">{{ $t("직급") }}</th>
            <th class="th">{{ $t("직종") }}</th>
            <th class="th">{{ $t("입사일") }}</th>
            <th class="th">{{ $t("상태") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="7"><EmptyState icon="fa-user" :title="$t('직원이 없습니다')" :desc="$t('직원을 등록하면 여기에 표시됩니다.')" compact /></td>
          </tr>
          <tr v-for="e in rows" :key="e.id" class="rowclick" @click="openEdit(e.id)">
            <td class="td num">{{ e.emp_no }}</td>
            <td class="td">{{ e.name }}</td>
            <td class="td">{{ e.department?.name || "-" }}</td>
            <td class="td">{{ e.position?.text || "-" }}</td>
            <td class="td">{{ e.job_type?.text || "-" }}</td>
            <td class="td num">{{ fmt(e.hired_at) }}</td>
            <td class="td">
              <span v-if="e.resigned_at" class="badge badge-neutral">{{ $t("퇴사") }}</span>
              <span v-else class="badge badge-success">{{ $t("재직") }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <Pager v-if="totalPages > 1" :page="page" :total="total" :total-pages="totalPages" @change="load" />
    </div>

    <!-- 상세 드로어 -->
    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel">
        <header class="dhead">
          <h2>{{ form.id ? $t("직원 상세") : $t("직원 등록") }}</h2>
          <span v-if="form.resigned_at" class="badge badge-neutral">{{ $t("퇴사") }} · {{ fmt(form.resigned_at) }}</span>
        </header>

        <p v-if="isResigned" class="lockmsg">
          {{ $t("퇴사한 직원의 정보는 수정할 수 없습니다. 인사 기록은 그대로 보존됩니다.") }}
        </p>

        <!-- 퇴사자는 전체를 잠근다 — 필드마다 :disabled 를 붙이는 대신 fieldset 하나로 -->
        <fieldset class="fs" :disabled="isResigned">
        <section class="sec">
          <h3 class="sttl">{{ $t("신원") }}</h3>
          <div class="grid2">
            <label class="fld"><span class="form-label">{{ $t("사번") }}</span><input v-model="form.emp_no" class="field" /></label>
            <label class="fld"><span class="form-label">{{ $t("이름") }}</span><input v-model="form.name" class="field" /></label>
            <label class="fld"><span class="form-label">{{ $t("영문명") }}</span><input v-model="form.name_en" class="field" /></label>
            <label class="fld"><span class="form-label">{{ $t("연락처") }}</span><input v-model="form.phone" class="field" /></label>
            <label class="fld"><span class="form-label">{{ $t("이메일") }}</span><input v-model="form.email" class="field" /></label>
          </div>
        </section>

        <section class="sec">
          <h3 class="sttl">{{ $t("소속") }}</h3>
          <div class="grid2">
            <label class="fld"><span class="form-label">{{ $t("부서") }}</span><SearchSelect v-model="form.department_id" :options="deptOptions" :placeholder="$t('부서 선택')" /></label>
            <label class="fld"><span class="form-label">{{ $t("직급") }}</span><SearchSelect v-model="form.position_id" :options="posOptions" :placeholder="$t('직급 선택')" /></label>
            <label class="fld"><span class="form-label">{{ $t("직종") }}</span><SearchSelect v-model="form.job_type_id" :options="jobOptions" :placeholder="$t('직종 선택')" /></label>
            <label class="fld"><span class="form-label">{{ $t("고용형태") }}</span><SearchSelect v-model="form.employment_type_id" :options="empTypeOptions" :placeholder="$t('고용형태 선택')" /></label>
            <label class="fld"><span class="form-label">{{ $t("입사일") }}</span><input v-model="form.hired_at" type="date" class="field" /></label>
          </div>
        </section>

        <section class="sec">
          <header class="sechead">
            <h3 class="sttl">{{ $t("면허") }}</h3>
            <button class="btn btn-xs" @click="addLicense">＋ {{ $t("면허 추가") }}</button>
          </header>
          <div v-if="!form.licenses.length" class="nolic">{{ $t("등록된 면허가 없습니다.") }}</div>
          <div v-for="(l, i) in form.licenses" :key="i" class="licrow">
            <SearchSelect v-model="l.license_type_id" :options="licOptions" :placeholder="$t('종류')" />
            <input v-model="l.license_no" class="field field-xs" :placeholder="$t('면허번호')" />
            <input v-model="l.issued_at" type="date" class="field field-xs" />
            <input v-model="l.expires_at" type="date" class="field field-xs" />
            <button class="btn btn-xs btn-ghost" @click="form.licenses.splice(i, 1)">✕</button>
          </div>
        </section>
        </fieldset>

        <footer class="dfoot">
          <button v-if="form.id && !form.resigned_at" class="btn btn-xs" @click="resign">{{ $t("퇴사 처리") }}</button>
          <span style="flex: 1"></span>
          <button class="btn btn-xs" @click="showForm = false">{{ $t("닫기") }}</button>
          <button v-if="!isResigned" class="btn btn-xs btn-primary" :disabled="saving" @click="save">
            {{ saving ? $t("저장 중…") : $t("저장") }}
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted } from "vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import Pager from "@/components/base/Pager.vue";
import { employeeApi, departmentApi, categoryApi } from "@/api/hr";
import { useToast } from "vue-toastification";
import { formatDateDot as fmt } from "@/utils/date";

const toast = useToast();

const rows = ref([]);
const total = ref(0);
const totalPages = ref(0);
const page = ref(1);
const limit = ref(20);
const saving = ref(false);
const showForm = ref(false);

const filter = reactive({ q: "", department_id: null, job_type_id: null, status: undefined });

const deptOptions = ref([]);
const posOptions = ref([]);
const jobOptions = ref([]);
const empTypeOptions = ref([]);
const licOptions = ref([]);

const blank = () => ({
  id: null,
  emp_no: "",
  name: "",
  name_en: "",
  department_id: null,
  position_id: null,
  job_type_id: null,
  employment_type_id: null,
  phone: "",
  email: "",
  hired_at: "",
  resigned_at: null,
  is_active: true,
  licenses: [],
});
const form = reactive(blank());
const isResigned = computed(() => !!form.resigned_at);

function reset(src = blank()) {
  Object.assign(form, blank(), src);
}

async function load(p = page.value) {
  page.value = p;
  // SearchSelect의 '지우기' 버튼은 빈 문자열을 emit 하므로, 서버 검증(z.coerce.number().nullish())이
  // 통과하도록 조회 시점에 null로 정규화한다.
  const res = await employeeApi.list({
    ...filter,
    department_id: filter.department_id || null,
    job_type_id: filter.job_type_id || null,
    page: p,
    limit: limit.value,
  });
  rows.value = res.rows || [];
  total.value = res.total || 0;
  totalPages.value = res.totalPages || 0;
}

function openNew() {
  reset();
  showForm.value = true;
}

async function openEdit(id) {
  const e = await employeeApi.get(id);
  reset({
    ...e,
    hired_at: e.hired_at ? String(e.hired_at).slice(0, 10) : "",
    resigned_at: e.resigned_at ? String(e.resigned_at).slice(0, 10) : null,
    licenses: (e.licenses || []).map((l) => ({
      license_type_id: l.license_type_id,
      license_no: l.license_no,
      issued_at: l.issued_at ? String(l.issued_at).slice(0, 10) : null,
      expires_at: l.expires_at ? String(l.expires_at).slice(0, 10) : null,
    })),
  });
  showForm.value = true;
}

function addLicense() {
  form.licenses.push({ license_type_id: null, license_no: "", issued_at: null, expires_at: null });
}

async function save() {
  if (!form.emp_no.trim() || !form.name.trim() || !form.hired_at) {
    toast.warning("사번·이름·입사일은 필수입니다.");
    return;
  }
  saving.value = true;
  try {
    const body = { ...form };
    delete body.resigned_at; // 퇴사는 resign 으로만 처리한다
    // SearchSelect의 '지우기' 버튼은 빈 문자열을 emit 하므로, 서버 검증(z.coerce.number().nullish())이
    // 통과하도록 저장 시점에 null로 정규화한다. id는 항상 양의 정수라 falsy 값(""·0·null)은 안전하게 null로 취급 가능하다.
    body.department_id = form.department_id || null;
    body.position_id = form.position_id || null;
    body.job_type_id = form.job_type_id || null;
    body.employment_type_id = form.employment_type_id || null;
    body.licenses = form.licenses
      .filter((l) => l.license_type_id && l.license_no?.trim())
      .map((l) => ({ ...l, license_type_id: l.license_type_id || null }));
    await employeeApi.save(body);
    toast.success("직원이 저장되었습니다.");
    showForm.value = false;
    await load();
  } catch (e) {
    toast.error(e?.message || "저장에 실패했습니다.");
  } finally {
    saving.value = false;
  }
}

async function resign() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    await employeeApi.resign(form.id, today);
    toast.success("퇴사 처리되었습니다.");
    showForm.value = false;
    await load();
  } catch (e) {
    toast.error(e?.message || "퇴사 처리에 실패했습니다.");
  }
}

onMounted(async () => {
  const [depts, pos, job, empType, lic] = await Promise.all([
    departmentApi.options(),
    categoryApi.list({ group: "position", only_active: true }),
    categoryApi.list({ group: "job_type", only_active: true }),
    categoryApi.list({ group: "employment_type", only_active: true }),
    categoryApi.list({ group: "license_type", only_active: true }),
  ]);
  // 계층 들여쓰기 — depth 만큼 공백을 앞에 붙인다
  deptOptions.value = depts.map((d) => ({
    value: d.id,
    label: `${"　".repeat(d.depth)}${d.name}`,
  }));
  posOptions.value = pos.map((c) => ({ value: c.id, label: c.text }));
  jobOptions.value = job.map((c) => ({ value: c.id, label: c.text }));
  empTypeOptions.value = empType.map((c) => ({ value: c.id, label: c.text }));
  licOptions.value = lic.map((c) => ({ value: c.id, label: c.text }));
  await load(1);
});
</script>

<style scoped>
.emp { max-width: 1200px; margin: 0 auto; }
.phead { margin-bottom: 1.1rem; }
.ttl { font-size: 1.5rem; font-weight: 700; color: var(--text); }

.rowclick { cursor: pointer; }
.rowclick:hover { background: var(--surface-2); }

.drawer { position: fixed; inset: 0; z-index: 70; background: rgba(15, 23, 42, 0.45); display: flex; justify-content: flex-end; }
.panel { width: 640px; max-width: 100%; height: 100%; overflow-y: auto; background: var(--surface); padding: 1.4rem 1.6rem; display: flex; flex-direction: column; }
.dhead { display: flex; align-items: center; gap: 0.7rem; margin-bottom: 1.2rem; }
.dhead h2 { font-size: 1.1rem; font-weight: 700; color: var(--text); }

.sec { margin-bottom: 1.6rem; }
.sechead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.7rem; }
.sttl { font-size: 0.88rem; font-weight: 600; color: var(--text-muted); }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem 0.9rem; }
.fld { display: block; }

.nolic { font-size: 0.82rem; color: var(--text-subtle); padding: 0.6rem 0; }
.licrow { display: grid; grid-template-columns: 1.2fr 1.2fr 1fr 1fr auto; gap: 0.4rem; margin-bottom: 0.4rem; align-items: center; }

.fs { border: none; padding: 0; margin: 0; min-width: 0; }
.fs:disabled { opacity: 0.72; }
.lockmsg {
  margin-bottom: 1.2rem; padding: 0.6rem 0.8rem;
  font-size: 0.82rem; color: var(--text-muted);
  background: var(--surface-2); border-radius: var(--radius);
  border-left: 3px solid var(--border-strong);
}

.dfoot { margin-top: auto; padding-top: 1.2rem; display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); }
</style>
