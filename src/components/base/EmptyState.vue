<template>
  <div class="empty-wrap" :class="{ compact }">
    <div class="stage">
      <div class="sprite">{{ view.icon }}</div>
      <div class="shadow"></div>
    </div>
    <h4 class="etitle">{{ view.title }}</h4>
    <p class="edesc">{{ view.desc }}</p>
    <p class="hint"><span class="blink">▸</span> {{ view.hint }}</p>
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
  hint: { type: String, default: "" },
  compact: { type: Boolean, default: false },
});

const PRESETS = {
  generic: { icon: "📭", title: "비어 있습니다", desc: "아직 데이터가 없습니다.", hint: "새로 추가해 보세요" },
  faq: { icon: "❓", title: "질문이 없습니다", desc: "등록된 FAQ가 아직 없습니다.", hint: "＋ FAQ 추가로 채워보세요" },
  board: { icon: "📋", title: "게시글이 없습니다", desc: "아직 작성된 글이 없습니다.", hint: "첫 글을 남겨보세요" },
  search: { icon: "🔍", title: "결과 없음", desc: "검색 결과가 없습니다.", hint: "다른 조건으로 찾아보세요" },
  select: { icon: "👉", title: "대상을 골라주세요", desc: "좌측에서 항목을 선택하면 여기에 표시됩니다.", hint: "클릭해서 시작하세요" },
};

const view = computed(() => {
  const p = PRESETS[props.variant] || PRESETS.generic;
  return {
    icon: props.icon || p.icon,
    title: props.title || p.title,
    desc: props.desc || p.desc,
    hint: props.hint || p.hint,
  };
});
</script>

<style scoped>
.empty-wrap { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 2.4rem 1rem; }
.empty-wrap.compact { padding: 1.4rem 1rem; }

.stage { position: relative; width: 88px; height: 78px; margin-bottom: 0.9rem; }
.sprite { font-size: 3rem; line-height: 1; filter: drop-shadow(2px 3px 0 rgba(27, 29, 46, 0.18)); animation: hop 1.15s cubic-bezier(0.3, 0.7, 0.4, 1) infinite; }
.shadow { position: absolute; left: 50%; bottom: 2px; width: 46px; height: 10px; transform: translateX(-50%); background: rgba(27, 29, 46, 0.16); border-radius: 50%; animation: squash 1.15s cubic-bezier(0.3, 0.7, 0.4, 1) infinite; }

@keyframes hop {
  0%, 100% { transform: translateY(0); }
  30% { transform: translateY(-18px); }
  55% { transform: translateY(0) scaleY(0.9); }
  70% { transform: translateY(-6px); }
}
@keyframes squash {
  0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.9; }
  30% { transform: translateX(-50%) scale(0.6); opacity: 0.5; }
  55% { transform: translateX(-50%) scale(1.1); opacity: 1; }
}

.etitle { font-family: var(--font-sans); font-size: 1.05rem; color: var(--text); }
.edesc { margin-top: 0.35rem; font-size: 0.86rem; color: var(--text-muted); }
.hint { margin-top: 0.7rem; font-family: var(--font-sans); font-size: 0.72rem; color: var(--accent-hover); background: var(--accent-soft); border: 2px solid var(--border-strong); border-radius: 3px; padding: 0.3rem 0.6rem; box-shadow: 2px 2px 0 var(--border-strong); }
.blink { animation: blink 1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }
.cta { margin-top: 0.9rem; }

@media (prefers-reduced-motion: reduce) {
  .sprite, .shadow, .blink { animation: none; }
}
</style>
