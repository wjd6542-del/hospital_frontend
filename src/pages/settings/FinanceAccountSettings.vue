<template>
  <div class="facc">
    <table class="tbl">
      <thead>
        <tr>
          <th style="width: 90px">{{ $t("구분") }}</th>
          <th>{{ $t("계정과목명") }}</th>
          <th style="width: 90px">{{ $t("정렬") }}</th>
          <th style="width: 80px">{{ $t("활성") }}</th>
          <th style="width: 80px"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!rows.length">
          <td colspan="5">
            <EmptyState icon="fa-coins" :title="$t('계정과목이 없습니다')" :desc="$t('아래에서 추가하세요.')" compact />
          </td>
        </tr>
        <tr v-for="r in rows" :key="r.id">
          <td>
            <span class="badge" :class="r.type === 'INCOME' ? 'badge-success' : 'badge-error'">
              {{ r.type === "INCOME" ? $t("수입") : $t("지출") }}
            </span>
          </td>
          <td><input v-model="r.name" class="cell-input" @change="update(r)" /></td>
          <td><input v-model.number="r.sort" type="number" class="cell-input" @change="update(r)" /></td>
          <td><BaseToggle v-model="r.is_active" size="sm" @update:modelValue="update(r)" /></td>
          <td><button class="btn btn-xs btn-ghost" @click="remove(r)">{{ $t("삭제") }}</button></td>
        </tr>
      </tbody>
    </table>

    <div class="addrow">
      <div class="tsel"><SearchSelect v-model="draft.type" size="xs" :options="typeOptions" :clearable="false" /></div>
      <input v-model="draft.name" class="field field-xs" style="width: 200px" :placeholder="$t('계정과목명')" @keyup.enter="add" />
      <button class="btn btn-xs btn-primary" @click="add">＋ {{ $t("추가") }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted } from "vue";
import BaseToggle from "@/components/base/BaseToggle.vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import { accountApi } from "@/api/finance";
import { useToast } from "vue-toastification";
import { useI18nStore } from "@/stores/i18n";

const toast = useToast();
const i18n = useI18nStore();
const rows = ref([]);
const draft = reactive({ type: "EXPENSE", name: "" });

const typeOptions = computed(() => [
  { value: "INCOME", label: i18n.t("수입") },
  { value: "EXPENSE", label: i18n.t("지출") },
]);

async function load() {
  rows.value = await accountApi.list({});
}

async function update(r) {
  try {
    await accountApi.save({ id: r.id, type: r.type, name: r.name, sort: r.sort ?? 0, is_active: r.is_active });
  } catch (e) {
    toast.error(e?.message || "수정에 실패했습니다.");
    await load();
  }
}

async function add() {
  if (!draft.name.trim()) {
    toast.warning("계정과목명을 입력하세요.");
    return;
  }
  try {
    await accountApi.save({ type: draft.type, name: draft.name.trim(), sort: rows.value.length });
    draft.name = "";
    await load();
  } catch (e) {
    toast.error(e?.message || "추가에 실패했습니다.");
  }
}

async function remove(r) {
  try {
    await accountApi.remove(r.id);
    await load();
  } catch (e) {
    toast.error(e?.message || "삭제에 실패했습니다.");
  }
}

onMounted(load);
</script>

<style scoped>
.facc { min-width: 0; }
.desc { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; }
.tbl { width: 100%; }
.addrow { display: flex; gap: 0.4rem; margin-top: 0.9rem; align-items: center; }
.addrow .tsel { width: 110px; flex: 0 0 auto; }
.addrow .field { flex: 0 0 auto; }
.addrow .btn { flex: 0 0 auto; white-space: nowrap; }
</style>
