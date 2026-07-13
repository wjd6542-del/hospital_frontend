<template>
  <div class="settings">
    <header class="phead">
      <h1 class="ttl">{{ $t("환경설정") }}</h1>
    </header>

    <div class="tabs" role="tablist">
      <button
        v-for="t in visibleTabs"
        :key="t.key"
        class="tab"
        :class="{ on: active === t.key }"
        role="tab"
        @click="active = t.key"
      >
        <i class="fa-solid" :class="t.icon"></i>
        <span>{{ t.label }}</span>
      </button>
    </div>

    <div class="panel">
      <p v-if="activeTab?.desc" class="pdesc">{{ activeTab.desc }}</p>
      <component :is="activeTab.comp" v-if="activeTab?.comp" />
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, markRaw } from "vue";
import BoardSettings from "@/pages/settings/BoardSettings.vue";
import FaqCategorySettings from "@/pages/settings/FaqCategorySettings.vue";
import TagSettings from "@/pages/settings/TagSettings.vue";
import LangPackSettings from "@/pages/settings/LangPackSettings.vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const tabs = [
  { key: "board", label: "게시판", icon: "fa-clipboard-list", superOnly: true, comp: markRaw(BoardSettings), desc: "게시판을 만들고 권한(읽기/쓰기)·댓글·첨부 허용을 설정합니다." },
  { key: "faqcat", label: "FAQ 분류", icon: "fa-tags", perm: "faq.view", comp: markRaw(FaqCategorySettings), desc: "자주 하는 질문의 분류를 등록·관리합니다. FAQ 작성 시 이 분류를 선택합니다." },
  { key: "tag", label: "태그", icon: "fa-tag", perm: "faq.view", comp: markRaw(TagSettings), desc: "FAQ에 붙이는 공통 태그를 등록·관리합니다. 검색 중 없으면 즉시 만들 수도 있습니다." },
  { key: "lang", label: "다국어", icon: "fa-language", superOnly: true, comp: markRaw(LangPackSettings), desc: "화면 문구의 다국어 번역팩을 등록·관리합니다. 한국어를 키로 사용합니다." },
];
function allowed(t) {
  if (t.superOnly) return !!auth.user?.is_super;
  if (!t.perm) return true;
  const codes = Array.isArray(t.perm) ? t.perm : [t.perm];
  return codes.some((c) => auth.hasPermission(c));
}
const visibleTabs = computed(() => tabs.filter((t) => allowed(t)));

const active = ref(visibleTabs.value[0]?.key || "board");
const activeTab = computed(() => visibleTabs.value.find((t) => t.key === active.value) || visibleTabs.value[0]);
</script>

<style scoped>
.settings { max-width: 1000px; margin: 0 auto; }
.phead { margin-bottom: 1.1rem; }
.eyebrow { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.2em; color: var(--accent); text-transform: uppercase; }
.ttl { font-size: 1.5rem; font-weight: 800; color: var(--text); margin-top: 0.25rem; }

.tabs { display: flex; gap: 0.35rem; border-bottom: 2px solid var(--border); margin-bottom: 1.25rem; flex-wrap: wrap; }
.tab { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.6rem 1rem; margin-bottom: -2px; border-bottom: 2px solid transparent; font-size: 0.9rem; font-weight: 600; color: var(--text-muted); transition: color 0.15s, border-color 0.15s; }
.tab:hover { color: var(--text); }
.tab.on { color: var(--accent); border-bottom-color: var(--accent); font-weight: 700; }
.tab i { font-size: 0.85rem; }
.pdesc { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; }
</style>
