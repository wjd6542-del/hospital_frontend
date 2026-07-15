<template>
  <div class="st">
    <p class="desc">{{ $t("근무유형을 등록합니다. 근무표 그리드의 팔레트가 됩니다.") }}</p>

    <table class="tbl">
      <thead>
        <tr>
          <th style="width: 90px">{{ $t("코드") }}</th>
          <th style="width: 120px">{{ $t("명칭") }}</th>
          <th style="width: 100px">{{ $t("시작") }}</th>
          <th style="width: 100px">{{ $t("종료") }}</th>
          <th style="width: 90px">{{ $t("자정넘김") }}</th>
          <th style="width: 90px">{{ $t("휴게(분)") }}</th>
          <th style="width: 80px">{{ $t("근무") }}</th>
          <th style="width: 80px">{{ $t("색상") }}</th>
          <th style="width: 90px"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!rows.length">
          <td colspan="9">
            <EmptyState icon="fa-clock" :title="$t('근무유형이 없습니다')" :desc="$t('아래에서 추가하세요.')" compact />
          </td>
        </tr>
        <tr v-for="r in rows" :key="r.id">
          <td><input v-model="r.code" class="cell-input" @change="update(r)" /></td>
          <td><input v-model="r.name" class="cell-input" @change="update(r)" /></td>
          <td><input v-model="r.start_time" class="cell-input" placeholder="07:00" :disabled="!r.is_work" @change="update(r)" /></td>
          <td><input v-model="r.end_time" class="cell-input" placeholder="15:00" :disabled="!r.is_work" @change="update(r)" /></td>
          <td><BaseToggle v-model="r.crosses_midnight" size="sm" :disabled="!r.is_work" @update:modelValue="update(r)" /></td>
          <td><input v-model.number="r.break_minutes" type="number" min="0" class="cell-input" :disabled="!r.is_work" @change="update(r)" /></td>
          <td><BaseToggle v-model="r.is_work" size="sm" @update:modelValue="onWorkToggle(r)" /></td>
          <td><input v-model="r.color" type="color" class="colorin" @change="update(r)" /></td>
          <td><button class="btn btn-xs btn-ghost" @click="remove(r)">{{ $t("삭제") }}</button></td>
        </tr>
      </tbody>
    </table>

    <div class="addrow">
      <input v-model="draft.code" class="field field-xs" style="width: 90px" :placeholder="$t('코드')" />
      <input v-model="draft.name" class="field field-xs" style="width: 120px" :placeholder="$t('명칭')" />
      <input v-model="draft.start_time" class="field field-xs" style="width: 100px" placeholder="07:00" />
      <input v-model="draft.end_time" class="field field-xs" style="width: 100px" placeholder="15:00" />
      <button class="btn btn-xs btn-primary" @click="add">＋ {{ $t("추가") }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from "vue";
import BaseToggle from "@/components/base/BaseToggle.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import { shiftTypeApi } from "@/api/attendance";
import { useToast } from "vue-toastification";

const toast = useToast();
const rows = ref([]);
const draft = reactive({ code: "", name: "", start_time: "", end_time: "" });

async function load() {
  rows.value = await shiftTypeApi.list({});
}

/** 비근무(OFF/연차)로 바꾸면 시각·휴게·자정넘김을 비운다 — 의미가 없다 */
function onWorkToggle(r) {
  if (!r.is_work) {
    r.start_time = "";
    r.end_time = "";
    r.crosses_midnight = false;
    r.break_minutes = 0;
  }
  update(r);
}

async function update(r) {
  try {
    await shiftTypeApi.save({
      id: r.id,
      code: r.code,
      name: r.name,
      start_time: r.start_time || "",
      end_time: r.end_time || "",
      crosses_midnight: r.crosses_midnight,
      break_minutes: r.break_minutes ?? 0,
      is_work: r.is_work,
      color: r.color,
      sort: r.sort,
      is_active: r.is_active,
    });
  } catch (e) {
    toast.error(e?.message || "수정에 실패했습니다.");
    await load();
  }
}

async function add() {
  if (!draft.code.trim() || !draft.name.trim()) {
    toast.warning("코드와 명칭을 입력하세요.");
    return;
  }
  try {
    await shiftTypeApi.save({
      code: draft.code.trim().toUpperCase(),
      name: draft.name.trim(),
      start_time: draft.start_time || "",
      end_time: draft.end_time || "",
      sort: rows.value.length,
    });
    draft.code = "";
    draft.name = "";
    draft.start_time = "";
    draft.end_time = "";
    await load();
  } catch (e) {
    toast.error(e?.message || "추가에 실패했습니다.");
  }
}

async function remove(r) {
  try {
    await shiftTypeApi.remove(r.id);
    await load();
  } catch (e) {
    toast.error(e?.message || "삭제에 실패했습니다.");
  }
}

onMounted(load);
</script>

<style scoped>
.st { min-width: 0; }
.desc { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; }
.tbl { width: 100%; }
.colorin { width: 44px; height: 28px; border: 1px solid var(--border-strong); border-radius: var(--radius); cursor: pointer; background: none; padding: 2px; }
.addrow { display: flex; gap: 0.4rem; margin-top: 0.9rem; }
</style>
