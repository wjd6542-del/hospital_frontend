// @ts-nocheck
import { defineStore } from "pinia";
import { langPackApi } from "@/api/settings";

export type LangCode = "ko" | "en" | "ja" | "zh";
export type LocalizedName = Record<LangCode, string>;

// 지원 언어 (스위처/관리 공통)
export const LANGS: { value: LangCode; label: string; flag: string }[] = [
  { value: "ko", label: "한국어", flag: "🇰🇷" },
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "ja", label: "日本語", flag: "🇯🇵" },
  { value: "zh", label: "中文", flag: "🇨🇳" },
];

export const useI18nStore = defineStore("i18n", {
  state: () => ({
    locale: "ko" as LangCode,
    defaultLocale: "ko" as LangCode,
    // 한국어 텍스트를 키로: { "업체 정산": { ko, en, ja, zh }, ... }
    langPacks: {} as Record<string, LocalizedName>,
    loaded: false,
  }),

  getters: {
    // 한국어 키 → 현재 언어 문자열(없으면 키 그대로)
    t: (state) => (key: string): string => {
      if (state.locale === state.defaultLocale) return key;
      const pack = state.langPacks[key];
      if (!pack) return key;
      return pack[state.locale] || key;
    },
  },

  actions: {
    setLocale(code: LangCode) {
      this.locale = code;
      localStorage.setItem("locale", code);
      document.documentElement.setAttribute("lang", code);
    },
    initLocale() {
      const saved = localStorage.getItem("locale") as LangCode | null;
      if (saved) this.locale = saved;
      document.documentElement.setAttribute("lang", this.locale);
    },
    async loadLangPacks() {
      try {
        const rows = await langPackApi.list({ only_active: true });
        const map: Record<string, LocalizedName> = {};
        (rows || []).forEach((r) => {
          const ko = r.name?.ko;
          if (ko) map[ko] = r.name;
        });
        this.langPacks = map;
        this.loaded = true;
      } catch (e) {
        /* 미로그인/오류 시 무시 (한국어 폴백) */
      }
    },
  },
});
