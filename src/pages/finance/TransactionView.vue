<template>
  <div class="fin">
    <!-- 집계 카드 -->
    <div class="cards">
      <div class="scard income">
        <span class="lbl">{{ $t("수입 합계") }}</span>
        <b class="val num">{{ won(summary.income_total) }}</b>
      </div>
      <div class="scard expense">
        <span class="lbl">{{ $t("지출 합계") }}</span>
        <b class="val num">{{ won(summary.expense_total) }}</b>
      </div>
      <div class="scard net" :class="{ minus: summary.net < 0 }">
        <span class="lbl">{{ $t("순액") }}</span>
        <b class="val num">{{ won(summary.net) }}</b>
      </div>
    </div>

    <div class="filterbar">
      <span class="f-label">{{ $t("기간") }}</span>
      <DateRangePicker v-model="range" mode="date" size="xs" @change="onRangeChange" />
      <span class="f-label">{{ $t("구분") }}</span>
      <SearchSelect v-model="filter.type" size="xs" :options="typeFilterOptions" :placeholder="$t('전체')" @change="load(1)" />
      <span class="f-label">{{ $t("계정과목") }}</span>
      <SearchSelect v-model="filter.account_item_id" size="xs" :options="filterAccountOptions" :placeholder="$t('전체')" @change="load(1)" />
      <span class="f-label">{{ $t("부서") }}</span>
      <SearchSelect v-model="filter.department_id" size="xs" :options="deptOptions" :placeholder="$t('전체')" @change="load(1)" />
      <input v-model="filter.q" class="field field-xs" style="width: 150px" :placeholder="$t('거래처 · 메모')" @keyup.enter="load(1)" />
      <button class="btn btn-xs" @click="load(1)">{{ $t("검색") }}</button>
      <button class="btn btn-xs btn-primary" style="margin-left: auto" @click="openNew">＋ {{ $t("거래 등록") }}</button>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("일자") }}</th>
            <th>{{ $t("구분") }}</th>
            <th>{{ $t("계정과목") }}</th>
            <th>{{ $t("부서") }}</th>
            <th>{{ $t("거래처") }}</th>
            <th>{{ $t("결제") }}</th>
            <th class="right">{{ $t("금액") }}</th>
            <th>{{ $t("메모") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="9">
              <EmptyState icon="fa-coins" :title="$t('거래 내역이 없습니다')" :desc="$t('거래 등록 버튼으로 수입·지출을 기록하세요.')" compact />
            </td>
          </tr>
          <tr v-for="r in rows" :key="r.id">
            <td class="num">{{ ymd(r.txn_date) }}</td>
            <td>
              <span class="badge" :class="r.type === 'INCOME' ? 'badge-success' : 'badge-error'">
                {{ r.type === "INCOME" ? $t("수입") : $t("지출") }}
              </span>
            </td>
            <td>{{ r.account_item?.name }}</td>
            <td>{{ r.department?.name || "-" }}</td>
            <td>{{ r.vendor || "-" }}</td>
            <td>{{ methodLabel(r.method) }}</td>
            <td class="num right" :class="r.type === 'INCOME' ? 'pos' : 'neg'">
              {{ r.type === "EXPENSE" ? "-" : "" }}{{ won(r.amount) }}
            </td>
            <td class="memo">
              <i v-if="r.attachments && r.attachments.length" class="fa-solid fa-paperclip clip" :title="`${r.attachments.length}`"></i>
              {{ r.memo || "" }}
            </td>
            <td class="acts">
              <button class="btn btn-xs" @click="openEdit(r)">{{ $t("수정") }}</button>
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
        <header class="dhead">
          <h2>{{ form.id ? $t("거래 수정") : $t("거래 등록") }}</h2>
        </header>

        <section class="sec">
          <div class="grid2">
            <label class="fld"><span class="form-label">{{ $t("일자") }}<span class="req">*</span></span>
              <DatePicker v-model="form.txn_date" mode="date" :placeholder="$t('거래 일자')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("구분") }}<span class="req">*</span></span>
              <SearchSelect v-model="form.type" :options="typeOptions" :clearable="false" :placeholder="$t('구분')" @change="onTypeChange" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("계정과목") }}<span class="req">*</span></span>
              <SearchSelect v-model="form.account_item_id" :options="formAccountOptions" :placeholder="$t('계정과목 선택')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("금액") }}<span class="req">*</span></span>
              <input v-model="form.amount" type="number" min="0" step="1" class="field" :placeholder="$t('금액(원)')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("부서") }}</span>
              <SearchSelect v-model="form.department_id" :options="deptOptions" :placeholder="$t('선택 안 함')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("결제수단") }}</span>
              <SearchSelect v-model="form.method" :options="methodOptions" :clearable="false" :placeholder="$t('결제수단')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("거래처") }}</span>
              <input v-model="form.vendor" class="field" :placeholder="$t('거래처(선택)')" />
            </label>
          </div>
        </section>

        <section class="sec">
          <label class="fld"><span class="form-label">{{ $t("메모") }}</span>
            <textarea v-model="form.memo" class="field" rows="2" :placeholder="$t('메모(선택)')"></textarea>
          </label>
          <label class="fld" style="margin-top: 0.7rem;">
            <span class="form-label">{{ $t("영수증/증빙") }}</span>
            <div class="uprow">
              <label class="btn btn-xs">
                <i class="fa-solid fa-paperclip"></i> {{ $t("파일 첨부") }}
                <input type="file" multiple hidden @change="onFiles" />
              </label>
              <span v-if="uploading" class="upmsg">{{ $t("업로드 중…") }}</span>
            </div>
            <div v-if="form.attachments.length" class="ulist">
              <div v-for="(a, i) in form.attachments" :key="i" class="uitem">
                <i class="fa-solid" :class="a.is_image ? 'fa-image' : 'fa-file'"></i>
                <span class="unm">{{ a.filename }}</span>
                <button type="button" class="urm" @click="form.attachments.splice(i, 1)"><i class="fa-solid fa-xmark"></i></button>
              </div>
            </div>
          </label>
        </section>

        <footer class="dfoot">
          <span style="flex: 1"></span>
          <button class="btn btn-xs" @click="showForm = false">{{ $t("닫기") }}</button>
          <button class="btn btn-xs btn-primary" :disabled="saving" @click="save">
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
import DatePicker from "@/components/base/DatePicker.vue";
import DateRangePicker from "@/components/base/DateRangePicker.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import Pager from "@/components/base/Pager.vue";
import { accountApi, txnApi } from "@/api/finance";
import { departmentApi } from "@/api/hr";
import { formatDateOnly } from "@/utils/date";
import { useToast } from "vue-toastification";
import { useI18nStore } from "@/stores/i18n";

const toast = useToast();
const i18n = useI18nStore();

const METHODS = { CASH: "현금", TRANSFER: "계좌이체", CARD: "카드", OTHER: "기타" };
const methodLabel = (m) => i18n.t(METHODS[m] || m);
const methodOptions = computed(() => Object.entries(METHODS).map(([value, label]) => ({ value, label: i18n.t(label) })));

const typeOptions = computed(() => [
  { value: "INCOME", label: i18n.t("수입") },
  { value: "EXPENSE", label: i18n.t("지출") },
]);
const typeFilterOptions = computed(() => [{ value: null, label: i18n.t("전체") }, ...typeOptions.value]);

/** 금액 → "1,234,000원" */
const won = (v) => `${Number(v || 0).toLocaleString()}${i18n.t("원")}`;
/** ISO → "2026-07-15" */
const ymd = (v) => (v ? String(v).slice(0, 10) : "-");

const rows = ref([]);
const total = ref(0);
const totalPages = ref(0);
const page = ref(1);
const limit = ref(30);
const busy = ref(null);
const saving = ref(false);
const uploading = ref(false);
const showForm = ref(false);
const deptOptions = ref([]);
const accounts = ref([]);
const summary = reactive({ income_total: 0, expense_total: 0, net: 0 });

const _now = new Date();
const monthStart = new Date(_now.getFullYear(), _now.getMonth(), 1);
const monthEnd = new Date(_now.getFullYear(), _now.getMonth() + 1, 0);

const filter = reactive({
  date_from: formatDateOnly(monthStart),
  date_to: formatDateOnly(monthEnd),
  type: null,
  account_item_id: null,
  department_id: null,
  q: "",
});
const range = ref({ start: monthStart, end: monthEnd });

// 필터바 계정과목: 선택된 구분에 맞춰(없으면 전체)
const filterAccountOptions = computed(() =>
  accounts.value
    .filter((a) => !filter.type || a.type === filter.type)
    .map((a) => ({ value: a.id, label: a.name })),
);
// 폼 계정과목: 폼 구분에 맞춰
const formAccountOptions = computed(() =>
  accounts.value.filter((a) => a.type === form.type).map((a) => ({ value: a.id, label: a.name })),
);

const form = reactive({
  id: null,
  txn_date: "",
  type: "EXPENSE",
  account_item_id: null,
  amount: "",
  department_id: null,
  vendor: "",
  method: "CASH",
  memo: "",
  attachments: [],
});

function onRangeChange() {
  filter.date_from = range.value?.start ? formatDateOnly(range.value.start) : filter.date_from;
  filter.date_to = range.value?.end ? formatDateOnly(range.value.end) : filter.date_to;
  load(1);
}
// 구분을 바꾸면 계정과목이 어긋날 수 있으니 초기화
function onTypeChange() {
  if (!accounts.value.some((a) => a.id === form.account_item_id && a.type === form.type)) {
    form.account_item_id = null;
  }
}

async function load(p = page.value) {
  page.value = p;
  const body = {
    date_from: filter.date_from,
    date_to: filter.date_to,
    type: filter.type || undefined,
    account_item_id: filter.account_item_id || undefined,
    department_id: filter.department_id || undefined,
    q: filter.q || undefined,
  };
  const [res, sum] = await Promise.all([
    txnApi.list({ ...body, page: p, limit: limit.value }),
    txnApi.summary(body),
  ]);
  rows.value = res.rows || [];
  total.value = res.total || 0;
  totalPages.value = res.totalPages || 0;
  Object.assign(summary, { income_total: sum.income_total, expense_total: sum.expense_total, net: sum.net });
}

function openNew() {
  Object.assign(form, {
    id: null,
    txn_date: formatDateOnly(new Date()),
    type: "EXPENSE",
    account_item_id: null,
    amount: "",
    department_id: null,
    vendor: "",
    method: "CASH",
    memo: "",
    attachments: [],
  });
  showForm.value = true;
}

function openEdit(r) {
  Object.assign(form, {
    id: r.id,
    txn_date: ymd(r.txn_date),
    type: r.type,
    account_item_id: r.account_item_id,
    amount: r.amount,
    department_id: r.department_id,
    vendor: r.vendor || "",
    method: r.method,
    memo: r.memo || "",
    attachments: (r.attachments || []).map((a) => ({ ...a })),
  });
  showForm.value = true;
}

async function onFiles(e) {
  const files = [...e.target.files];
  if (!files.length) return;
  uploading.value = true;
  try {
    const saved = await txnApi.upload(files);
    form.attachments.push(...saved);
  } catch (err) {
    toast.error(err?.message || "업로드 실패");
  } finally {
    uploading.value = false;
    e.target.value = "";
  }
}

async function save() {
  if (!form.txn_date || !form.type || !form.account_item_id || !form.amount) {
    toast.warning("일자·구분·계정과목·금액은 필수입니다.");
    return;
  }
  saving.value = true;
  try {
    await txnApi.save({
      id: form.id || undefined,
      txn_date: form.txn_date,
      type: form.type,
      account_item_id: form.account_item_id,
      amount: Number(form.amount),
      department_id: form.department_id || undefined,
      vendor: form.vendor || undefined,
      method: form.method,
      memo: form.memo || undefined,
      attachments: form.attachments.map((a) => ({
        path: a.path,
        filename: a.filename,
        mime_type: a.mime_type,
        size: a.size,
        is_image: a.is_image,
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

async function remove(r) {
  if (!confirm("이 거래를 삭제하시겠습니까?")) return;
  busy.value = r.id;
  try {
    await txnApi.remove(r.id);
    toast.success("삭제되었습니다.");
    await load();
  } catch (e) {
    toast.error(e?.message || "삭제에 실패했습니다.");
  } finally {
    busy.value = null;
  }
}

onMounted(async () => {
  const [depts, accs] = await Promise.all([departmentApi.options(), accountApi.list({ only_active: true })]);
  deptOptions.value = depts.map((d) => ({ value: d.id, label: `${"　".repeat(d.depth)}${d.name}` }));
  accounts.value = accs;
  await load(1);
});
</script>

<style scoped>
.fin { margin: 0; }

.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8rem; margin-bottom: 1rem; }
.scard { display: flex; flex-direction: column; gap: 0.35rem; padding: 0.9rem 1.1rem; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); box-shadow: var(--shadow-sm); }
.scard .lbl { font-size: 0.72rem; font-weight: 600; color: var(--text-subtle); }
.scard .val { font-size: 1.35rem; font-weight: 800; letter-spacing: -0.01em; }
.scard.income { border-left: 3px solid var(--positive); }
.scard.income .val { color: var(--positive); }
.scard.expense { border-left: 3px solid var(--danger); }
.scard.expense .val { color: var(--danger); }
.scard.net { border-left: 3px solid var(--accent); }
.scard.net .val { color: var(--accent); }
.scard.net.minus .val { color: var(--danger); }

.tbl td.pos { color: var(--positive); font-weight: 700; }
.tbl td.neg { color: var(--danger); font-weight: 700; }
.memo { color: var(--text-muted); }
.memo .clip { color: var(--text-subtle); margin-right: 0.25rem; }
.acts { display: flex; gap: 0.3rem; white-space: nowrap; }
.req { color: var(--danger); margin-left: 2px; }

.drawer { position: fixed; inset: 0; z-index: 70; background: rgba(15, 23, 42, 0.45); display: flex; justify-content: flex-end; }
.panel { width: 540px; max-width: 100%; height: 100%; overflow-y: auto; background: var(--surface); padding: 1.4rem 1.6rem; display: flex; flex-direction: column; }
.dhead { display: flex; align-items: center; gap: 0.7rem; margin-bottom: 1.2rem; }
.dhead h2 { font-size: 1.1rem; font-weight: 700; color: var(--text); }
.sec { margin-bottom: 1.4rem; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem 0.9rem; }
.fld { display: block; }
.uprow { display: flex; align-items: center; gap: 0.6rem; }
.uprow .btn { cursor: pointer; }
.upmsg { font-size: 0.72rem; color: var(--text-subtle); }
.ulist { display: flex; flex-direction: column; gap: 0.3rem; margin-top: 0.5rem; }
.uitem { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--text-muted); padding: 0.3rem 0.5rem; border: 1px solid var(--border); border-radius: 6px; }
.uitem .unm { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.uitem .urm { color: var(--text-subtle); }
.uitem .urm:hover { color: var(--danger); }
.dfoot { margin-top: auto; padding-top: 1.2rem; display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); }
</style>
