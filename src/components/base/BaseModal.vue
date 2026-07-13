<template>
  <TransitionGroup name="modal" tag="div">
    <div
      v-for="(entry, index) in modal.stack"
      :key="index"
      class="fixed inset-0 flex items-center justify-center bg-[color:var(--border-strong)]/55"
      :style="{ zIndex: 200 + index * 10 }"
    >
      <div
        class="relative bg-white rounded-[4px] border-2 border-[color:var(--border-strong)] shadow-[6px_6px_0_var(--border-strong)] w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        :class="sizeClass(entry.size)"
      >
        <!-- 공용 닫기 버튼 (우측 상단) -->
        <button
          type="button"
          @click="modal.closeModal()"
          class="absolute top-2.5 right-2.5 z-10 w-8 h-8 flex items-center justify-center rounded-[3px] border-2 border-[color:var(--border-strong)] bg-white text-[color:var(--text)] shadow-[2px_2px_0_var(--border-strong)] hover:bg-[color:var(--surface-2)] transition"
          :aria-label="$t('닫기')"
        >
          <i class="fa-solid fa-xmark text-base"></i>
        </button>

        <!-- 동적 모달 컴포넌트 - 바디 영역만 스크롤 -->
        <div class="p-4 md:p-6 overflow-y-auto flex-1 min-h-0">
          <component :is="entry.component" v-bind="entry.props" />
        </div>
      </div>
    </div>
  </TransitionGroup>
</template>

<script setup lang="ts">
// @ts-nocheck
import { onMounted, onBeforeUnmount } from "vue";
import { useModalStore } from "@/stores/modal";

const modal = useModalStore();

const SIZE_MAP: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-7xl",
};

// modal size 속성에 대응하는 Tailwind max-width 클래스를 반환
function sizeClass(size: string) {
  return SIZE_MAP[size] || SIZE_MAP.md;
}

// ESC 키로 최상단 모달 닫기
function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && modal.isOpen) {
    modal.closeModal();
  }
}

onMounted(() => document.addEventListener("keydown", handleKeydown));
onBeforeUnmount(() => document.removeEventListener("keydown", handleKeydown));
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.15s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: translate(4px, 4px);
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
  transform: translate(0, 0);
}
</style>
