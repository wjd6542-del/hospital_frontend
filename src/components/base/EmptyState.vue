<template>
  <div class="empty-wrap" :class="{ compact }">
    <div class="glyph"><i class="fa-solid" :class="view.icon"></i></div>
    <h4 class="etitle">{{ view.title }}</h4>
    <p class="edesc">{{ view.desc }}</p>
    <div v-if="$slots.default" class="cta"><slot /></div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from "vue";

const props = defineProps({
  variant: { type: String, default: "generic" },
  icon: { type: String, default: "" },
  title: { type: String, default: "" },
  desc: { type: String, default: "" },
  compact: { type: Boolean, default: false },
});

const PRESETS = {
  generic: { icon: "fa-inbox", title: "데이터가 없습니다", desc: "표시할 항목이 아직 없습니다." },
  faq: { icon: "fa-circle-question", title: "질문이 없습니다", desc: "FAQ를 추가하면 여기에 표시됩니다." },
  board: { icon: "fa-clipboard-list", title: "게시글이 없습니다", desc: "첫 글을 작성해 보세요." },
  search: { icon: "fa-magnifying-glass", title: "결과가 없습니다", desc: "다른 조건으로 검색해 보세요." },
  select: { icon: "fa-hand-pointer", title: "항목을 선택하세요", desc: "좌측에서 선택하면 여기에 표시됩니다." },
};

const view = computed(() => {
  const p = PRESETS[props.variant] || PRESETS.generic;
  return {
    icon: props.icon || p.icon,
    title: props.title || p.title,
    desc: props.desc || p.desc,
  };
});
</script>

<style scoped>
.empty-wrap { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 3rem 1rem; }
.empty-wrap.compact { padding: 1.8rem 1rem; }

.glyph {
  display: grid; place-items: center;
  width: 48px; height: 48px; margin-bottom: 0.9rem;
  border-radius: var(--radius-lg);
  background: var(--surface-2);
  color: var(--text-subtle);
  font-size: 1.15rem;
}
.etitle { font-size: 0.95rem; font-weight: 600; color: var(--text); }
.edesc { margin-top: 0.3rem; font-size: 0.84rem; color: var(--text-subtle); }
.cta { margin-top: 1.1rem; }
</style>
