<template>
  <div class="ven">
    <div class="topbar">
      <input v-model="q" class="field field-xs" style="width: 200px" :placeholder="$t('상호 · 담당자 · 사업자번호')" @keyup.enter="load" />
      <button class="btn btn-xs" @click="load">{{ $t("검색") }}</button>
      <button class="btn btn-xs btn-primary" style="margin-left: auto" @click="openNew">＋ {{ $t("거래처 등록") }}</button>
    </div>

    <div class="pcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("상호") }}</th>
            <th>{{ $t("사업자번호") }}</th>
            <th>{{ $t("담당자") }}</th>
            <th>{{ $t("연락처") }}</th>
            <th>{{ $t("상태") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="6"><EmptyState icon="fa-truck-field" :title="$t('거래처가 없습니다')" :desc="$t('거래처 등록 버튼으로 추가하세요.')" compact /></td>
          </tr>
          <tr v-for="r in rows" :key="r.id" class="rowclick" @click="openEdit(r)">
            <td class="strong">{{ r.name }}</td>
            <td class="num">{{ r.business_no || "-" }}</td>
            <td>{{ r.contact || "-" }}</td>
            <td class="num">{{ r.phone || "-" }}</td>
            <td>
              <span class="badge" :class="r.is_active ? 'badge-success' : 'badge-neutral'">{{ r.is_active ? $t("사용") : $t("중지") }}</span>
            </td>
            <td class="acts" @click.stop>
              <button class="btn btn-xs" @click="openEdit(r)">{{ $t("수정") }}</button>
              <button class="btn btn-xs btn-ghost" @click="remove(r)">{{ $t("삭제") }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 등록/수정 드로어 -->
    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel small">
        <header class="dhead"><h2>{{ form.id ? $t("거래처 수정") : $t("거래처 등록") }}</h2></header>
        <section class="sec">
          <label class="fld"><span class="form-label">{{ $t("상호") }}<span class="req">*</span></span>
            <input v-model="form.name" class="field" :placeholder="$t('상호')" />
          </label>
          <div class="grid2">
            <label class="fld"><span class="form-label">{{ $t("사업자번호") }}</span>
              <input v-model="form.business_no" class="field" placeholder="000-00-00000" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("담당자") }}</span>
              <input v-model="form.contact" class="field" :placeholder="$t('담당자')" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("연락처") }}</span>
              <input v-model="form.phone" class="field" placeholder="02-0000-0000" />
            </label>
            <label class="fld"><span class="form-label">{{ $t("이메일") }}</span>
              <input v-model="form.email" class="field" placeholder="name@company.com" />
            </label>
          </div>
          <label class="fld"><span class="form-label">{{ $t("메모") }}</span>
            <textarea v-model="form.memo" class="field" rows="2" :placeholder="$t('메모(선택)')"></textarea>
          </label>
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
import { vendorApi } from "@/api/purchase";
import { useToast } from "vue-toastification";

const toast = useToast();
const rows = ref([]);
const q = ref("");
const saving = ref(false);
const showForm = ref(false);

const form = reactive({ id: null, name: "", business_no: "", contact: "", phone: "", email: "", memo: "", is_active: true });

async function load() {
  rows.value = await vendorApi.list({ q: q.value || undefined });
}

function openNew() {
  Object.assign(form, { id: null, name: "", business_no: "", contact: "", phone: "", email: "", memo: "", is_active: true });
  showForm.value = true;
}
function openEdit(r) {
  Object.assign(form, {
    id: r.id, name: r.name, business_no: r.business_no || "", contact: r.contact || "",
    phone: r.phone || "", email: r.email || "", memo: r.memo || "", is_active: r.is_active,
  });
  showForm.value = true;
}

async function save() {
  if (!form.name.trim()) { toast.warning("상호를 입력하세요."); return; }
  saving.value = true;
  try {
    await vendorApi.save({
      id: form.id || undefined,
      name: form.name.trim(),
      business_no: form.business_no || undefined,
      contact: form.contact || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      memo: form.memo || undefined,
      is_active: form.is_active,
    });
    toast.success("저장되었습니다.");
    showForm.value = false;
    await load();
  } catch (e) {
    toast.error(e?.message || "저장에 실패했습니다.");
  } finally {
    saving.value = false;
  }
}

async function remove(r) {
  if (!confirm(`'${r.name}' 거래처를 삭제하시겠습니까?`)) return;
  try {
    await vendorApi.remove(r.id);
    toast.success("삭제되었습니다.");
    await load();
  } catch (e) {
    toast.error(e?.message || "삭제에 실패했습니다.");
  }
}

onMounted(load);
</script>

<style scoped>
.ven { margin: 0; }
.topbar { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
.tbl td.strong { font-weight: 700; color: var(--text); }
.rowclick { cursor: pointer; }
.rowclick:hover td { background: var(--surface-2); }
.acts { display: flex; gap: 0.3rem; white-space: nowrap; }
.req { color: var(--danger); margin-left: 2px; }

.drawer { position: fixed; inset: 0; z-index: 70; background: rgba(15, 23, 42, 0.45); display: flex; justify-content: flex-end; }
.panel { width: 520px; max-width: 100%; height: 100%; overflow-y: auto; background: var(--surface); padding: 1.4rem 1.6rem; display: flex; flex-direction: column; }
.panel.small { width: 460px; }
.dhead { margin-bottom: 1.2rem; }
.dhead h2 { font-size: 1.1rem; font-weight: 700; color: var(--text); }
.sec { display: flex; flex-direction: column; gap: 0.7rem; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem 0.9rem; }
.fld { display: block; }
.chk { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; color: var(--text-muted); }
.dfoot { margin-top: auto; padding-top: 1.2rem; display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); }
</style>
