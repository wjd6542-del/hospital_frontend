<template>
  <div
    ref="wrapper"
    class="relative w-full"
    :style="{ zIndex: open ? 9999 : 1 }"
  >
    <!-- 트리거 -->
    <div :class="triggerClasses" @click="toggle">
      <div class="flex-1 truncate leading-none flex items-center gap-2">
        <span v-if="selectedItem && selectedItem[colorKey]" class="w-3 h-3 rounded-[2px] border border-[color:var(--border-strong)] shrink-0" :style="{ backgroundColor: selectedItem[colorKey] }"></span>
        <span class="truncate">{{ selectedLabel || placeholder }}</span>
      </div>

      <div class="flex items-center gap-1 ml-1.5 h-full">
        <button
          v-if="modelValue !== null && modelValue !== ''"
          @click.stop="clear"
          class="text-[color:var(--text-subtle)] hover:text-[color:var(--accent)] transition-colors flex items-center justify-center text-[10px]"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>

        <i
          class="fa-solid fa-chevron-down transition-transform duration-200 flex items-center justify-center"
          :class="[
            open ? 'rotate-180 text-[color:var(--accent)]' : 'text-[color:var(--text-subtle)]',
            isLargeSize ? 'text-xl' : 'text-[9px]',
          ]"
        ></i>
      </div>
    </div>

    <!-- 드롭다운: body 로 Teleport 하여 부모 overflow 클립 영향 없이 표시 -->
    <Teleport to="body">
      <div
        v-if="open"
        ref="dropdown"
        :style="dropdownStyle"
        class="bg-[color:var(--surface)] border-2 border-[color:var(--border-strong)] rounded-[3px] shadow-[4px_4px_0_var(--border-strong)] overflow-hidden"
      >
        <div class="p-2 bg-[color:var(--surface-2)] border-b-2 border-[color:var(--border-strong)]">
          <input
            ref="searchInput"
            v-model="keyword"
            type="text"
            :placeholder="searchPlaceholder"
            class="w-full h-[30px] px-2 text-xs border-2 border-[color:var(--border-strong)] rounded-[3px] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] focus:border-[color:var(--accent)] bg-[color:var(--surface)]"
          />
        </div>

        <div class="max-h-56 overflow-y-auto">
          <div
            v-for="item in filteredOptions"
            :key="item[valueKey]"
            class="px-3 py-1.5 text-xs hover:bg-[color:var(--surface-2)] cursor-pointer flex justify-between items-center group transition-colors"
            @click="select(item)"
          >
            <span class="text-[color:var(--text)] group-hover:text-[color:var(--accent)] font-medium flex items-center gap-2">
              <span v-if="item[colorKey]" class="w-3 h-3 rounded-[2px] border border-[color:var(--border-strong)] shrink-0" :style="{ backgroundColor: item[colorKey] }"></span>
              {{ item[labelKey] }}
            </span>
            <i
              v-if="item[valueKey] === modelValue"
              class="fa-solid fa-check text-[color:var(--accent)] text-[10px]"
            ></i>
          </div>
          <button
            v-if="canCreate"
            type="button"
            class="w-full px-3 py-2 text-xs text-left text-[color:var(--accent-hover)] bg-[color:var(--accent-soft)] hover:brightness-95 border-t-2 border-[color:var(--border-strong)] flex items-center gap-1.5"
            @click="createItem"
          >
            <i class="fa-solid fa-plus"></i> "<b class="font-[var(--font-sans)]">{{ keyword.trim() }}</b>" 추가
          </button>
          <div
            v-if="filteredOptions.length === 0 && !canCreate"
            class="px-3 py-5 text-[color:var(--text-subtle)] text-center text-xs"
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
export default {
  name: "SearchSelect",
  inheritAttrs: false,
  props: {
    modelValue: [String, Number, null],
    options: { type: Array, required: true },
    labelKey: { type: String, default: "label" },
    valueKey: { type: String, default: "value" },
    placeholder: { type: String, default: "선택하세요" },
    searchPlaceholder: { type: String, default: "검색..." },
    emptyText: { type: String, default: "검색 결과가 없습니다" },
    colorKey: { type: String, default: "color" },
    creatable: { type: Boolean, default: false },
  },
  emits: ["update:modelValue", "change", "create"],
  data() {
    return {
      open: false,
      keyword: "",
      // Teleport 된 드롭다운의 fixed 위치 (트리거 rect 기반)
      dropdownStyle: {
        position: "fixed",
        top: "0px",
        left: "0px",
        width: "0px",
        zIndex: 10000,
      },
    };
  },
  computed: {
    // 현재 선택된 옵션 객체
    selectedItem() {
      return this.options.find((o) => o[this.valueKey] === this.modelValue) || null;
    },
    // 현재 선택된 옵션의 라벨을 반환한다
    selectedLabel() {
      return this.selectedItem ? this.selectedItem[this.labelKey] : "";
    },
    // 키워드로 필터링된 옵션 목록을 반환한다
    filteredOptions() {
      if (!this.keyword) return this.options;
      return this.options.filter((o) =>
        String(o[this.labelKey])
          .toLowerCase()
          .includes(this.keyword.toLowerCase()),
      );
    },
    // creatable 이고 검색어가 기존 옵션과 정확히 일치하지 않으면 추가 가능
    canCreate() {
      const k = this.keyword.trim();
      if (!this.creatable || !k) return false;
      return !this.options.some(
        (o) => String(o[this.labelKey]).toLowerCase() === k.toLowerCase(),
      );
    },
    // 주입된 클래스에 큰 텍스트 크기가 포함됐는지 여부
    isLargeSize() {
      return /text-(xl|2xl|3xl|4xl)/.test(this.$attrs.class || "");
    },
    // 주입된 클래스 유무에 따라 트리거 버튼 클래스를 조립한다
    triggerClasses() {
      const parentClass = this.$attrs.class || "";

      const hasPadding = /p[xy]?-/.test(parentClass);
      const hasHeight = /h-/.test(parentClass);
      const hasBorder = /border/.test(parentClass);
      const hasRounded = /rounded/.test(parentClass);

      const hasText = /text-/.test(parentClass);

      return [
        "flex justify-between items-center cursor-pointer transition-all box-border relative text-[color:var(--text)]",
        // 기본값 세팅 (주입된 클래스가 없을 때만)
        !hasHeight && !hasPadding && "h-[34px] px-2.5",
        !hasPadding && hasHeight && "px-2.5",
        !hasBorder && "border-2 border-[color:var(--border-strong)]",
        !hasRounded && "rounded-[3px]",
        !hasText && "text-xs",
        !hasPadding && !hasHeight && "bg-white",
        // 부모 주입 클래스
        parentClass,
        // 상태값
        this.open
          ? "ring-2 ring-[color:var(--accent)] border-[color:var(--accent)]"
          : "hover:border-[color:var(--accent)]",
      ];
    },
  },
  methods: {
    // 트리거 위치를 기반으로 Teleport 드롭다운 좌표를 갱신한다
    updateDropdownPosition() {
      const el = this.$refs.wrapper;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dd = this.$refs.dropdown;
      const ddHeight = dd ? dd.offsetHeight : 240; // 추정값
      // 화면 하단 공간 부족 시 위로 띄움
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

    // 드롭다운 열림 상태를 토글하고 검색창 포커스를 처리한다
    toggle() {
      this.open = !this.open;
      this.keyword = "";
      if (this.open) {
        this.$nextTick(() => {
          this.updateDropdownPosition();
          // 첫 paint 후 한 번 더 보정 (실제 dropdown height 반영)
          this.$nextTick(() => this.updateDropdownPosition());
          if (this.$refs.searchInput) this.$refs.searchInput.focus();
        });
      }
    },
    // 옵션 선택 시 v-model을 업데이트하고 드롭다운을 닫는다
    select(item) {
      this.$emit("update:modelValue", item[this.valueKey]);
      this.$emit("change", item[this.valueKey]);
      this.open = false;
    },
    // 새 항목 추가: 부모가 create 이벤트를 받아 생성·선택을 처리한다
    createItem() {
      const name = this.keyword.trim();
      if (!name) return;
      this.$emit("create", name);
      this.open = false;
      this.keyword = "";
    },
    // 선택을 해제한다
    clear() {
      this.$emit("update:modelValue", "");
      this.$emit("change", "");
      this.open = false;
    },
    // 컴포넌트 외부 클릭 시 드롭다운을 닫는다 (Teleport 된 dropdown 도 wrapper 외부로 보지 않도록 분기)
    handleClickOutside(e) {
      const w = this.$refs.wrapper;
      const dd = this.$refs.dropdown;
      if (!w) return;
      if (w.contains(e.target)) return;
      if (dd && dd.contains(e.target)) return;
      this.open = false;
    },
    // 스크롤·리사이즈 시 드롭다운이 트리거에서 떨어지지 않도록 동기화
    handleViewportChange() {
      if (this.open) this.updateDropdownPosition();
    },
  },
  // 마운트 시 외부 클릭/스크롤/리사이즈 리스너 등록
  mounted() {
    document.addEventListener("click", this.handleClickOutside, true);
    window.addEventListener("scroll", this.handleViewportChange, true);
    window.addEventListener("resize", this.handleViewportChange);
  },
  // 언마운트 직전 리스너들을 제거한다
  beforeUnmount() {
    document.removeEventListener("click", this.handleClickOutside, true);
    window.removeEventListener("scroll", this.handleViewportChange, true);
    window.removeEventListener("resize", this.handleViewportChange);
  },
};
</script>
