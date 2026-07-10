<template>
  <div>
    <div class="head">
      <h3 class="h">{{ $t("태그") }} <span class="c">{{ rows.length }}</span></h3>
      <div class="addbar">
        <span class="swatch" :style="{ background: newColor }" @click="cycleColor" :title="$t('색상 변경')"></span>
        <input v-model="newName" class="field !w-44" :placeholder="$t('새 태그명')" @keyup.enter="add" />
        <button class="btn btn-primary" :disabled="!newName.trim() || saving" @click="add">{{ $t("+ 추가") }}</button>
      </div>
    </div>

    <div class="tablewrap">
      <table class="tbl">
        <thead>
          <tr><th class="c w-sw">{{ $t("색") }}</th><th>{{ $t("태그명") }}</th><th class="c w-sort">{{ $t("정렬") }}</th><th class="c">{{ $t("상태") }}</th><th class="c w-act">{{ $t("관리") }}</th></tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length"><td colspan="5"><EmptyState icon="🏷️" :title="$t('태그가 없어요')" :desc="$t('CS 응대·FAQ에 붙일 태그를 추가해 보세요.')" :hint="$t('위에서 태그명 입력!')" compact /></td></tr>
          <tr v-for="t in rows" :key="t.id">
            <td class="c"><span class="swatch sm" :style="{ background: t.color }" @click="cycleRowColor(t)" :title="$t('색상 변경')"></span></td>
            <td>
              <template v-if="editId === t.id">
                <input v-model="editName" class="field field-xs !w-44" @keyup.enter="saveEdit(t)" @keyup.esc="editId = null" />
              </template>
              <span v-else class="tchip" :style="{ background: t.color }">{{ t.name }}</span>
            </td>
            <td class="c muted num">{{ t.sort }}</td>
            <td class="c"><span class="st" :class="t.is_active ? 'on' : 'off'">{{ t.is_active ? "사용" : "중지" }}</span></td>
            <td class="c">
              <template v-if="editId === t.id">
                <button class="btn btn-xs btn-primary" @click="saveEdit(t)">{{ $t("저장") }}</button>
                <button class="btn btn-xs" @click="editId = null">{{ $t("취소") }}</button>
              </template>
              <template v-else>
                <button class="btn btn-xs" @click="startEdit(t)">{{ $t("수정") }}</button>
                <button class="btn btn-xs" @click="toggleActive(t)">{{ t.is_active ? '중지' : '사용' }}</button>
                <button class="btn btn-xs btn-danger" @click="remove(t)">{{ $t("삭제") }}</button>
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
import { tagApi } from "@/api/settings";

const PALETTE = ["#7a5cff", "#0ea88f", "#e07d16", "#e23b46", "#2f6df6", "#d6871e", "#c026d3", "#0891b2"];
const toast = useToast();
const rows = ref([]);
const newName = ref("");
const newColor = ref(PALETTE[0]);
const saving = ref(false);
const editId = ref(null);
const editName = ref("");

function nextColor(c) { return PALETTE[(PALETTE.indexOf(c) + 1) % PALETTE.length]; }
function cycleColor() { newColor.value = nextColor(newColor.value); }
async function cycleRowColor(t) {
  try { await tagApi.save({ id: t.id, name: t.name, color: nextColor(t.color), sort: t.sort, is_active: t.is_active }); await reload(); }
  catch (e) { toast.error(e?.message || "변경 실패"); }
}

async function reload() { rows.value = await tagApi.list(); }
async function add() {
  if (!newName.value.trim()) return;
  saving.value = true;
  try {
    await tagApi.save({ name: newName.value.trim(), color: newColor.value, sort: rows.value.length });
    newName.value = ""; newColor.value = nextColor(newColor.value); await reload(); toast.success("태그가 추가되었습니다.");
  } catch (e) { toast.error(e?.message || "추가 실패"); }
  finally { saving.value = false; }
}
function startEdit(t) { editId.value = t.id; editName.value = t.name; }
async function saveEdit(t) {
  if (!editName.value.trim()) return;
  try { await tagApi.save({ id: t.id, name: editName.value.trim(), color: t.color, sort: t.sort, is_active: t.is_active }); editId.value = null; await reload(); toast.success("수정되었습니다."); }
  catch (e) { toast.error(e?.message || "수정 실패"); }
}
async function toggleActive(t) {
  try { await tagApi.save({ id: t.id, name: t.name, color: t.color, sort: t.sort, is_active: !t.is_active }); await reload(); }
  catch (e) { toast.error(e?.message || "변경 실패"); }
}
async function remove(t) {
  if (!await confirmDelete(`'${t.name}' 태그를 삭제할까요? (응대·FAQ에서도 해제됩니다)`)) return;
  try { await tagApi.remove(t.id); await reload(); toast.success("삭제되었습니다."); }
  catch (e) { toast.error(e?.message || "삭제 실패"); }
}
onMounted(reload);
</script>

<style scoped>
.head { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; margin-bottom: 0.8rem; flex-wrap: wrap; }
.h { font-weight: 700; color: var(--ink); }
.c { color: var(--seal); }
.addbar { display: flex; gap: 0.5rem; align-items: center; }
.swatch { width: 26px; height: 26px; flex-shrink: 0; border: 2px solid var(--line-hard); border-radius: 3px; box-shadow: 2px 2px 0 var(--line-hard); cursor: pointer; }
.swatch.sm { display: inline-block; width: 52px; height: 24px; box-shadow: 2px 2px 0 var(--line-hard); }
.tablewrap { border: 2px solid var(--line-hard); border-radius: 4px; overflow: hidden; background: var(--surface); box-shadow: var(--shadow-hard); }
.tbl { width: 100%; border-collapse: collapse; }
.tbl th { text-align: left; padding: 0.6rem 0.8rem; background: var(--surface-2); border-bottom: 2px solid var(--line-strong); font-family: var(--font-pixel); font-weight: 600; font-size: 0.74rem; color: var(--ink-muted); }
.tbl td { padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); font-size: 0.88rem; color: var(--ink); }
.tbl tbody tr:last-child td { border-bottom: none; }
.c { text-align: center; } .w-sw { width: 84px; } .w-sort { width: 64px; } .w-act { width: 180px; }
.muted { color: var(--ink-muted); }
.tchip { font-family: var(--font-pixel); font-size: 0.66rem; color: #fff; border: 1px solid var(--line-hard); border-radius: 3px; padding: 0.1rem 0.45rem; }
.st { font-size: 0.72rem; font-weight: 700; padding: 0.1rem 0.5rem; border-radius: 3px; font-family: var(--font-pixel); }
.st.on { color: #047857; background: #d1fae5; }
.st.off { color: #64748b; background: #f1f5f9; }
.btn-xs + .btn-xs { margin-left: 0.3rem; }
</style>
