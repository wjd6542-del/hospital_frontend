<template>
  <div class="ast">
    <!-- 요약 -->
    <div class="cards">
      <div class="scard total">
        <span class="lbl">{{ $t("총 취득가") }}</span>
        <b class="val num">{{ won(summary.total_cost) }}</b>
        <span class="sub">{{ summary.total_count }}{{ $t("건") }}</span>
      </div>
      <div v-for="s in ['ACTIVE', 'REPAIR', 'IDLE', 'DISPOSED']" :key="s" class="scard" :class="s.toLowerCase()">
        <span class="lbl">{{ $t(STATUS[s].label) }}</span>
        <b class="val num">{{ summary.byStatus[s] || 0 }}</b>
      </div>
    </div>

    <div class="filterbar">
      <span class="f-label">{{ $t("상태") }}</span>
      <SearchSelect v-model="filter.status" size="xs" :options="statusFilterOptions" :placeholder="$t('전체')" @change="load(1)" />
      <span class="f-label">{{ $t("부서") }}</span>
      <SearchSelect v-model="filter.department_id" size="xs" :options="deptOptions" :placeholder="$t('전체')" @change="load(1)" />
      <input v-model="filter.q" class="field field-xs" style="width: 170px" :placeholder="$t('자산명 · 자산번호')" @keyup.enter="load(1)" />
      <button class="btn btn-xs" @click="load(1)">{{ $t("검색") }}</button>
      <button class="btn btn-xs btn-primary" style="margin-left: auto" @click="openNew">＋ {{ $t("자산 등록") }}</button>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("자산번호") }}</th>
            <th>{{ $t("자산명") }}</th>
            <th>{{ $t("분류") }}</th>
            <th>{{ $t("취득일") }}</th>
            <th class="right">{{ $t("취득가") }}</th>
            <th>{{ $t("부서") }}</th>
            <th>{{ $t("상태") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="8"><EmptyState icon="fa-heart-pulse" :title="$t('자산이 없습니다')" :desc="$t('자산 등록 버튼으로 추가하세요.')" compact /></td>
          </tr>
          <tr v-for="r in rows" :key="r.id" class="rowclick" @click="openEdit(r)">
            <td class="num">{{ r.asset_no || "-" }}</td>
            <td class="strong">{{ r.name }}</td>
            <td>{{ r.category || "-" }}</td>
            <td class="num">{{ ymd(r.acquired_at) }}</td>
            <td class="num right">{{ won(r.acquire_cost) }}</td>
            <td>{{ r.department?.name || "-" }}</td>
            <td><span class="badge" :class="STATUS[r.status].cls">{{ $t(STATUS[r.status].label) }}</span></td>
            <td class="acts" @click.stop>
              <button class="btn btn-xs" @click="openEdit(r)">{{ $t("수정") }}</button>
              <button class="btn btn-xs btn-ghost" @click="remove(r)">{{ $t("삭제") }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <Pager v-if="totalPages > 1" :page="page" :total="total" :total-pages="totalPages" @change="load" />
    </div>

    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel">
        <header class="dhead"><h2>{{ form.id ? $t("자산 수정") : $t("자산 등록") }}</h2></header>
        <section class="sec">
          <div class="grid2">
            <label class="fld"><span class="form-label">{{ $t("자산번호") }}</span>
              <input v-model="form.asset_no" class="field" placeholder="AST-001" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("자산명") }}<span class="req">*</span></span>
              <input v-model="form.name" class="field" :placeholder="$t('자산명')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("분류") }}</span>
              <input v-model="form.category" class="field" :placeholder="$t('의료장비 등')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("상태") }}</span>
              <SearchSelect v-model="form.status" :options="statusOptions" :clearable="false" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("취득일") }}</span>
              <DatePicker v-model="form.acquired_at" mode="date" :placeholder="$t('취득일')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("취득가") }}</span>
              <input v-model.number="form.acquire_cost" type="number" min="0" class="field" :placeholder="$t('취득가(원)')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("배치 부서") }}</span>
              <SearchSelect v-model="form.department_id" :options="deptOptions" :placeholder="$t('선택 안 함')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("구매처") }}</span>
              <SearchSelect v-model="form.vendor_id" :options="vendorOptions" :placeholder="$t('선택 안 함')" />
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
import EmptyState from "@/components/base/EmptyState.vue";
import Pager from "@/components/base/Pager.vue";
import { assetApi } from "@/api/asset";
import { vendorApi } from "@/api/purchase";
import { departmentApi } from "@/api/hr";
import { useToast } from "vue-toastification";
import { useI18nStore } from "@/stores/i18n";

const toast = useToast();
const i18n = useI18nStore();

const STATUS = {
  ACTIVE: { label: "운영중", cls: "badge-success" },
  REPAIR: { label: "수리중", cls: "badge-warning" },
  IDLE: { label: "유휴", cls: "badge-neutral" },
  DISPOSED: { label: "폐기", cls: "badge-error" },
};
const statusOptions = computed(() => Object.entries(STATUS).map(([value, s]) => ({ value, label: i18n.t(s.label) })));
const statusFilterOptions = computed(() => [{ value: null, label: i18n.t("전체") }, ...statusOptions.value]);

const won = (v) => `${Number(v || 0).toLocaleString()}${i18n.t("원")}`;
const ymd = (v) => (v ? String(v).slice(0, 10) : "-");

const rows = ref([]);
const total = ref(0);
const totalPages = ref(0);
const page = ref(1);
const limit = ref(30);
const saving = ref(false);
const showForm = ref(false);
const deptOptions = ref([]);
const vendorOptions = ref([]);
const summary = reactive({ byStatus: { ACTIVE: 0, REPAIR: 0, IDLE: 0, DISPOSED: 0 }, total_count: 0, total_cost: 0 });

const filter = reactive({ status: null, department_id: null, q: "" });

const form = reactive({ id: null, asset_no: "", name: "", category: "", acquired_at: "", acquire_cost: 0, status: "ACTIVE", department_id: null, vendor_id: null, memo: "" });

function openNew() {
  Object.assign(form, { id: null, asset_no: "", name: "", category: "", acquired_at: "", acquire_cost: 0, status: "ACTIVE", department_id: null, vendor_id: null, memo: "" });
  showForm.value = true;
}
function openEdit(r) {
  Object.assign(form, {
    id: r.id, asset_no: r.asset_no || "", name: r.name, category: r.category || "",
    acquired_at: ymd(r.acquired_at) === "-" ? "" : ymd(r.acquired_at), acquire_cost: Number(r.acquire_cost),
    status: r.status, department_id: r.department_id, vendor_id: r.vendor_id, memo: r.memo || "",
  });
  showForm.value = true;
}

async function load(p = page.value) {
  page.value = p;
  const [res, sum] = await Promise.all([
    assetApi.list({
      status: filter.status || undefined,
      department_id: filter.department_id || undefined,
      q: filter.q || undefined,
      page: p,
      limit: limit.value,
    }),
    assetApi.summary(),
  ]);
  rows.value = res.rows || [];
  total.value = res.total || 0;
  totalPages.value = res.totalPages || 0;
  Object.assign(summary, sum);
}

async function save() {
  if (!form.name.trim()) { toast.warning("자산명을 입력하세요."); return; }
  saving.value = true;
  try {
    await assetApi.save({
      id: form.id || undefined,
      asset_no: form.asset_no || undefined,
      name: form.name.trim(),
      category: form.category || undefined,
      acquired_at: form.acquired_at || undefined,
      acquire_cost: Number(form.acquire_cost) || 0,
      status: form.status,
      department_id: form.department_id || undefined,
      vendor_id: form.vendor_id || undefined,
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

async function remove(r) {
  if (!confirm(`'${r.name}' 자산을 삭제하시겠습니까?`)) return;
  try {
    await assetApi.remove(r.id);
    toast.success("삭제되었습니다.");
    await load();
  } catch (e) {
    toast.error(e?.message || "삭제에 실패했습니다.");
  }
}

onMounted(async () => {
  const [depts, vendors] = await Promise.all([departmentApi.options(), vendorApi.list({ only_active: true })]);
  deptOptions.value = depts.map((d) => ({ value: d.id, label: `${"　".repeat(d.depth)}${d.name}` }));
  vendorOptions.value = vendors.map((v) => ({ value: v.id, label: v.name }));
  await load(1);
});
</script>

<style scoped>
.ast { max-width: 1300px; margin: 0 auto; }
.cards { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 0.8rem; margin-bottom: 1rem; }
.scard { display: flex; flex-direction: column; gap: 0.3rem; padding: 0.8rem 1rem; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); box-shadow: var(--shadow-sm); }
.scard .lbl { font-size: 0.7rem; font-weight: 600; color: var(--text-subtle); }
.scard .val { font-size: 1.25rem; font-weight: 800; color: var(--text); }
.scard .sub { font-size: 0.7rem; color: var(--text-subtle); }
.scard.total { border-left: 3px solid var(--accent); }
.scard.total .val { color: var(--accent); font-size: 1.3rem; }
.scard.active .val { color: var(--positive); }
.scard.repair .val { color: var(--warning); }
.scard.disposed .val { color: var(--danger); }

.tbl td.strong { font-weight: 700; color: var(--text); }
.rowclick { cursor: pointer; }
.rowclick:hover td { background: var(--surface-2); }
.acts { display: flex; gap: 0.3rem; white-space: nowrap; }
.req { color: var(--danger); margin-left: 2px; }

.drawer { position: fixed; inset: 0; z-index: 70; background: rgba(15, 23, 42, 0.45); display: flex; justify-content: flex-end; }
.panel { width: 560px; max-width: 100%; height: 100%; overflow-y: auto; background: var(--surface); padding: 1.4rem 1.6rem; display: flex; flex-direction: column; }
.dhead { margin-bottom: 1.2rem; }
.dhead h2 { font-size: 1.1rem; font-weight: 700; color: var(--text); }
.sec { display: flex; flex-direction: column; gap: 0.7rem; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem 0.9rem; }
.fld { display: block; }
.dfoot { margin-top: auto; padding-top: 1.2rem; display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); }
</style>
