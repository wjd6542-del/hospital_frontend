<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-[300] flex items-center justify-center bg-[color:var(--border-strong)]/55"
      @click="onBackdropClick"
    >
      <div
        class="w-[380px] rounded-[4px] bg-white border-2 border-[color:var(--border-strong)] shadow-[6px_6px_0_var(--border-strong)] overflow-hidden"
        @click.stop
      >
        <!-- 헤더 -->
        <div
          class="flex items-center gap-3 px-4 py-3 border-b-2 border-[color:var(--border)]"
          :class="theme.headerBg"
        >
          <div
            class="w-9 h-9 flex items-center justify-center shrink-0 border-2 border-[color:var(--border-strong)]"
            :class="theme.iconWrap"
          >
            <i :class="['fa-solid', theme.icon, 'text-white']"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div
              class="text-[10px] font-bold uppercase tracking-widest pixel"
              :class="theme.label"
            >
              {{ variantLabel }}
            </div>
            <div class="text-sm font-bold text-[color:var(--text)] truncate">
              {{ title }}
            </div>
          </div>
        </div>

        <!-- 내용 -->
        <div class="px-4 py-4 text-[13px] text-[color:var(--text)] whitespace-pre-line">
          {{ message }}
        </div>

        <!-- 버튼 -->
        <div class="flex justify-end gap-2 px-4 py-3 border-t-2 border-[color:var(--border)] bg-[color:var(--surface-2)]">
          <button
            v-if="type === 'confirm'"
            class="btn btn-xs"
            @click="emit('cancel')"
          >
            {{ $t("취소") }}
          </button>
          <button
            class="btn btn-xs text-white"
            :class="theme.okBtn"
            @click="emit('ok')"
          >
            {{ $t("확인") }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from "vue";

type Variant = "info" | "warning" | "danger";

const props = withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    message?: string;
    type?: string;
    variant?: Variant;
  }>(),
  { variant: "info" },
);

const emit = defineEmits<{
  (e: "ok"): void;
  (e: "cancel"): void;
}>();

// variant 별 시각 메타데이터를 한 곳에서 관리
const VARIANT_THEMES: Record<Variant, {
  icon: string;
  iconWrap: string;
  headerBg: string;
  label: string;
  okBtn: string;
}> = {
  info: {
    icon: "fa-circle-info",
    iconWrap: "bg-[color:var(--accent)]",
    headerBg: "bg-[color:var(--accent-soft)]",
    label: "text-[color:var(--accent-hover)]",
    okBtn: "!bg-[color:var(--accent)]",
  },
  warning: {
    icon: "fa-triangle-exclamation",
    iconWrap: "bg-[color:var(--warning)]",
    headerBg: "bg-[color:var(--warning-soft)]",
    label: "text-[color:var(--warning)]",
    okBtn: "!bg-[color:var(--warning)]",
  },
  danger: {
    icon: "fa-circle-exclamation",
    iconWrap: "bg-[color:var(--danger)]",
    headerBg: "bg-[color:var(--danger-soft)]",
    label: "text-[color:var(--danger)]",
    okBtn: "!bg-[color:var(--danger)]",
  },
};

const theme = computed(() => VARIANT_THEMES[props.variant] || VARIANT_THEMES.info);

const variantLabel = computed(() => {
  if (props.variant === "danger") return "DANGER · 주의";
  if (props.variant === "warning") return "WARNING · 경고";
  return props.type === "confirm" ? "CONFIRM · 확인" : "INFO · 안내";
});

// 배경 클릭 시 confirm은 취소, alert는 확인으로 처리
function onBackdropClick() {
  if (props.type === "confirm") emit("cancel");
  else emit("ok");
}
</script>
