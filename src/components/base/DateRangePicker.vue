<template>
  <div class="relative w-full flex items-start gap-1">
    <!-- 빠른 버튼 -->
    <div v-if="showQuickButtons" class="relative">
      <button
        @click.stop="toggleQuick"
        class="flex items-center justify-center border border-[color:var(--border-strong)] rounded-[6px] hover:bg-[color:var(--surface-2)] text-[color:var(--text-muted)] text-xs"
        :class="isXs ? 'h-[28px] w-[28px]' : 'h-[34px] w-[34px]'"
      >
        <i class="fa-solid fa-ellipsis-vertical"></i>
      </button>

      <div
        v-show="openQuick"
        class="absolute left-0 mt-1 w-32 bg-[color:var(--surface)] border border-[color:var(--border-strong)] rounded-[6px] shadow-[var(--shadow-lg)] overflow-hidden z-50"
      >
        <button
          class="flex items-center gap-2 w-full text-left px-2.5 py-1.5 text-xs hover:bg-[color:var(--surface-2)]"
          @click="setQuick('yesterday')"
        >
          <i class="fa-regular fa-clock text-gray-400 text-[10px]"></i>
          {{ $t("어제") }}
        </button>

        <button
          class="flex items-center gap-2 w-full text-left px-2.5 py-1.5 text-xs hover:bg-[color:var(--surface-2)]"
          @click="setQuick('today')"
        >
          <i class="fa-regular fa-calendar-check text-blue-500 text-[10px]"></i>
          {{ $t("오늘") }}
        </button>

        <button
          class="flex items-center gap-2 w-full text-left px-2.5 py-1.5 text-xs hover:bg-[color:var(--surface-2)]"
          @click="setQuick('week')"
        >
          <i class="fa-solid fa-calendar-week text-green-500 text-[10px]"></i>
          {{ $t("일주일") }}
        </button>

        <!-- ✅ 이번달 추가 -->
        <button
          class="flex items-center gap-2 w-full text-left px-2.5 py-1.5 text-xs hover:bg-[color:var(--surface-2)]"
          @click="setQuick('month')"
        >
          <i class="fa-solid fa-calendar-days text-purple-500 text-[10px]"></i>
          {{ $t("이번달") }}
        </button>
      </div>
    </div>

    <!-- 날짜 입력 -->
    <div class="relative flex-1">
      <div
        class="flex border border-[color:var(--border-strong)] rounded-[6px] overflow-hidden bg-[color:var(--surface)] transition focus-within:border-[color:var(--accent)]"
        :class="isXs ? 'h-[28px]' : 'h-[34px]'"
      >
        <input
          :value="formattedRange"
          @click="toggleCalendar"
          readonly
          :placeholder="placeholder"
          class="flex-1 min-w-0 px-2.5 outline-none cursor-pointer bg-transparent text-[color:var(--text)]"
          :class="isXs ? 'text-[11px]' : 'text-xs'"
        />

        <button
          v-if="innerValue.start || innerValue.end"
          @click.stop="clearRange"
          class="px-2 border-l border-[color:var(--border-strong)] hover:bg-[color:var(--surface-2)] text-[color:var(--danger)] text-xs"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>

        <button
          @click.stop="toggleCalendar"
          class="px-2 border-l border-[color:var(--border-strong)] hover:bg-[color:var(--surface-2)] text-[color:var(--text-muted)] text-xs"
        >
          <i class="fa-regular fa-calendar"></i>
        </button>
      </div>

      <!-- 달력 -->
      <div
        v-show="openCalendar"
        class="absolute left-0 mt-1 z-50 bg-[color:var(--surface)] border border-[color:var(--border-strong)] rounded-[6px] shadow-[var(--shadow-lg)] overflow-hidden"
      >
        <DatePicker color="purple" :is-dark="isDark"
          v-model.range="innerValue"
          :mode="mode"
          :is24hr="true"
          :time-picker="{ minutesIncrement: minuteStep }"
          @update:modelValue="handleSelect"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { DatePicker } from "v-calendar";
import {
  formatDateOnly,
  formatDateMinute,
  startOfDay,
  endOfDay,
  todayRange,
  yesterdayRange,
  lastWeekRange,
  currentMonthRange,
} from "@/utils/date";
import { useThemeStore } from "@/stores/theme";

export default {
  name: "DateRangePicker",
  components: { DatePicker },

  props: {
    modelValue: {
      type: Object,
      default: () => ({
        start: null,
        end: null,
      }),
    },

    placeholder: {
      type: String,
      default: "기간 선택",
    },

    minuteStep: {
      type: Number,
      default: 10,
    },

    showQuickButtons: {
      type: Boolean,
      default: false,
    },

    showTime: {
      type: Boolean,
      default: true,
    },

    mode: {
      type: String,
      default: "dateTime",
    },

    // 트리거 높이. 'sm'=34px, 'xs'=28px(필터바에서 인풋·셀렉트와 정렬).
    size: {
      type: String,
      default: "sm",
    },
  },

  emits: ["update:modelValue", "change"],

  data() {
    return {
      openCalendar: false,
      openQuick: false,
      innerValue: {
        start: undefined as Date | undefined,
        end: undefined as Date | undefined,
      },
    };
  },

  watch: {
    modelValue: {
      immediate: true,
      deep: true,
      // 외부 modelValue 변경 시 내부 값을 동기화한다
      handler(val) {
        if (!val) {
          this.innerValue.start = undefined;
          this.innerValue.end = undefined;
          return;
        }

        this.innerValue.start = val.start || undefined;
        this.innerValue.end = val.end || undefined;
      },
    },
  },

  computed: {
    isDark(): boolean { return useThemeStore().dark; },
    isXs(): boolean { return this.size === "xs"; },
    // 선택된 시작/종료 날짜를 표시용 문자열로 포맷팅한다
    formattedRange(): string {
      if (!this.innerValue?.start || !this.innerValue?.end) return "";
      const fmt = this.mode === "date" ? formatDateOnly : formatDateMinute;
      return `${fmt(this.innerValue.start)} ~ ${fmt(this.innerValue.end)}`;
    },
  },

  // 마운트 시 외부 클릭 리스너를 등록한다
  mounted() {
    document.addEventListener("click", this.handleOutside, true);
  },

  // 언마운트 직전 외부 클릭 리스너를 제거한다
  beforeUnmount() {
    document.removeEventListener("click", this.handleOutside, true);
  },

  methods: {
    // 선택된 기간을 초기화하고 이벤트를 emit한다
    clearRange() {
      this.innerValue.start = undefined;
      this.innerValue.end = undefined;

      this.$emit("update:modelValue", {
        start: undefined,
        end: undefined,
      });

      this.$emit("change");
      this.openCalendar = false;
      this.openQuick = false;
    },

    // 달력 열림 상태를 토글한다
    toggleCalendar() {
      this.openCalendar = !this.openCalendar;
      this.openQuick = false;
    },

    // 빠른 선택 드롭다운을 토글한다
    toggleQuick() {
      this.openQuick = !this.openQuick;
      this.openCalendar = false;
    },

    // 달력에서 날짜 범위 선택 시 호출되는 핸들러
    handleSelect(val: any) {
      if (val?.start) val.start = startOfDay(val.start);
      if (val?.end) val.end = endOfDay(val.end);
      this.innerValue = val;

      this.$emit("update:modelValue", val);
      this.$emit("change");
    },

    // 빠른 버튼(오늘/어제/일주일/이번달)에 따라 날짜 범위를 설정한다
    setQuick(type: string) {
      const ranges: Record<string, () => { start: Date; end: Date }> = {
        today: todayRange,
        yesterday: yesterdayRange,
        week: lastWeekRange,
        month: currentMonthRange,
      };
      const range = (ranges[type] || todayRange)();

      // mode === "date" 인 경우 시간 자정으로 통일
      if (this.mode === "date") {
        range.start = startOfDay(range.start);
        range.end = startOfDay(range.end);
      }

      this.innerValue = range;
      this.$emit("update:modelValue", this.innerValue);
      this.$emit("change");

      this.openQuick = false;
      this.openCalendar = false;
    },

    // 컴포넌트 외부 클릭 시 달력/빠른 선택을 닫는다
    handleOutside(event: any) {
      if (!this.$el.contains(event.target)) {
        this.openCalendar = false;
        this.openQuick = false;
      }
    },
  },
};
</script>
