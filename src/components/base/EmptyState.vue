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
  generic: { icon: "👾", title: "텅~ 비었어요!", desc: "아직 데이터가 없어요.", hint: "새로 추가해 볼까요?" },
  ledger: { icon: "🪙", title: "장부가 깨끗해요!", desc: "기록된 거래가 아직 없어요.", hint: "＋ 거래 등록으로 첫 기록을 남겨보세요" },
  settlement: { icon: "🧾", title: "정산 대기 0건!", desc: "정산할 항목이 없어요.", hint: "＋ 정산 등록을 눌러보세요" },
  support: { icon: "💬", title: "문의함이 조용하네요", desc: "접수된 응대가 없어요.", hint: "＋ 응대 등록으로 시작해요" },
  faq: { icon: "❓", title: "질문이 없어요", desc: "등록된 FAQ가 아직 없어요.", hint: "＋ FAQ 추가로 채워보세요" },
  vendor: { icon: "🏪", title: "업체가 없어요", desc: "등록된 업체가 아직 없어요.", hint: "＋ 로 업체를 추가해요" },
  gameco: { icon: "🎮", title: "게임사가 없어요", desc: "등록된 게임사가 아직 없어요.", hint: "＋ 로 게임사를 추가해요" },
  board: { icon: "📋", title: "게시글이 없어요", desc: "아직 작성된 글이 없어요.", hint: "첫 글을 남겨보세요" },
  search: { icon: "🔍", title: "결과 없음", desc: "검색 결과가 없어요.", hint: "다른 조건으로 찾아보세요" },
  select: { icon: "🕹️", title: "대상을 골라주세요", desc: "좌측에서 항목을 선택하면 여기에 표시돼요.", hint: "클릭해서 시작!" },
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
