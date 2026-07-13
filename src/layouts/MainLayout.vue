<template>
  <div class="shell">
    <div v-if="isMobile && open" class="backdrop" @click="open = false"></div>
    <AppSidebar :open="open" :is-mobile="isMobile" @close="open = false" />
    <div class="body">
      <AppHeader @toggle="open = !open" />
      <main class="content">
        <div class="content-inner">
          <router-view v-slot="{ Component, route }">
            <transition name="page" mode="out-in">
              <component :is="Component" :key="route.path" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, watch } from "vue";
import { useMediaQuery } from "@vueuse/core";
import AppSidebar from "@/components/layout/AppSidebar.vue";
import AppHeader from "@/components/layout/AppHeader.vue";

const isMobile = useMediaQuery("(max-width: 860px)");
const open = ref(!isMobile.value);

// 모바일 전환 시 사이드바 자동 접기/펼치기
watch(isMobile, (m) => {
  open.value = !m;
});
</script>

<style scoped>
.shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.content {
  flex: 1;
  overflow: auto;
  /* 한지 질감: 따뜻한 종이색 + 결(섬유)·얼룩을 옅게 겹쳐 */
  background-color: var(--canvas);
  background-image:
    radial-gradient(120% 80% at 12% 0%, rgba(255, 252, 244, 0.55) 0%, transparent 45%),
    radial-gradient(100% 90% at 100% 100%, rgba(200, 176, 128, 0.14) 0%, transparent 50%),
    repeating-linear-gradient(97deg, rgba(120, 92, 42, 0.028) 0 2px, transparent 2px 6px),
    repeating-linear-gradient(3deg, rgba(120, 92, 42, 0.022) 0 1px, transparent 1px 5px);
}
.content-inner {
  padding: 1.5rem;
  min-height: 100%;
}
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 55;
  background: rgba(20, 16, 13, 0.45);
}
</style>

<!-- 페이지 전환 트랜지션 (전역: 라우팅 컴포넌트 루트에 적용되므로 scoped 불가) -->
<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.18s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }
  .page-enter-from,
  .page-leave-to {
    opacity: 1;
    transform: none;
  }
}
</style>
