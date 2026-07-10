<template>
  <RootLayout />
  <BaseModal />
  <AlertModal
    :visible="alertStore.visible"
    :title="alertStore.title"
    :message="alertStore.message"
    :type="alertStore.type"
    :variant="alertStore.variant"
    @ok="alertStore.ok"
    @cancel="alertStore.cancel"
  />
</template>

<script setup lang="ts">
// @ts-nocheck
import RootLayout from "@/layouts/RootLayout.vue";
import BaseModal from "@/components/base/BaseModal.vue";
import AlertModal from "@/components/base/AlertModal.vue";
import { alertStore } from "@/plugins/alert.store";
import { onBeforeMount, onMounted, watch, getCurrentInstance } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useI18nStore } from "@/stores/i18n";
import { useThemeStore } from "@/stores/theme";

const auth = useAuthStore();
const i18n = useI18nStore();
const theme = useThemeStore();
onBeforeMount(() => { auth.restore(); theme.init(); });

// 전역 $t 등록 (한국어 키 → 현재 언어)
const instance = getCurrentInstance();
if (instance) instance.appContext.config.globalProperties.$t = (key: string) => i18n.t(key);

// i18n 초기화: 저장된 언어 복원 + 번역팩 로드
onMounted(() => {
  i18n.initLocale();
  i18n.loadLangPacks();
});
// 로그인되면 번역팩 재로드(권한/세션 반영)
watch(() => auth.token, (t) => { if (t) i18n.loadLangPacks(); });
</script>
