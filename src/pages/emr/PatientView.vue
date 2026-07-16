<template>
  <div class="pat">
    <header class="phead">
      <h1 class="ttl">{{ $t("환자 관리") }}</h1>
    </header>

    <div class="filterbar">
      <span class="f-label">{{ $t("상태") }}</span>
      <SearchSelect v-model="filter.status" size="xs" :options="statusOptions" :placeholder="$t('전체')" @change="load(1)" />
      <input v-model="filter.q" class="field field-xs" style="width: 200px" :placeholder="$t('이름 · 번호 · 전화')" @keyup.enter="load(1)" />
      <button class="btn btn-xs" @click="load(1)">{{ $t("검색") }}</button>
      <button class="btn btn-xs btn-primary" style="margin-left: auto" @click="openNew">＋ {{ $t("환자 등록") }}</button>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("환자번호") }}</th>
            <th>{{ $t("이름") }}</th>
            <th>{{ $t("성별") }}</th>
            <th>{{ $t("생년월일") }}</th>
            <th>{{ $t("전화") }}</th>
            <th>{{ $t("상태") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="7"><EmptyState icon="fa-hospital-user" :title="$t('등록된 환자가 없습니다')" :desc="$t('환자 등록 버튼으로 새 환자를 추가하세요.')" compact /></td>
          </tr>
          <tr v-for="r in rows" :key="r.id" class="rowclick" @click="openEdit(r.id)">
            <td class="num">{{ r.patient_no }}</td>
            <td>{{ r.name }}</td>
            <td>{{ SEX_LABEL[r.sex] || "-" }}</td>
            <td class="num">{{ ymd(r.birth_date) }}</td>
            <td class="num">{{ r.phone || "-" }}</td>
            <td>
              <span v-if="r.is_active" class="badge badge-success">{{ $t("활성") }}</span>
              <span v-else class="badge badge-neutral">{{ $t("비활성") }}</span>
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

    <!-- 등록/수정 드로어 -->
    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel">
        <header class="dhead"><h2>{{ form.id ? $t("환자 수정") : $t("환자 등록") }}</h2></header>

        <section class="sec">
          <h3 class="sttl">{{ $t("기본 정보") }}</h3>
          <div class="grid2">
            <label class="fld"><span class="form-label">{{ $t("환자번호") }}<span class="req">*</span></span>
              <input v-model="form.patient_no" class="field" :placeholder="$t('환자번호')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("이름") }}<span class="req">*</span></span>
              <input v-model="form.name" class="field" :placeholder="$t('이름')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("성별") }}</span>
              <SearchSelect v-model="form.sex" :options="sexOptions" :placeholder="$t('선택 안 함')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("생년월일") }}</span>
              <DatePicker v-model="form.birth_date" mode="date" :placeholder="$t('생년월일')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("전화") }}</span>
              <input v-model="form.phone" class="field" :placeholder="$t('전화번호')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("혈액형") }}</span>
              <SearchSelect v-model="form.blood_type" :options="bloodOptions" :placeholder="$t('선택 안 함')" />
            </label>
          </div>
          <label class="fld" style="margin-top: 0.7rem"><span class="form-label">{{ $t("주소") }}</span>
            <input v-model="form.address" class="field" :placeholder="$t('주소')" />
          </label>
        </section>

        <section class="sec">
          <h3 class="sttl">{{ $t("임상 메모") }}</h3>
          <label class="fld"><span class="form-label">{{ $t("알레르기") }}</span>
            <textarea v-model="form.allergies" class="field" rows="2" :placeholder="$t('알레르기(선택)')"></textarea>
          </label>
          <label class="fld" style="margin-top: 0.7rem"><span class="form-label">{{ $t("메모") }}</span>
            <textarea v-model="form.memo" class="field" rows="2" :placeholder="$t('메모(선택)')"></textarea>
          </label>
        </section>

        <section class="sec">
          <label class="chk"><input v-model="form.is_active" type="checkbox" /> {{ $t("활성 상태") }}</label>
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
import { patientApi } from "@/api/emr";
import { useToast } from "vue-toastification";
import { useI18nStore } from "@/stores/i18n";

const toast = useToast();
const i18n = useI18nStore();

const SEX_LABEL = { M: "남", F: "여", OTHER: "기타" };
const sexOptions = computed(() => [
  { value: "M", label: i18n.t("남") },
  { value: "F", label: i18n.t("여") },
  { value: "OTHER", label: i18n.t("기타") },
]);
const bloodOptions = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((b) => ({ value: b, label: b }));
const statusOptions = computed(() => [
  { value: null, label: i18n.t("전체") },
  { value: "active", label: i18n.t("활성") },
  { value: "inactive", label: i18n.t("비활성") },
]);

const ymd = (v) => (v ? String(v).slice(0, 10) : "-");

const rows = ref([]);
const total = ref(0);
const totalPages = ref(0);
const page = ref(1);
const limit = ref(20);
const busy = ref(null);
const saving = ref(false);
const showForm = ref(false);

const filter = reactive({ q: "", status: null });

const blank = () => ({
  id: null,
  patient_no: "",
  name: "",
  birth_date: "",
  sex: null,
  phone: "",
  address: "",
  blood_type: null,
  allergies: "",
  memo: "",
  is_active: true,
});
const form = reactive(blank());

function reset(src = blank()) {
  Object.assign(form, blank(), src);
}

async function load(p = page.value) {
  page.value = p;
  const res = await patientApi.list({
    q: filter.q || undefined,
    is_active: filter.status === "active" ? true : filter.status === "inactive" ? false : undefined,
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
  const p = await patientApi.get(id);
  reset({
    id: p.id,
    patient_no: p.patient_no || "",
    name: p.name || "",
    birth_date: p.birth_date ? String(p.birth_date).slice(0, 10) : "",
    sex: p.sex || null,
    phone: p.phone || "",
    address: p.address || "",
    blood_type: p.blood_type || null,
    allergies: p.allergies || "",
    memo: p.memo || "",
    is_active: p.is_active !== false,
  });
  showForm.value = true;
}

async function save() {
  if (!form.patient_no.trim() || !form.name.trim()) {
    toast.warning("환자번호·이름은 필수입니다.");
    return;
  }
  saving.value = true;
  try {
    await patientApi.save({
      id: form.id || undefined,
      patient_no: form.patient_no.trim(),
      name: form.name.trim(),
      birth_date: form.birth_date || undefined,
      sex: form.sex || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      blood_type: form.blood_type || undefined,
      allergies: form.allergies || undefined,
      memo: form.memo || undefined,
      is_active: form.is_active,
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
  if (!confirm("이 환자를 삭제하시겠습니까?")) return;
  busy.value = r.id;
  try {
    await patientApi.remove(r.id);
    toast.success("삭제되었습니다.");
    await load();
  } catch (e) {
    toast.error(e?.message || "삭제에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

onMounted(() => load(1));
</script>

<style scoped>
.pat { max-width: 1200px; margin: 0 auto; }
.phead { margin-bottom: 1.1rem; }
.ttl { font-size: 1.5rem; font-weight: 700; color: var(--text); }
.req { color: var(--danger); margin-left: 2px; }

.rowclick { cursor: pointer; }
.rowclick:hover { background: var(--surface-2); }
.acts { display: flex; gap: 0.3rem; white-space: nowrap; }

.drawer { position: fixed; inset: 0; z-index: 70; background: rgba(15, 23, 42, 0.45); display: flex; justify-content: flex-end; }
.panel { width: 560px; max-width: 100%; height: 100%; overflow-y: auto; background: var(--surface); padding: 1.4rem 1.6rem; display: flex; flex-direction: column; }
.dhead { margin-bottom: 1.2rem; }
.dhead h2 { font-size: 1.1rem; font-weight: 700; color: var(--text); }

.sec { margin-bottom: 1.6rem; }
.sttl { font-size: 0.88rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.7rem; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem 0.9rem; }
.fld { display: block; }
.chk { display: flex; align-items: center; gap: 0.5rem; font-size: 0.86rem; color: var(--text); cursor: pointer; }

.dfoot { margin-top: auto; padding-top: 1.2rem; display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); }
</style>
