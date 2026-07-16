<template>
  <div class="inv">
    <div class="topbar">
      <input v-model="q" class="field field-xs" style="width: 200px" :placeholder="$t('품목명 · 분류')" @keyup.enter="load" />
      <label class="chk"><input type="checkbox" v-model="lowOnly" @change="load" /> {{ $t("안전재고 미달만") }}</label>
      <button class="btn btn-xs" @click="load">{{ $t("검색") }}</button>
      <button class="btn btn-xs btn-primary" style="margin-left: auto" @click="openNew">＋ {{ $t("품목 등록") }}</button>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("품목명") }}</th>
            <th>{{ $t("분류") }}</th>
            <th>{{ $t("단위") }}</th>
            <th class="right">{{ $t("현재고") }}</th>
            <th class="right">{{ $t("안전재고") }}</th>
            <th>{{ $t("상태") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="7"><EmptyState icon="fa-boxes-stacked" :title="$t('품목이 없습니다')" :desc="$t('품목 등록 버튼으로 추가하세요.')" compact /></td>
          </tr>
          <tr v-for="r in rows" :key="r.id" class="rowclick" @click="openEdit(r)">
            <td class="strong">{{ r.name }}</td>
            <td>{{ r.category || "-" }}</td>
            <td>{{ r.unit || "-" }}</td>
            <td class="num right strong" :class="{ low: r.low }">{{ fmt(r.stock) }}</td>
            <td class="num right">{{ fmt(r.safety_stock) }}</td>
            <td>
              <span class="badge" :class="r.low ? 'badge-error' : 'badge-success'">{{ r.low ? $t("미달") : $t("정상") }}</span>
            </td>
            <td class="acts" @click.stop>
              <button class="btn btn-xs" @click="openEdit(r)">{{ $t("수정") }}</button>
              <button class="btn btn-xs btn-ghost" @click="remove(r)">{{ $t("삭제") }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel small">
        <header class="dhead"><h2>{{ form.id ? $t("품목 수정") : $t("품목 등록") }}</h2></header>
        <section class="sec">
          <label class="fld"><span class="form-label">{{ $t("품목명") }}<span class="req">*</span></span>
            <input v-model="form.name" class="field" :placeholder="$t('품목명')" />
          </label>
          <div class="grid2">
            <label class="fld"><span class="form-label">{{ $t("분류") }}</span>
              <input v-model="form.category" class="field" :placeholder="$t('소모품 등')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("단위") }}</span>
              <input v-model="form.unit" class="field" :placeholder="$t('개/박스')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("안전재고") }}</span>
              <input v-model.number="form.safety_stock" type="number" min="0" class="field" placeholder="0" />
            </label>
          </div>
          <label class="chk"><input type="checkbox" v-model="form.is_active" /> {{ $t("사용") }}</label>
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
import { ref, reactive, onMounted } from "vue";
import EmptyState from "@/components/base/EmptyState.vue";
import { itemApi } from "@/api/inventory";
import { useToast } from "vue-toastification";

const toast = useToast();
const rows = ref([]);
const q = ref("");
const lowOnly = ref(false);
const saving = ref(false);
const showForm = ref(false);

const fmt = (v) => Number(v || 0).toLocaleString();
const form = reactive({ id: null, name: "", category: "", unit: "", safety_stock: 0, is_active: true });

async function load() {
  rows.value = await itemApi.list({ q: q.value || undefined, only_active: false, low_only: lowOnly.value || undefined });
}
function openNew() {
  Object.assign(form, { id: null, name: "", category: "", unit: "", safety_stock: 0, is_active: true });
  showForm.value = true;
}
function openEdit(r) {
  Object.assign(form, { id: r.id, name: r.name, category: r.category || "", unit: r.unit || "", safety_stock: Number(r.safety_stock), is_active: r.is_active });
  showForm.value = true;
}
async function save() {
  if (!form.name.trim()) { toast.warning("품목명을 입력하세요."); return; }
  saving.value = true;
  try {
    await itemApi.save({
      id: form.id || undefined, name: form.name.trim(),
      category: form.category || undefined, unit: form.unit || undefined,
      safety_stock: Number(form.safety_stock) || 0, is_active: form.is_active,
    });
    toast.success("저장되었습니다.");
    showForm.value = false;
    await load();
  } catch (e) { toast.error(e?.message || "저장에 실패했습니다."); }
  finally { saving.value = false; }
}
async function remove(r) {
  if (!confirm(`'${r.name}' 품목을 삭제하시겠습니까?`)) return;
  try {
    await itemApi.remove(r.id);
    toast.success("삭제되었습니다.");
    await load();
  } catch (e) { toast.error(e?.message || "삭제에 실패했습니다."); }
}

onMounted(load);
</script>

<style scoped>
.inv { max-width: 1100px; margin: 0 auto; }
.topbar { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1rem; }
.chk { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: var(--text-muted); }
.tbl td.strong { font-weight: 700; color: var(--text); }
.tbl td.low { color: var(--danger); }
.rowclick { cursor: pointer; }
.rowclick:hover td { background: var(--surface-2); }
.acts { display: flex; gap: 0.3rem; white-space: nowrap; }
.req { color: var(--danger); margin-left: 2px; }

.drawer { position: fixed; inset: 0; z-index: 70; background: rgba(15, 23, 42, 0.45); display: flex; justify-content: flex-end; }
.panel { width: 480px; max-width: 100%; height: 100%; overflow-y: auto; background: var(--surface); padding: 1.4rem 1.6rem; display: flex; flex-direction: column; }
.dhead { margin-bottom: 1.2rem; }
.dhead h2 { font-size: 1.1rem; font-weight: 700; color: var(--text); }
.sec { display: flex; flex-direction: column; gap: 0.7rem; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem 0.9rem; }
.fld { display: block; }
.dfoot { margin-top: auto; padding-top: 1.2rem; display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); }
</style>
