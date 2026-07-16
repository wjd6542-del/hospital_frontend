<template>
  <div class="fac">
    <div class="cards">
      <div class="scard open">
        <span class="lbl">{{ $t("처리 대기") }}</span>
        <b class="val num">{{ summary.open }}</b>
      </div>
      <div class="scard"><span class="lbl">{{ $t("접수") }}</span><b class="val num">{{ summary.byStatus.RECEIVED }}</b></div>
      <div class="scard"><span class="lbl">{{ $t("진행중") }}</span><b class="val num prog">{{ summary.byStatus.IN_PROGRESS }}</b></div>
      <div class="scard"><span class="lbl">{{ $t("완료") }}</span><b class="val num done">{{ summary.byStatus.DONE }}</b></div>
    </div>

    <div class="filterbar">
      <span class="f-label">{{ $t("상태") }}</span>
      <SearchSelect v-model="filter.status" size="xs" :options="statusFilterOptions" :placeholder="$t('전체')" @change="load(1)" />
      <span class="f-label">{{ $t("우선순위") }}</span>
      <SearchSelect v-model="filter.priority" size="xs" :options="priorityFilterOptions" :placeholder="$t('전체')" @change="load(1)" />
      <span class="f-label">{{ $t("부서") }}</span>
      <SearchSelect v-model="filter.department_id" size="xs" :options="deptOptions" :placeholder="$t('전체')" @change="load(1)" />
      <input v-model="filter.q" class="field field-xs" style="width: 150px" :placeholder="$t('제목 · 위치 · 담당자')" @keyup.enter="load(1)" />
      <button class="btn btn-xs" @click="load(1)">{{ $t("검색") }}</button>
      <button class="btn btn-xs btn-primary" style="margin-left: auto" @click="openNew">＋ {{ $t("요청 등록") }}</button>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("요청일") }}</th>
            <th>{{ $t("우선순위") }}</th>
            <th>{{ $t("제목") }}</th>
            <th>{{ $t("위치") }}</th>
            <th>{{ $t("담당자") }}</th>
            <th>{{ $t("상태") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="7"><EmptyState icon="fa-screwdriver-wrench" :title="$t('유지보수 요청이 없습니다')" :desc="$t('요청 등록 버튼으로 접수하세요.')" compact /></td>
          </tr>
          <tr v-for="r in rows" :key="r.id" class="rowclick" @click="openEdit(r)">
            <td class="num">{{ ymd(r.reported_at) }}</td>
            <td><span class="badge" :class="PRIORITY[r.priority].cls">{{ $t(PRIORITY[r.priority].label) }}</span></td>
            <td class="strong">{{ r.title }}</td>
            <td>{{ r.location || "-" }}</td>
            <td>{{ r.assignee || "-" }}</td>
            <td><span class="badge" :class="STATUS[r.status].cls">{{ $t(STATUS[r.status].label) }}</span></td>
            <td class="acts" @click.stop>
              <button v-if="r.status === 'RECEIVED'" class="btn btn-xs btn-primary" :disabled="busy === r.id" @click="setStatus(r, 'IN_PROGRESS')">{{ $t("진행") }}</button>
              <button v-if="r.status === 'IN_PROGRESS'" class="btn btn-xs btn-primary" :disabled="busy === r.id" @click="setStatus(r, 'DONE')">{{ $t("완료") }}</button>
              <button class="btn btn-xs" @click="openEdit(r)">{{ $t("수정") }}</button>
              <button v-if="r.status !== 'DONE' && r.status !== 'CANCELED'" class="btn btn-xs btn-ghost" :disabled="busy === r.id" @click="setStatus(r, 'CANCELED')">{{ $t("취소") }}</button>
              <button class="btn btn-xs btn-ghost" :disabled="busy === r.id" @click="remove(r)">{{ $t("삭제") }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <Pager v-if="totalPages > 1" :page="page" :total="total" :total-pages="totalPages" @change="load" />
    </div>

    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel">
        <header class="dhead"><h2>{{ form.id ? $t("요청 수정") : $t("유지보수 요청 등록") }}</h2></header>
        <section class="sec">
          <label class="fld"><span class="form-label">{{ $t("제목") }}<span class="req">*</span></span>
            <input v-model="form.title" class="field" :placeholder="$t('요청 제목')" />
          </label>
          <div class="grid2">
            <label class="fld"><span class="form-label">{{ $t("위치") }}</span>
              <input v-model="form.location" class="field" :placeholder="$t('본관 3층 등')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("분류") }}</span>
              <input v-model="form.category" class="field" :placeholder="$t('전기/배관 등')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("우선순위") }}</span>
              <SearchSelect v-model="form.priority" :options="priorityOptions" :clearable="false" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("상태") }}</span>
              <SearchSelect v-model="form.status" :options="statusOptions" :clearable="false" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("요청일") }}</span>
              <DatePicker v-model="form.reported_at" mode="date" :placeholder="$t('요청일')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("부서") }}</span>
              <SearchSelect v-model="form.department_id" :options="deptOptions" :placeholder="$t('선택 안 함')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("담당자") }}</span>
              <input v-model="form.assignee" class="field" :placeholder="$t('담당자')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("완료일") }}</span>
              <DatePicker v-model="form.resolved_at" mode="date" :placeholder="$t('완료 시')" />
            </label>
          </div>
          <label class="fld"><span class="form-label">{{ $t("요청 내용") }}</span>
            <textarea v-model="form.content" class="field" rows="2" :placeholder="$t('증상·요청 내용')"></textarea>
          </label>
          <label class="fld"><span class="form-label">{{ $t("처리 내용") }}</span>
            <textarea v-model="form.resolution" class="field" rows="2" :placeholder="$t('처리 결과(선택)')"></textarea>
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
import { facilityApi } from "@/api/facility";
import { departmentApi } from "@/api/hr";
import { formatDateOnly } from "@/utils/date";
import { useToast } from "vue-toastification";
import { useI18nStore } from "@/stores/i18n";

const toast = useToast();
const i18n = useI18nStore();

const PRIORITY = {
  LOW: { label: "낮음", cls: "badge-neutral" },
  NORMAL: { label: "보통", cls: "badge-info" },
  HIGH: { label: "높음", cls: "badge-warning" },
  URGENT: { label: "긴급", cls: "badge-error" },
};
const STATUS = {
  RECEIVED: { label: "접수", cls: "badge-neutral" },
  IN_PROGRESS: { label: "진행중", cls: "badge-info" },
  DONE: { label: "완료", cls: "badge-success" },
  CANCELED: { label: "취소", cls: "badge-error" },
};
const priorityOptions = computed(() => Object.entries(PRIORITY).map(([value, s]) => ({ value, label: i18n.t(s.label) })));
const priorityFilterOptions = computed(() => [{ value: null, label: i18n.t("전체") }, ...priorityOptions.value]);
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
const summary = reactive({ byStatus: { RECEIVED: 0, IN_PROGRESS: 0, DONE: 0, CANCELED: 0 }, open: 0 });

const filter = reactive({ status: null, priority: null, department_id: null, q: "" });

const form = reactive({ id: null, title: "", location: "", category: "", priority: "NORMAL", status: "RECEIVED", reported_at: "", resolved_at: "", department_id: null, assignee: "", content: "", resolution: "" });

function openNew() {
  Object.assign(form, { id: null, title: "", location: "", category: "", priority: "NORMAL", status: "RECEIVED", reported_at: formatDateOnly(new Date()), resolved_at: "", department_id: null, assignee: "", content: "", resolution: "" });
  showForm.value = true;
}
function openEdit(r) {
  Object.assign(form, {
    id: r.id, title: r.title, location: r.location || "", category: r.category || "",
    priority: r.priority, status: r.status,
    reported_at: ymd(r.reported_at) === "-" ? "" : ymd(r.reported_at),
    resolved_at: ymd(r.resolved_at) === "-" ? "" : ymd(r.resolved_at),
    department_id: r.department_id, assignee: r.assignee || "", content: r.content || "", resolution: r.resolution || "",
  });
  showForm.value = true;
}

async function load(p = page.value) {
  page.value = p;
  const [res, sum] = await Promise.all([
    facilityApi.list({
      status: filter.status || undefined,
      priority: filter.priority || undefined,
      department_id: filter.department_id || undefined,
      q: filter.q || undefined,
      page: p,
      limit: limit.value,
    }),
    facilityApi.summary(),
  ]);
  rows.value = res.rows || [];
  total.value = res.total || 0;
  totalPages.value = res.totalPages || 0;
  Object.assign(summary, sum);
}

async function save() {
  if (!form.title.trim() || !form.reported_at) { toast.warning("제목·요청일은 필수입니다."); return; }
  saving.value = true;
  try {
    await facilityApi.save({
      id: form.id || undefined,
      title: form.title.trim(),
      location: form.location || undefined,
      category: form.category || undefined,
      priority: form.priority,
      status: form.status,
      reported_at: form.reported_at,
      resolved_at: form.resolved_at || undefined,
      department_id: form.department_id || undefined,
      assignee: form.assignee || undefined,
      content: form.content || undefined,
      resolution: form.resolution || undefined,
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
    await facilityApi.setStatus(r.id, status);
    await load();
  } catch (e) {
    toast.error(e?.message || "상태 변경에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

async function remove(r) {
  if (!confirm("이 요청을 삭제하시겠습니까?")) return;
  busy.value = r.id;
  try {
    await facilityApi.remove(r.id);
    toast.success("삭제되었습니다.");
    await load();
  } catch (e) {
    toast.error(e?.message || "삭제에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

onMounted(async () => {
  const depts = await departmentApi.options();
  deptOptions.value = depts.map((d) => ({ value: d.id, label: `${"　".repeat(d.depth)}${d.name}` }));
  await load(1);
});
</script>

<style scoped>
.fac { margin: 0; }
.cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8rem; margin-bottom: 1rem; }
.scard { display: flex; flex-direction: column; gap: 0.3rem; padding: 0.8rem 1rem; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); box-shadow: var(--shadow-sm); }
.scard .lbl { font-size: 0.7rem; font-weight: 600; color: var(--text-subtle); }
.scard .val { font-size: 1.35rem; font-weight: 800; color: var(--text); }
.scard.open { border-left: 3px solid var(--accent); }
.scard.open .val { color: var(--accent); }
.scard .val.prog { color: var(--info); }
.scard .val.done { color: var(--positive); }

.tbl td.strong { font-weight: 700; color: var(--text); }
.rowclick { cursor: pointer; }
.rowclick:hover td { background: var(--surface-2); }
.acts { display: flex; gap: 0.3rem; white-space: nowrap; }
.req { color: var(--danger); margin-left: 2px; }

.drawer { position: fixed; inset: 0; z-index: 70; background: rgba(15, 23, 42, 0.45); display: flex; justify-content: flex-end; }
.panel { width: 580px; max-width: 100%; height: 100%; overflow-y: auto; background: var(--surface); padding: 1.4rem 1.6rem; display: flex; flex-direction: column; }
.dhead { margin-bottom: 1.2rem; }
.dhead h2 { font-size: 1.1rem; font-weight: 700; color: var(--text); }
.sec { display: flex; flex-direction: column; gap: 0.7rem; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem 0.9rem; }
.fld { display: block; }
.dfoot { margin-top: auto; padding-top: 1.2rem; display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); }
</style>
