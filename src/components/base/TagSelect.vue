<template>
  <div ref="wrap" class="ts" :class="{ open }">
    <div class="trigger" @click="toggle">
      <div class="chips" v-if="selected.length">
        <span v-for="t in selected" :key="t.id" class="chip" :style="chipStyle(t.color)">
          {{ t.name }}
          <i class="fa-solid fa-xmark x" @click.stop="removeVal(t.id)"></i>
        </span>
      </div>
      <span v-else class="ph"><i class="fa-solid fa-tags"></i> {{ placeholder }}</span>
      <i class="fa-solid fa-chevron-down chev" :class="{ up: open }"></i>
    </div>

    <div v-if="open" class="panel">
      <input ref="search" v-model="kw" class="tsearch" :placeholder="$t('태그 검색 또는 새 태그명…')" @click.stop @keyup.enter="onEnter" />
      <button v-if="tags.length" class="selall" @click.stop="toggleAll">
        <i class="fa-solid" :class="allSelected ? 'fa-square-check' : 'fa-square'"></i>
        {{ allSelected ? "전체 해제" : "전체 선택" }}
      </button>
      <div class="list">
        <label v-for="t in filtered" :key="t.id" class="opt" @click.stop>
          <input type="checkbox" :checked="isChecked(t.id)" @change="toggleVal(t.id)" />
          <span class="dot" :style="{ background: t.color }"></span>
          <span class="onm">{{ t.name }}</span>
        </label>
        <div v-if="!filtered.length && !canCreate" class="none">{{ $t("태그가 없어요") }}</div>
        <button v-if="canCreate" class="create" @click.stop="create">
          <i class="fa-solid fa-plus"></i> "<b>{{ kw.trim() }}</b>" 태그 만들기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useToast } from "vue-toastification";
import { tagApi } from "@/api/settings";

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  placeholder: { type: String, default: "태그 선택" },
});
const emit = defineEmits(["update:modelValue", "change"]);
const toast = useToast();

const PALETTE = ["#7a5cff", "#0ea88f", "#e07d16", "#e23b46", "#2f6df6", "#d6871e", "#c026d3", "#0891b2"];
const wrap = ref(null);
const search = ref(null);
const open = ref(false);
const kw = ref("");
const tags = ref([]);
const creating = ref(false);

const selected = computed(() => tags.value.filter((t) => props.modelValue.includes(t.id)));
const filtered = computed(() => {
  const k = kw.value.trim().toLowerCase();
  if (!k) return tags.value;
  return tags.value.filter((t) => t.name.toLowerCase().includes(k));
});
const canCreate = computed(() => {
  const k = kw.value.trim();
  return k.length > 0 && !tags.value.some((t) => t.name.toLowerCase() === k.toLowerCase());
});

function chipStyle(color) { return { background: color || "#7a5cff", color: "#fff", borderColor: "#1b1d2e" }; }
const allSelected = computed(() => tags.value.length > 0 && tags.value.every((t) => props.modelValue.includes(t.id)));
function isChecked(id) { return props.modelValue.includes(id); }
function emitVals(vals) { emit("update:modelValue", vals); emit("change", vals); }
function toggleAll() { emitVals(allSelected.value ? [] : tags.value.map((t) => t.id)); }
function toggleVal(id) {
  const set = new Set(props.modelValue);
  set.has(id) ? set.delete(id) : set.add(id);
  emitVals([...set]);
}
function removeVal(id) { emitVals(props.modelValue.filter((x) => x !== id)); }

async function reload() { tags.value = await tagApi.list({ only_active: true }); }
async function create() {
  const name = kw.value.trim();
  if (!name || creating.value) return;
  creating.value = true;
  try {
    const color = PALETTE[tags.value.length % PALETTE.length];
    const t = await tagApi.save({ name, color, sort: tags.value.length });
    await reload();
    emitVals([...new Set([...props.modelValue, t.id])]);
    kw.value = "";
    toast.success(`'${name}' 태그가 추가되었습니다.`);
  } catch (e) { toast.error(e?.message || "태그 추가 실패"); }
  finally { creating.value = false; }
}
function onEnter() { if (canCreate.value) create(); }

function toggle() { open.value = !open.value; if (open.value) { kw.value = ""; nextTick(() => search.value?.focus()); } }
function onOutside(e) { if (wrap.value && !wrap.value.contains(e.target)) open.value = false; }
onMounted(() => { reload(); document.addEventListener("click", onOutside, true); });
onBeforeUnmount(() => document.removeEventListener("click", onOutside, true));
defineExpose({ reload });
</script>

<style scoped>
.ts { position: relative; width: 100%; }
.trigger { min-height: 34px; display: flex; align-items: center; gap: 0.4rem; padding: 0.2rem 0.5rem; background: var(--surface); border: 2px solid var(--line-strong); border-radius: 3px; cursor: pointer; }
.ts.open .trigger { border-color: var(--seal); box-shadow: var(--ring); }
.chips { display: flex; flex-wrap: wrap; gap: 0.25rem; flex: 1; }
.chip { display: inline-flex; align-items: center; gap: 0.25rem; font-family: var(--font-pixel); font-size: 0.64rem; border: 1px solid; border-radius: 3px; padding: 0.08rem 0.4rem; }
.chip .x { cursor: pointer; font-size: 0.58rem; opacity: 0.85; }
.chip .x:hover { opacity: 1; }
.ph { flex: 1; font-size: 0.8rem; color: var(--ink-faint); display: inline-flex; align-items: center; gap: 0.35rem; }
.chev { font-size: 0.7rem; color: var(--ink-faint); transition: transform 0.2s; }
.chev.up { transform: rotate(180deg); }

.panel { position: absolute; left: 0; top: calc(100% + 4px); z-index: 50; width: 100%; min-width: 200px; background: var(--surface); border: 2px solid var(--line-hard); border-radius: 3px; box-shadow: 4px 4px 0 var(--line-hard); overflow: hidden; }
.tsearch { width: 100%; height: 32px; padding: 0 0.6rem; font-size: 0.8rem; border: none; border-bottom: 2px solid var(--line); outline: none; background: var(--surface-2); }
.selall { width: 100%; display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.6rem; font-family: var(--font-pixel); font-size: 0.68rem; color: var(--seal); background: rgba(122, 92, 255, 0.12); border-bottom: 2px solid var(--line); text-align: left; }
.selall:hover { background: rgba(122, 92, 255, 0.22); }
.list { max-height: 240px; overflow-y: auto; }
.opt { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.6rem; font-size: 0.82rem; color: var(--ink); cursor: pointer; }
.opt:hover { background: var(--surface-2); }
.opt input { accent-color: var(--seal); width: 15px; height: 15px; }
.dot { width: 10px; height: 10px; border-radius: 2px; border: 1px solid var(--line-hard); flex-shrink: 0; }
.onm { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.none { padding: 0.8rem; text-align: center; color: var(--ink-faint); font-size: 0.8rem; }
.create { width: 100%; display: flex; align-items: center; gap: 0.4rem; padding: 0.55rem 0.6rem; font-size: 0.82rem; color: var(--seal); background: rgba(122, 92, 255, 0.14); border-top: 2px solid var(--line); text-align: left; }
.create:hover { background: rgba(122, 92, 255, 0.24); }
.create b { font-family: var(--font-pixel); }
</style>
