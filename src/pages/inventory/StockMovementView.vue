<template>
  <div class="mov">
    <div class="filterbar">
      <span class="f-label">{{ $t("기간") }}</span>
      <DateRangePicker v-model="range" mode="date" size="xs" @change="onRangeChange" />
      <span class="f-label">{{ $t("유형") }}</span>
      <SearchSelect v-model="filter.type" size="xs" :options="typeFilterOptions" :placeholder="$t('전체')" @change="load(1)" />
      <span class="f-label">{{ $t("품목") }}</span>
      <SearchSelect v-model="filter.item_id" size="xs" :options="itemOptions" :placeholder="$t('전체')" @change="load(1)" />
      <input v-model="filter.q" class="field field-xs" style="width: 140px" :placeholder="$t('품목 · 메모')" @keyup.enter="load(1)" />
      <button class="btn btn-xs" @click="load(1)">{{ $t("검색") }}</button>
      <button class="btn btn-xs btn-primary" style="margin-left: auto" @click="openNew">＋ {{ $t("입출고 등록") }}</button>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("일자") }}</th>
            <th>{{ $t("유형") }}</th>
            <th>{{ $t("품목") }}</th>
            <th class="right">{{ $t("수량") }}</th>
            <th>{{ $t("부서") }}</th>
            <th>{{ $t("메모") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="7"><EmptyState icon="fa-right-left" :title="$t('입출고 이력이 없습니다')" :desc="$t('입출고 등록 버튼으로 기록하세요.')" compact /></td>
          </tr>
          <tr v-for="r in rows" :key="r.id">
            <td class="num">{{ ymd(r.moved_at) }}</td>
            <td><span class="badge" :class="TYPE[r.type].cls">{{ $t(TYPE[r.type].label) }}</span></td>
            <td>{{ r.item?.name }}</td>
            <td class="num right strong" :class="r.qty >= 0 ? 'pos' : 'neg'">{{ r.qty > 0 ? "+" : "" }}{{ fmt(r.qty) }} {{ r.item?.unit || "" }}</td>
            <td>{{ r.department?.name || "-" }}</td>
            <td class="memo">{{ r.memo || "" }}</td>
            <td><button class="btn btn-xs btn-ghost" :disabled="busy === r.id" @click="remove(r)">{{ $t("삭제") }}</button></td>
          </tr>
        </tbody>
      </table>
      <Pager v-if="totalPages > 1" :page="page" :total="total" :total-pages="totalPages" @change="load" />
    </div>

    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel small">
        <header class="dhead"><h2>{{ $t("입출고 등록") }}</h2></header>
        <section class="sec">
          <label class="fld"><span class="form-label">{{ $t("유형") }}<span class="req">*</span></span>
            <SearchSelect v-model="form.type" :options="typeOptions" :clearable="false" />
          </label>
          <label class="fld"><span class="form-label">{{ $t("품목") }}<span class="req">*</span></span>
            <SearchSelect v-model="form.item_id" :options="itemOptions" :placeholder="$t('품목 선택')" />
          </label>
          <div class="grid2">
            <label class="fld"><span class="form-label">{{ $t("수량") }}<span class="req">*</span></span>
              <input v-model.number="form.qty" type="number" class="field" :placeholder="form.type === 'ADJUST' ? $t('±수량') : $t('수량')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("일자") }}</span>
              <DatePicker v-model="form.moved_at" mode="date" :placeholder="$t('일자')" />
            </label>
          </div>
          <p v-if="form.type === 'ADJUST'" class="ahint">{{ $t("조정은 부호로 증감을 표시합니다. 예: -5 는 5 감소.") }}</p>
          <label class="fld"><span class="form-label">{{ $t("부서") }}</span>
            <SearchSelect v-model="form.department_id" :options="deptOptions" :placeholder="$t('선택 안 함')" />
          </label>
          <label class="fld"><span class="form-label">{{ $t("메모") }}</span>
            <textarea v-model="form.memo" class="field" rows="2" :placeholder="$t('사유·메모(선택)')"></textarea>
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
import { itemApi, movementApi } from "@/api/inventory";
import { departmentApi } from "@/api/hr";
import { formatDateOnly } from "@/utils/date";
import { useToast } from "vue-toastification";
import { useI18nStore } from "@/stores/i18n";

const toast = useToast();
const i18n = useI18nStore();

const TYPE = {
  IN: { label: "입고", cls: "badge-success" },
  OUT: { label: "출고", cls: "badge-warning" },
  ADJUST: { label: "조정", cls: "badge-neutral" },
};
const typeOptions = computed(() => Object.entries(TYPE).map(([value, t]) => ({ value, label: i18n.t(t.label) })));
const typeFilterOptions = computed(() => [{ value: null, label: i18n.t("전체") }, ...typeOptions.value]);

const fmt = (v) => Number(v || 0).toLocaleString();
const ymd = (v) => (v ? String(v).slice(0, 10) : "-");

const rows = ref([]);
const total = ref(0);
const totalPages = ref(0);
const page = ref(1);
const limit = ref(30);
const busy = ref(null);
const saving = ref(false);
const showForm = ref(false);
const itemOptions = ref([]);
const deptOptions = ref([]);

const filter = reactive({ date_from: null, date_to: null, type: null, item_id: null, q: "" });
const range = ref({ start: null, end: null });

function onRangeChange() {
  filter.date_from = range.value?.start ? formatDateOnly(range.value.start) : null;
  filter.date_to = range.value?.end ? formatDateOnly(range.value.end) : null;
  load(1);
}

const form = reactive({ type: "IN", item_id: null, qty: null, moved_at: "", department_id: null, memo: "" });

function openNew() {
  Object.assign(form, { type: "IN", item_id: null, qty: null, moved_at: formatDateOnly(new Date()), department_id: null, memo: "" });
  showForm.value = true;
}

async function load(p = page.value) {
  page.value = p;
  const res = await movementApi.list({
    date_from: filter.date_from || undefined,
    date_to: filter.date_to || undefined,
    type: filter.type || undefined,
    item_id: filter.item_id || undefined,
    q: filter.q || undefined,
    page: p,
    limit: limit.value,
  });
  rows.value = res.rows || [];
  total.value = res.total || 0;
  totalPages.value = res.totalPages || 0;
}

async function save() {
  if (!form.item_id || !form.qty || !form.moved_at) { toast.warning("유형·품목·수량은 필수입니다."); return; }
  saving.value = true;
  try {
    await movementApi.save({
      item_id: form.item_id,
      type: form.type,
      qty: Number(form.qty),
      moved_at: form.moved_at,
      department_id: form.department_id || undefined,
      memo: form.memo || undefined,
    });
    toast.success("저장되었습니다.");
    showForm.value = false;
    await load(1);
  } catch (e) {
    toast.error(e?.message || "저장에 실패했습니다.");
  } finally {
    saving.value = false;
  }
}

async function remove(r) {
  if (!confirm("이 이력을 삭제하시겠습니까? 현재고가 조정됩니다.")) return;
  busy.value = r.id;
  try {
    await movementApi.remove(r.id);
    toast.success("삭제되었습니다.");
    await load();
  } catch (e) {
    toast.error(e?.message || "삭제에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

onMounted(async () => {
  const [items, depts] = await Promise.all([itemApi.list({ only_active: true }), departmentApi.options()]);
  itemOptions.value = items.map((it) => ({ value: it.id, label: it.name }));
  deptOptions.value = depts.map((d) => ({ value: d.id, label: `${"　".repeat(d.depth)}${d.name}` }));
  await load(1);
});
</script>

<style scoped>
.mov { max-width: 1300px; margin: 0 auto; }
.tbl td.strong { font-weight: 800; }
.tbl td.pos { color: var(--positive); }
.tbl td.neg { color: var(--danger); }
.memo { color: var(--text-muted); }
.req { color: var(--danger); margin-left: 2px; }
.ahint { font-size: 0.72rem; color: var(--text-subtle); margin-top: -0.3rem; }

.drawer { position: fixed; inset: 0; z-index: 70; background: rgba(15, 23, 42, 0.45); display: flex; justify-content: flex-end; }
.panel { width: 480px; max-width: 100%; height: 100%; overflow-y: auto; background: var(--surface); padding: 1.4rem 1.6rem; display: flex; flex-direction: column; }
.dhead { margin-bottom: 1.2rem; }
.dhead h2 { font-size: 1.1rem; font-weight: 700; color: var(--text); }
.sec { display: flex; flex-direction: column; gap: 0.7rem; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem 0.9rem; }
.fld { display: block; }
.dfoot { margin-top: auto; padding-top: 1.2rem; display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); }
</style>
