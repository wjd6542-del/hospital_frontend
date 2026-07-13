<template>
  <div ref="wrap" class="ms" :class="{ open }">
    <div class="trigger" @click="toggle">
      <div class="chips" v-if="selected.length">
        <span v-for="s in selectedShown" :key="s.value" class="chip">
          {{ s.label }}
          <i class="fa-solid fa-xmark x" @click.stop="removeVal(s.value)"></i>
        </span>
        <span v-if="selected.length > maxChips" class="more">+{{ selected.length - maxChips }}</span>
      </div>
      <span v-else class="ph">{{ placeholder }}</span>
      <div class="tools">
        <button v-if="selected.length" class="clr" @click.stop="clearAll"><i class="fa-solid fa-xmark"></i></button>
        <i class="fa-solid fa-chevron-down chev" :class="{ up: open }"></i>
      </div>
    </div>

    <div v-if="open" class="panel">
      <input ref="search" v-model="kw" class="msearch" :placeholder="searchPlaceholder" @click.stop />
      <button v-if="options.length" class="selall" @click.stop="toggleAll">
        <i class="fa-solid" :class="allSelected ? 'fa-square-check' : 'fa-square'"></i>
        {{ allSelected ? "전체 해제" : "전체 선택" }}
      </button>
      <div class="list">
        <label v-for="o in filtered" :key="o[valueKey]" class="opt" @click.stop>
          <input type="checkbox" :checked="isChecked(o[valueKey])" @change="toggleVal(o[valueKey])" />
          <span>{{ o[labelKey] }}</span>
        </label>
        <div v-if="!filtered.length" class="none">{{ $t("결과 없음") }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  options: { type: Array, default: () => [] },
  labelKey: { type: String, default: "label" },
  valueKey: { type: String, default: "value" },
  placeholder: { type: String, default: "선택" },
  searchPlaceholder: { type: String, default: "검색…" },
  maxChips: { type: Number, default: 3 },
});
const emit = defineEmits(["update:modelValue", "change"]);

const wrap = ref(null);
const search = ref(null);
const open = ref(false);
const kw = ref("");

const selected = computed(() =>
  props.options.filter((o) => props.modelValue.includes(o[props.valueKey])),
);
const selectedShown = computed(() =>
  selected.value.slice(0, props.maxChips).map((o) => ({ value: o[props.valueKey], label: o[props.labelKey] })),
);
const filtered = computed(() => {
  const k = kw.value.trim().toLowerCase();
  if (!k) return props.options;
  return props.options.filter((o) => String(o[props.labelKey]).toLowerCase().includes(k));
});

const allSelected = computed(() => props.options.length > 0 && props.options.every((o) => props.modelValue.includes(o[props.valueKey])));
function toggleAll() { emitVals(allSelected.value ? [] : props.options.map((o) => o[props.valueKey])); }
function isChecked(v) { return props.modelValue.includes(v); }
function toggle() {
  open.value = !open.value;
  if (open.value) { kw.value = ""; nextTick(() => search.value?.focus()); }
}
function emitVals(vals) { emit("update:modelValue", vals); emit("change", vals); }
function toggleVal(v) {
  const set = new Set(props.modelValue);
  set.has(v) ? set.delete(v) : set.add(v);
  emitVals([...set]);
}
function removeVal(v) { emitVals(props.modelValue.filter((x) => x !== v)); }
function clearAll() { emitVals([]); }

function onOutside(e) { if (wrap.value && !wrap.value.contains(e.target)) open.value = false; }
onMounted(() => document.addEventListener("click", onOutside, true));
onBeforeUnmount(() => document.removeEventListener("click", onOutside, true));
</script>

<style scoped>
.ms { position: relative; width: 100%; }
.trigger {
  min-height: 34px; display: flex; align-items: center; gap: 0.4rem; padding: 0.2rem 0.5rem;
  background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius); cursor: pointer;
}
.ms.open .trigger { border-color: var(--accent); box-shadow: var(--ring); }
.chips { display: flex; flex-wrap: wrap; gap: 0.25rem; flex: 1; }
.chip { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.68rem; color: var(--accent-hover); background: var(--accent-soft); border: 1px solid var(--border-strong); border-radius: var(--radius); padding: 0.05rem 0.35rem; }
.chip .x { cursor: pointer; font-size: 0.6rem; }
.chip .x:hover { color: var(--danger); }
.more { font-size: 0.66rem; color: var(--text-muted); align-self: center; }
.ph { flex: 1; font-size: 0.8rem; color: var(--text-subtle); }
.tools { display: flex; align-items: center; gap: 0.3rem; }
.clr { color: var(--text-subtle); font-size: 0.7rem; }
.clr:hover { color: var(--accent); }
.chev { font-size: 0.7rem; color: var(--text-subtle); transition: transform 0.2s; }
.chev.up { transform: rotate(180deg); }

.panel { position: absolute; left: 0; top: calc(100% + 4px); z-index: 50; width: 100%; min-width: 180px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius); box-shadow: var(--shadow-md); overflow: hidden; }
.msearch { width: 100%; height: 30px; padding: 0 0.6rem; font-size: 0.78rem; border: none; border-bottom: 1px solid var(--border); outline: none; background: var(--surface-2); }
.selall { width: 100%; display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.6rem; font-size: 0.68rem; color: var(--accent); background: var(--accent-soft); border-bottom: 1px solid var(--border); text-align: left; }
.selall:hover { background: var(--accent-soft); filter: brightness(0.96); }
.list { max-height: 220px; overflow-y: auto; }
.opt { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.6rem; font-size: 0.82rem; color: var(--text); cursor: pointer; }
.opt:hover { background: var(--surface-2); }
.opt input { accent-color: var(--accent); width: 15px; height: 15px; }
.none { padding: 0.9rem; text-align: center; color: var(--text-subtle); font-size: 0.8rem; }
</style>
