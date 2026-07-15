<template>
  <div
    ref="wrapper"
    class="relative w-full"
    :style="{ zIndex: open ? 9999 : 1 }"
  >
    <!-- 트리거 — .field 와 동일한 시각 언어 -->
    <div
      :class="triggerClasses"
      @click="!disabled && toggle()"
    >
      <div class="flex-1 truncate leading-none flex items-center gap-2">
        <span
          v-if="selectedItem && selectedItem[colorKey]"
          class="w-3 h-3 rounded-[3px] border border-[color:var(--border-strong)] shrink-0"
          :style="{ backgroundColor: selectedItem[colorKey] }"
        ></span>
        <span :class="selectedLabel ? 'text-[color:var(--text)]' : 'text-[color:var(--text-subtle)]'" class="truncate">
          {{ selectedLabel || placeholder }}
        </span>
      </div>

      <div class="flex items-center gap-1 ml-1.5 shrink-0">
        <button
          v-if="clearable && hasValue && !disabled"
          type="button"
          class="text-[color:var(--text-subtle)] hover:text-[color:var(--accent)] transition-colors flex items-center justify-center text-[10px]"
          @click.stop="clear"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
        <i
          class="fa-solid fa-chevron-down text-[9px] transition-transform duration-200 flex items-center justify-center"
          :class="open ? 'rotate-180 text-[color:var(--accent)]' : 'text-[color:var(--text-subtle)]'"
        ></i>
      </div>
    </div>

    <!-- 드롭다운: body 로 Teleport 하여 모달·테이블의 overflow 클립을 회피 -->
    <Teleport to="body">
      <div
        v-if="open"
        ref="dropdown"
        :style="dropdownStyle"
        class="bg-[color:var(--surface)] border border-[color:var(--border-strong)] rounded-[6px] shadow-[var(--shadow-lg)] overflow-hidden py-1"
      >
        <div class="max-h-56 overflow-y-auto">
          <div
            v-for="item in options"
            :key="item[valueKey]"
            class="px-3 h-[30px] flex items-center justify-between gap-2 text-xs cursor-pointer transition-colors"
            :class="item[valueKey] === modelValue
              ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-hover)] font-semibold'
              : 'text-[color:var(--text)] hover:bg-[color:var(--surface-2)]'"
            @click="select(item)"
          >
            <span class="flex items-center gap-2 truncate">
              <span
                v-if="item[colorKey]"
                class="w-3 h-3 rounded-[3px] border border-[color:var(--border-strong)] shrink-0"
                :style="{ backgroundColor: item[colorKey] }"
              ></span>
              <span class="truncate">{{ item[labelKey] }}</span>
            </span>
            <i
              v-if="item[valueKey] === modelValue"
              class="fa-solid fa-check text-[color:var(--accent)] text-[10px] shrink-0"
            ></i>
          </div>
          <div
            v-if="!options.length"
            class="px-3 py-5 text-center text-xs text-[color:var(--text-subtle)]"
          >
            {{ emptyText }}
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
// 단순 단일 선택 드롭다운. 정적 옵션(상태·연·월 등)의 네이티브 <select> 대체용.
// 검색이 필요하면 SearchSelect, 다중이면 MultiSelect 를 쓴다.
export default {
  name: "BaseSelect",
  // inheritAttrs 기본값(true) — 부모가 넘긴 style(width 등)이 root 로 fall-through 되어야
  // 필터바의 `> div { width:170px }` 를 인라인 width 로 덮을 수 있다.
  props: {
    modelValue: { type: [String, Number, Boolean, null], default: null },
    options: { type: Array, required: true },
    labelKey: { type: String, default: "label" },
    valueKey: { type: String, default: "value" },
    colorKey: { type: String, default: "color" },
    placeholder: { type: String, default: "선택하세요" },
    emptyText: { type: String, default: "항목이 없습니다" },
    clearable: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    // 'sm' = .field(34px), 'xs' = .field-xs(28px)
    size: { type: String, default: "sm" },
  },
  emits: ["update:modelValue", "change"],
  data() {
    return {
      open: false,
      dropdownStyle: { position: "fixed", top: "0px", left: "0px", width: "0px", zIndex: 10000 },
    };
  },
  computed: {
    selectedItem() {
      return this.options.find((o) => o[this.valueKey] === this.modelValue) ?? null;
    },
    selectedLabel() {
      return this.selectedItem ? this.selectedItem[this.labelKey] : "";
    },
    hasValue() {
      return this.modelValue !== null && this.modelValue !== undefined && this.modelValue !== "";
    },
    isXs() {
      return this.size === "xs";
    },
    // .field / .field-xs 와 시각적으로 일치하는 트리거 클래스
    triggerClasses() {
      return [
        "w-full flex items-center justify-between box-border rounded-[6px]",
        "bg-[color:var(--surface)] border transition select-none",
        this.isXs ? "h-[28px] px-2 text-[11px]" : "h-[34px] px-2.5 text-xs",
        this.disabled
          ? "bg-[color:var(--surface-2)] border-[color:var(--border-strong)] cursor-not-allowed opacity-70"
          : this.open
            ? "border-[color:var(--accent)] shadow-[var(--ring)] cursor-pointer"
            : "border-[color:var(--border-strong)] hover:border-[color:var(--accent)] cursor-pointer",
      ];
    },
  },
  methods: {
    updateDropdownPosition() {
      const el = this.$refs.wrapper;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dd = this.$refs.dropdown;
      const ddHeight = dd ? dd.offsetHeight : 240;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < ddHeight + 12 && rect.top > ddHeight + 12;
      const top = openUp ? rect.top - ddHeight - 4 : rect.bottom + 4;
      this.dropdownStyle = {
        position: "fixed",
        top: `${Math.round(top)}px`,
        left: `${Math.round(rect.left)}px`,
        width: `${Math.round(rect.width)}px`,
        zIndex: 10000,
      };
    },
    toggle() {
      this.open = !this.open;
      if (this.open) {
        this.$nextTick(() => {
          this.updateDropdownPosition();
          this.$nextTick(() => this.updateDropdownPosition());
        });
      }
    },
    select(item) {
      this.$emit("update:modelValue", item[this.valueKey]);
      this.$emit("change", item[this.valueKey]);
      this.open = false;
    },
    clear() {
      this.$emit("update:modelValue", null);
      this.$emit("change", null);
      this.open = false;
    },
    handleClickOutside(e) {
      const w = this.$refs.wrapper;
      const dd = this.$refs.dropdown;
      if (!w) return;
      if (w.contains(e.target)) return;
      if (dd && dd.contains(e.target)) return;
      this.open = false;
    },
    handleViewportChange() {
      if (this.open) this.updateDropdownPosition();
    },
  },
  mounted() {
    document.addEventListener("click", this.handleClickOutside, true);
    window.addEventListener("scroll", this.handleViewportChange, true);
    window.addEventListener("resize", this.handleViewportChange);
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleClickOutside, true);
    window.removeEventListener("scroll", this.handleViewportChange, true);
    window.removeEventListener("resize", this.handleViewportChange);
  },
};
</script>
