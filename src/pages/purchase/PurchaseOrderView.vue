<template>
  <div class="po">
    <div class="filterbar">
      <span class="f-label">{{ $t("기간") }}</span>
      <DateRangePicker v-model="range" mode="date" size="xs" @change="onRangeChange" />
      <span class="f-label">{{ $t("상태") }}</span>
      <SearchSelect v-model="filter.status" size="xs" :options="statusFilterOptions" :placeholder="$t('전체')" @change="load(1)" />
      <span class="f-label">{{ $t("거래처") }}</span>
      <SearchSelect v-model="filter.vendor_id" size="xs" :options="vendorOptions" :placeholder="$t('전체')" @change="load(1)" />
      <input v-model="filter.q" class="field field-xs" style="width: 150px" :placeholder="$t('거래처 · 품목 · 메모')" @keyup.enter="load(1)" />
      <button class="btn btn-xs" @click="load(1)">{{ $t("검색") }}</button>
      <button class="btn btn-xs btn-primary" style="margin-left: auto" @click="openNew">＋ {{ $t("발주 등록") }}</button>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("발주일") }}</th>
            <th>{{ $t("거래처") }}</th>
            <th>{{ $t("부서") }}</th>
            <th class="right">{{ $t("품목") }}</th>
            <th class="right">{{ $t("총액") }}</th>
            <th>{{ $t("상태") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="7"><EmptyState icon="fa-cart-shopping" :title="$t('발주가 없습니다')" :desc="$t('발주 등록 버튼으로 새 발주를 만드세요.')" compact /></td>
          </tr>
          <tr v-for="r in rows" :key="r.id">
            <td class="num">{{ ymd(r.order_date) }}</td>
            <td>{{ r.vendor?.name }}</td>
            <td>{{ r.department?.name || "-" }}</td>
            <td class="num right">{{ r.items.length }}</td>
            <td class="num right strong">{{ won(r.total) }}</td>
            <td><span class="badge" :class="STATUS[r.status].cls">{{ $t(STATUS[r.status].label) }}</span></td>
            <td class="acts">
              <button v-if="r.status === 'DRAFT'" class="btn btn-xs btn-primary" :disabled="busy === r.id" @click="setStatus(r, 'ORDERED')">{{ $t("발주") }}</button>
              <button v-if="r.status === 'ORDERED'" class="btn btn-xs btn-primary" :disabled="busy === r.id" @click="setStatus(r, 'RECEIVED')">{{ $t("입고완료") }}</button>
              <button class="btn btn-xs" @click="openEdit(r)">{{ $t("수정") }}</button>
              <button v-if="r.status !== 'CANCELED' && r.status !== 'RECEIVED'" class="btn btn-xs btn-ghost" :disabled="busy === r.id" @click="setStatus(r, 'CANCELED')">{{ $t("취소") }}</button>
              <button class="btn btn-xs btn-ghost" :disabled="busy === r.id" @click="remove(r)">{{ $t("삭제") }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <Pager v-if="totalPages > 1" :page="page" :total="total" :total-pages="totalPages" @change="load" />
    </div>

    <!-- 등록/수정 드로어 -->
    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel wide">
        <header class="dhead"><h2>{{ form.id ? $t("발주 수정") : $t("발주 등록") }}</h2></header>

        <section class="sec">
          <div class="grid2">
            <label class="fld"><span class="form-label">{{ $t("거래처") }}<span class="req">*</span></span>
              <SearchSelect v-model="form.vendor_id" :options="vendorOptions" :placeholder="$t('거래처 선택')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("발주일") }}<span class="req">*</span></span>
              <DatePicker v-model="form.order_date" mode="date" :placeholder="$t('발주일')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("부서") }}</span>
              <SearchSelect v-model="form.department_id" :options="deptOptions" :placeholder="$t('선택 안 함')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("상태") }}</span>
              <SearchSelect v-model="form.status" :options="statusOptions" :clearable="false" />
            </label>
          </div>
        </section>

        <section class="sec">
          <div class="itemhead">
            <span class="form-label">{{ $t("품목") }}<span class="req">*</span></span>
            <button class="btn btn-xs" @click="addItem">＋ {{ $t("품목 추가") }}</button>
          </div>
          <table class="itbl">
            <thead>
              <tr><th>{{ $t("품목명") }}</th><th style="width: 90px">{{ $t("수량") }}</th><th style="width: 80px">{{ $t("단위") }}</th><th style="width: 120px">{{ $t("단가") }}</th><th style="width: 120px" class="right">{{ $t("금액") }}</th><th style="width: 34px"></th></tr>
            </thead>
            <tbody>
              <tr v-for="(it, i) in form.items" :key="i">
                <td><input v-model="it.name" class="cell-input" :placeholder="$t('품목명')" /></td>
                <td><input v-model.number="it.qty" type="number" min="0" class="cell-input" /></td>
                <td><input v-model="it.unit" class="cell-input" :placeholder="$t('개')" /></td>
                <td><input v-model.number="it.unit_price" type="number" min="0" class="cell-input" /></td>
                <td class="num right">{{ won((it.qty || 0) * (it.unit_price || 0)) }}</td>
                <td><button class="irm" @click="form.items.splice(i, 1)"><i class="fa-solid fa-xmark"></i></button></td>
              </tr>
              <tr v-if="!form.items.length"><td colspan="6" class="iempty">{{ $t("품목을 추가하세요.") }}</td></tr>
            </tbody>
            <tfoot>
              <tr><td colspan="4" class="right strong">{{ $t("합계") }}</td><td class="num right strong">{{ won(formTotal) }}</td><td></td></tr>
            </tfoot>
          </table>
        </section>

        <section class="sec">
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
import DateRangePicker from "@/components/base/DateRangePicker.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import Pager from "@/components/base/Pager.vue";
import { vendorApi, orderApi } from "@/api/purchase";
import { departmentApi } from "@/api/hr";
import { formatDateOnly } from "@/utils/date";
import { useToast } from "vue-toastification";
import { useI18nStore } from "@/stores/i18n";

const toast = useToast();
const i18n = useI18nStore();

const STATUS = {
  DRAFT: { label: "임시", cls: "badge-neutral" },
  ORDERED: { label: "발주", cls: "badge-info" },
  RECEIVED: { label: "입고완료", cls: "badge-success" },
  CANCELED: { label: "취소", cls: "badge-error" },
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
const busy = ref(null);
const saving = ref(false);
const showForm = ref(false);
const vendorOptions = ref([]);
const deptOptions = ref([]);

const filter = reactive({ date_from: null, date_to: null, status: null, vendor_id: null, q: "" });
const range = ref({ start: null, end: null });

function onRangeChange() {
  filter.date_from = range.value?.start ? formatDateOnly(range.value.start) : null;
  filter.date_to = range.value?.end ? formatDateOnly(range.value.end) : null;
  load(1);
}

const form = reactive({ id: null, vendor_id: null, order_date: "", department_id: null, status: "DRAFT", memo: "", items: [] });
const formTotal = computed(() => form.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unit_price) || 0), 0));

function addItem() { form.items.push({ name: "", qty: 1, unit: "", unit_price: 0 }); }

function openNew() {
  Object.assign(form, { id: null, vendor_id: null, order_date: formatDateOnly(new Date()), department_id: null, status: "DRAFT", memo: "", items: [] });
  addItem();
  showForm.value = true;
}
function openEdit(r) {
  Object.assign(form, {
    id: r.id, vendor_id: r.vendor_id, order_date: ymd(r.order_date), department_id: r.department_id,
    status: r.status, memo: r.memo || "",
    items: r.items.map((it) => ({ name: it.name, qty: Number(it.qty), unit: it.unit || "", unit_price: Number(it.unit_price) })),
  });
  showForm.value = true;
}

async function load(p = page.value) {
  page.value = p;
  const res = await orderApi.list({
    date_from: filter.date_from || undefined,
    date_to: filter.date_to || undefined,
    status: filter.status || undefined,
    vendor_id: filter.vendor_id || undefined,
    q: filter.q || undefined,
    page: p,
    limit: limit.value,
  });
  rows.value = res.rows || [];
  total.value = res.total || 0;
  totalPages.value = res.totalPages || 0;
}

async function save() {
  if (!form.vendor_id || !form.order_date) { toast.warning("거래처·발주일은 필수입니다."); return; }
  const items = form.items.filter((it) => it.name.trim());
  if (!items.length) { toast.warning("품목을 1개 이상 입력하세요."); return; }
  saving.value = true;
  try {
    await orderApi.save({
      id: form.id || undefined,
      vendor_id: form.vendor_id,
      order_date: form.order_date,
      status: form.status,
      department_id: form.department_id || undefined,
      memo: form.memo || undefined,
      items: items.map((it) => ({ name: it.name.trim(), qty: Number(it.qty) || 0, unit: it.unit || undefined, unit_price: Number(it.unit_price) || 0 })),
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
    await orderApi.setStatus(r.id, status);
    await load();
  } catch (e) {
    toast.error(e?.message || "상태 변경에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

async function remove(r) {
  if (!confirm("이 발주를 삭제하시겠습니까?")) return;
  busy.value = r.id;
  try {
    await orderApi.remove(r.id);
    toast.success("삭제되었습니다.");
    await load();
  } catch (e) {
    toast.error(e?.message || "삭제에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

onMounted(async () => {
  const [vendors, depts] = await Promise.all([vendorApi.list({ only_active: true }), departmentApi.options()]);
  vendorOptions.value = vendors.map((v) => ({ value: v.id, label: v.name }));
  deptOptions.value = depts.map((d) => ({ value: d.id, label: `${"　".repeat(d.depth)}${d.name}` }));
  await load(1);
});
</script>

<style scoped>
.po { max-width: 1300px; margin: 0 auto; }
.tbl td.strong { font-weight: 800; }
.acts { display: flex; gap: 0.3rem; white-space: nowrap; }
.req { color: var(--danger); margin-left: 2px; }

.drawer { position: fixed; inset: 0; z-index: 70; background: rgba(15, 23, 42, 0.45); display: flex; justify-content: flex-end; }
.panel { width: 540px; max-width: 100%; height: 100%; overflow-y: auto; background: var(--surface); padding: 1.4rem 1.6rem; display: flex; flex-direction: column; }
.panel.wide { width: 680px; }
.dhead { margin-bottom: 1.2rem; }
.dhead h2 { font-size: 1.1rem; font-weight: 700; color: var(--text); }
.sec { margin-bottom: 1.4rem; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem 0.9rem; }
.fld { display: block; }

.itemhead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.itbl { width: 100%; border-collapse: collapse; }
.itbl th { text-align: left; font-size: 0.68rem; color: var(--text-subtle); font-weight: 600; padding: 0.3rem 0.4rem; border-bottom: 1px solid var(--border); }
.itbl th.right { text-align: right; }
.itbl td { padding: 0.25rem 0.35rem; vertical-align: middle; }
.itbl td.num { font-family: var(--font-num); }
.itbl td.right { text-align: right; }
.itbl tfoot td { border-top: 1px solid var(--border-strong); padding-top: 0.5rem; }
.itbl .strong { font-weight: 800; }
.irm { color: var(--text-subtle); width: 24px; height: 24px; }
.irm:hover { color: var(--danger); }
.iempty { text-align: center; color: var(--text-subtle); font-size: 0.8rem; padding: 0.8rem; }
.dfoot { margin-top: auto; padding-top: 1.2rem; display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); }
</style>
