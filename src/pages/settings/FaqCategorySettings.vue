<template>
  <div>
    <div class="head">
      <h3 class="h">{{ $t("FAQ 분류") }} <span class="c">{{ rows.length }}</span></h3>
      <div class="addbar">
        <input v-model="newName" class="field !w-48" :placeholder="$t('새 분류명')" @keyup.enter="add" />
        <button class="btn btn-primary" :disabled="!newName.trim() || saving" @click="add">{{ $t("+ 추가") }}</button>
      </div>
    </div>

    <div class="tablewrap">
      <table class="tbl">
        <thead>
          <tr><th>{{ $t("분류명") }}</th><th class="c w-sort">{{ $t("정렬") }}</th><th class="c">{{ $t("상태") }}</th><th class="c w-act">{{ $t("관리") }}</th></tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length"><td colspan="4"><EmptyState icon="🏷️" :title="$t('분류가 없어요')" :desc="$t('FAQ 분류를 추가해 보세요.')" :hint="$t('위에서 분류명을 입력!')" compact /></td></tr>
          <tr v-for="c in rows" :key="c.id">
            <td>
              <template v-if="editId === c.id">
                <input v-model="editName" class="field field-xs !w-48" @keyup.enter="saveEdit(c)" @keyup.esc="editId = null" />
              </template>
              <span v-else class="nm">{{ c.name }}</span>
            </td>
            <td class="c muted num">{{ c.sort }}</td>
            <td class="c"><span class="st" :class="c.is_active ? 'on' : 'off'">{{ c.is_active ? "사용" : "중지" }}</span></td>
            <td class="c">
              <template v-if="editId === c.id">
                <button class="btn btn-xs btn-primary" @click="saveEdit(c)">{{ $t("저장") }}</button>
                <button class="btn btn-xs" @click="editId = null">{{ $t("취소") }}</button>
              </template>
              <template v-else>
                <button class="btn btn-xs" @click="startEdit(c)">{{ $t("수정") }}</button>
                <button class="btn btn-xs" @click="toggleActive(c)">{{ c.is_active ? '중지' : '사용' }}</button>
                <button class="btn btn-xs btn-danger" @click="remove(c)">{{ $t("삭제") }}</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted } from "vue";
import { useToast } from "vue-toastification";
import EmptyState from "@/components/base/EmptyState.vue";
import { confirmDelete } from "@/lib/ui";
import { faqCategoryApi } from "@/api/faq";

const toast = useToast();
const rows = ref([]);
const newName = ref("");
const saving = ref(false);
const editId = ref(null);
const editName = ref("");

async function reload() { rows.value = await faqCategoryApi.list(); }

async function add() {
  if (!newName.value.trim()) return;
  saving.value = true;
  try {
    await faqCategoryApi.save({ name: newName.value.trim(), sort: rows.value.length });
    newName.value = ""; await reload(); toast.success("분류가 추가되었습니다.");
  } catch (e) { toast.error(e?.message || "추가 실패"); }
  finally { saving.value = false; }
}
function startEdit(c) { editId.value = c.id; editName.value = c.name; }
async function saveEdit(c) {
  if (!editName.value.trim()) return;
  try {
    await faqCategoryApi.save({ id: c.id, name: editName.value.trim(), sort: c.sort, is_active: c.is_active });
    editId.value = null; await reload(); toast.success("수정되었습니다.");
  } catch (e) { toast.error(e?.message || "수정 실패"); }
}
async function toggleActive(c) {
  try { await faqCategoryApi.save({ id: c.id, name: c.name, sort: c.sort, is_active: !c.is_active }); await reload(); }
  catch (e) { toast.error(e?.message || "변경 실패"); }
}
async function remove(c) {
  if (!await confirmDelete(`'${c.name}' 분류를 삭제할까요?`)) return;
  try { await faqCategoryApi.remove(c.id); await reload(); toast.success("삭제되었습니다."); }
  catch (e) { toast.error(e?.message || "삭제 실패"); }
}
onMounted(reload);
</script>

<style scoped>
.head { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; margin-bottom: 0.8rem; flex-wrap: wrap; }
.h { font-weight: 700; color: var(--ink); }
.c { color: var(--seal); }
.addbar { display: flex; gap: 0.5rem; align-items: center; }
.tablewrap { border: 2px solid var(--line-hard); border-radius: 4px; overflow: hidden; background: var(--surface); box-shadow: var(--shadow-hard); }
.tbl { width: 100%; border-collapse: collapse; }
.tbl th { text-align: left; padding: 0.6rem 0.8rem; background: var(--surface-2); border-bottom: 2px solid var(--line-strong); font-family: var(--font-pixel); font-weight: 600; font-size: 0.74rem; color: var(--ink-muted); }
.tbl td { padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); font-size: 0.88rem; color: var(--ink); }
.tbl tbody tr:last-child td { border-bottom: none; }
.c { text-align: center; } .w-sort { width: 64px; } .w-act { width: 180px; }
.nm { font-weight: 600; } .muted { color: var(--ink-muted); }
.st { font-size: 0.72rem; font-weight: 700; padding: 0.1rem 0.5rem; border-radius: 3px; font-family: var(--font-pixel); }
.st.on { color: #047857; background: #d1fae5; }
.st.off { color: #64748b; background: #f1f5f9; }
.btn-xs + .btn-xs { margin-left: 0.3rem; }
</style>
