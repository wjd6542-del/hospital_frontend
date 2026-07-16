<template>
  <div class="relative w-full">
    <div
      class="flex border border-[color:var(--border-strong)] rounded-[6px] overflow-hidden bg-[color:var(--surface)] transition focus-within:border-[color:var(--accent)]"
      :class="isXs ? 'h-[28px]' : 'h-[34px]'"
    >
      <input
        :value="formattedDate"
        @click="toggleCalendar"
        readonly
        :placeholder="placeholder"
        class="flex-1 min-w-0 px-2.5 outline-none cursor-pointer bg-transparent text-[color:var(--text)]"
        :class="isXs ? 'text-[11px]' : 'text-xs'"
      />

      <button
        v-if="innerValue"
        type="button"
        @click.stop="clearDate"
        class="px-2 border-l border-[color:var(--border-strong)] hover:bg-[color:var(--surface-2)] text-[color:var(--danger)] text-xs"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>

      <button
        type="button"
        @click.stop="toggleCalendar"
        class="px-2 border-l border-[color:var(--border-strong)] hover:bg-[color:var(--surface-2)] text-[color:var(--text-muted)] text-xs"
      >
        <i class="fa-regular fa-calendar"></i>
      </button>
    </div>

    <div
      v-show="openCalendar"
      class="absolute left-0 mt-2 z-50 bg-[color:var(--surface)] border border-[color:var(--border-strong)] rounded-[6px] shadow-[var(--shadow-lg)] overflow-hidden"
    >
      <VCDatePicker color="purple" :is-dark="isDark"
        v-model="innerValue"
        :mode="mode"
        :is24hr="true"
        :time-picker="{ minutesIncrement: minuteStep }"
        @update:modelValue="handleSelect"
      />
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { DatePicker as VCDatePicker } from "v-calendar";
import { useThemeStore } from "@/stores/theme";

export default {
  name: "DatePicker",
  components: { VCDatePicker },

  props: {
    modelValue: {
      type: [String, Date, null] as any,
      default: null,
    },
    placeholder: {
      type: String,
      default: "날짜 선택",
    },
    mode: {
      type: String,
      default: "date",
    },
    minuteStep: {
      type: Number,
      default: 10,
    },
    // 트리거 높이. 'sm'=34px, 'xs'=28px(필터바 정렬용).
    size: {
      type: String,
      default: "sm",
    },
  },

  emits: ["update:modelValue", "change"],

  data() {
    return {
      openCalendar: false,
      innerValue: null as Date | null,
    };
  },

  watch: {
    modelValue: {
      immediate: true,
      handler(val) {
        if (!val) {
          this.innerValue = null;
          return;
        }
        this.innerValue = val instanceof Date ? val : new Date(val);
      },
    },
  },

  computed: {
    isDark(): boolean { return useThemeStore().dark; },
    isXs(): boolean { return this.size === "xs"; },
    formattedDate(): string {
      if (!this.innerValue) return "";
      const d = this.innerValue;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      if (this.mode === "date") return `${yyyy}-${mm}-${dd}`;
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    },
  },

  mounted() {
    document.addEventListener("click", this.handleOutside, true);
  },

  beforeUnmount() {
    document.removeEventListener("click", this.handleOutside, true);
  },

  methods: {
    toggleCalendar() {
      this.openCalendar = !this.openCalendar;
    },

    clearDate() {
      this.innerValue = null;
      this.$emit("update:modelValue", "");
      this.$emit("change", "");
      this.openCalendar = false;
    },

    formatToString(d: Date): string {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      if (this.mode === "date") return `${yyyy}-${mm}-${dd}`;
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    },

    handleSelect(val: Date | null) {
      if (!val) {
        this.innerValue = null;
        this.$emit("update:modelValue", "");
        this.$emit("change", "");
        return;
      }
      this.innerValue = val;
      const str = this.formatToString(val);
      this.$emit("update:modelValue", str);
      this.$emit("change", str);
      this.openCalendar = false;
    },

    handleOutside(event: any) {
      if (!this.$el.contains(event.target)) {
        this.openCalendar = false;
      }
    },
  },
};
</script>
