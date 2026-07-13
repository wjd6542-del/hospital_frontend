<template>
  <div v-if="totalPages > 1 || total > 0" class="pager">
    <span class="cnt num">총 {{ total }}건</span>
    <div class="nav">
      <button class="pbtn" :disabled="page <= 1" @click="go(page - 1)"><i class="fa-solid fa-chevron-left"></i></button>
      <button
        v-for="p in pages"
        :key="p"
        class="pbtn num"
        :class="{ on: p === page }"
        @click="go(p)"
      >{{ p }}</button>
      <button class="pbtn" :disabled="page >= totalPages" @click="go(page + 1)"><i class="fa-solid fa-chevron-right"></i></button>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from "vue";

const props = defineProps({
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  total: { type: Number, default: 0 },
  window: { type: Number, default: 5 },
});
const emit = defineEmits(["update:page", "change"]);

const pages = computed(() => {
  const tp = Math.max(1, props.totalPages);
  const w = props.window;
  let start = Math.max(1, props.page - Math.floor(w / 2));
  let end = Math.min(tp, start + w - 1);
  start = Math.max(1, end - w + 1);
  const arr = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
});

function go(p) {
  const tp = Math.max(1, props.totalPages);
  const next = Math.min(Math.max(1, p), tp);
  if (next === props.page) return;
  emit("update:page", next);
  emit("change", next);
}
</script>

<style scoped>
.pager { display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; margin-top: 0.9rem; flex-wrap: wrap; }
.cnt { font-size: 0.78rem; color: var(--text-muted); }
.nav { display: flex; gap: 0.3rem; }
.pbtn {
  min-width: 30px; height: 30px; padding: 0 0.4rem; display: grid; place-items: center;
  font-size: 0.8rem; color: var(--text); background: var(--surface);
  border: 2px solid var(--border-strong); border-radius: 3px; box-shadow: 2px 2px 0 var(--border-strong);
  transition: transform 0.07s, box-shadow 0.07s;
}
.pbtn:hover:not(:disabled) { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--border-strong); }
.pbtn:active:not(:disabled) { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--border-strong); }
.pbtn.on { background: var(--accent); color: var(--accent-fg); }
.pbtn:disabled { opacity: 0.4; box-shadow: none; cursor: default; }
</style>
