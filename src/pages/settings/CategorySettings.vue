<template>
  <div class="cat">
    <div class="split">
      <aside class="groups">
        <button
          v-for="g in GROUPS"
          :key="g.key"
          class="gitem"
          :class="{ on: active === g.key }"
          @click="select(g.key)"
        >
          {{ $t(g.label) }}
        </button>
      </aside>

      <section class="listpane">
        <div class="addrow">
          <input v-model="draft.text" class="field field-xs" :placeholder="$t('표시명')" />
          <input v-model="draft.value" class="field field-xs" :placeholder="$t('코드값 (영문 대문자)')" />
          <button class="btn btn-xs btn-primary" @click="add">＋ {{ $t("추가") }}</button>
        </div>

        <table class="tbl">
          <thead>
            <tr>
              <th>{{ $t("표시명") }}</th>
              <th>{{ $t("코드값") }}</th>
              <th>{{ $t("활성") }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!rows.length">
              <td colspan="4"><EmptyState :title="$t('코드가 없습니다')" :desc="$t('위에서 코드를 추가하세요.')" compact /></td>
            </tr>
            <tr v-for="c in rows" :key="c.id">
              <td><input v-model="c.text" class="cell-input" @change="update(c)" /></td>
              <td class="num">{{ c.value }}</td>
              <td><BaseToggle v-model="c.is_active" size="sm" @update:modelValue="update(c)" /></td>
              <td><button class="btn btn-xs btn-ghost" @click="remove(c)">{{ $t("삭제") }}</button></td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from "vue";
import BaseToggle from "@/components/base/BaseToggle.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import { categoryApi } from "@/api/hr";
import { useToast } from "vue-toastification";

const GROUPS = [
  { key: "department_type", label: "부서 유형" },
  { key: "position", label: "직급" },
  { key: "job_type", label: "직종" },
  { key: "employment_type", label: "고용형태" },
  { key: "license_type", label: "면허 종류" },
];

const toast = useToast();

const active = ref(GROUPS[0].key);
const rows = ref([]);
const draft = reactive({ text: "", value: "" });

async function load() {
  rows.value = await categoryApi.list({ group: active.value });
}

function select(key) {
  active.value = key;
  draft.text = "";
  draft.value = "";
  load();
}

async function add() {
  if (!draft.text.trim() || !draft.value.trim()) {
    toast.warning("표시명과 코드값을 모두 입력하세요.");
    return;
  }
  try {
    await categoryApi.save({
      group: active.value,
      text: draft.text.trim(),
      value: draft.value.trim().toUpperCase(),
      sort: rows.value.length,
    });
    draft.text = "";
    draft.value = "";
    await load();
  } catch (e) {
    toast.error(e?.message || "추가에 실패했습니다.");
  }
}

async function update(c) {
  try {
    await categoryApi.save({ id: c.id, group: c.group, text: c.text, value: c.value, sort: c.sort, is_active: c.is_active });
  } catch (e) {
    toast.error(e?.message || "수정에 실패했습니다.");
    await load();
  }
}

async function remove(c) {
  try {
    await categoryApi.remove(c.id);
    await load();
  } catch (e) {
    toast.error(e?.message || "삭제에 실패했습니다.");
  }
}

onMounted(load);
</script>

<style scoped>
.split { display: grid; grid-template-columns: 180px 1fr; gap: 1rem; align-items: start; }
.groups { display: flex; flex-direction: column; gap: 2px; }
.gitem {
  text-align: left; padding: 0.5rem 0.7rem; border-radius: var(--radius);
  font-size: 0.85rem; color: var(--text-muted); transition: background 0.12s, color 0.12s;
}
.gitem:hover { background: var(--surface-2); color: var(--text); }
.gitem.on { background: var(--accent-soft); color: var(--accent); font-weight: 600; }

.listpane { min-width: 0; }
.listpane .tbl { width: 100%; }
.addrow { display: flex; gap: 0.4rem; margin-bottom: 0.8rem; }
.addrow .field { flex: 1; min-width: 0; }
.addrow .btn { flex-shrink: 0; }
</style>
