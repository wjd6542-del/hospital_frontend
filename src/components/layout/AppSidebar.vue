<template>
  <aside class="side" :class="{ open, mobile: isMobile, closed: !open }">
    <div class="scan" aria-hidden="true"></div>
    <div class="brand">
      <div class="mark" aria-hidden="true">CS</div>
      <div v-if="open" class="word">
        <span class="ko">CS</span>
        <span class="sub">Customer Service</span>
      </div>
    </div>

    <nav class="menu">
      <template v-for="m in visibleMenus" :key="m.label">
        <RouterLink
          v-if="m.to"
          :to="m.to"
          class="item"
          :class="{ on: isActive(m) }"
          :title="m.label"
          @click="isMobile && emit('close')"
        >
          <i class="fa-solid ic" :class="m.icon"></i>
          <span v-if="open" class="lbl">{{ $t(m.label) }}</span>
        </RouterLink>

        <template v-else>
          <div class="item group" :class="{ on: groupActive(m) }" :title="m.label" @click="toggle(m)">
            <i class="fa-solid ic" :class="m.icon"></i>
            <span v-if="open" class="lbl">{{ $t(m.label) }}</span>
            <i v-if="open" class="fa-solid fa-chevron-down chev" :class="{ up: expanded[m.label] }"></i>
          </div>
          <div v-if="open && expanded[m.label]" class="children">
            <RouterLink
              v-for="c in m.children"
              :key="c.to"
              :to="c.to"
              class="child"
              :class="{ on: isActive(c) }"
              @click="isMobile && emit('close')"
            >
              <span class="dot"></span>{{ $t(c.label) }}
            </RouterLink>
            <div v-if="!m.children.length" class="child empty">{{ $t("항목 없음") }}</div>
          </div>
        </template>
      </template>
    </nav>

    <div v-if="open" class="foot">v0.1 · READY ▮</div>
  </aside>
</template>

<script setup lang="ts">
// @ts-nocheck
import { reactive, computed, onMounted, watch, ref } from "vue";
import { useRoute } from "vue-router";
import { boardApi } from "@/api/board";
import { useAuthStore } from "@/stores/auth";

defineProps({ open: { type: Boolean, default: true }, isMobile: { type: Boolean, default: false } });
const emit = defineEmits(["close"]);

const route = useRoute();
const auth = useAuthStore();
const boards = ref([]);
const expanded = reactive({ 게시판: false });

const menus = computed(() => [
  { label: "대시보드", to: "/", icon: "fa-gauge-high", exact: true },
  { label: "게시판", icon: "fa-clipboard-list", perm: "board.view", children: boards.value.map((b) => ({ label: b.name, to: `/board/${b.slug}` })) },
  { label: "자주 하는 질문", to: "/faq", icon: "fa-circle-question", perm: "faq.view" },
  {
    label: "계정 관리",
    icon: "fa-users-gear",
    children: [
      { label: "계정 권한", to: "/account/roles", perm: ["usermanager.view", "permission.user.view"] },
      { label: "화이트 아이피", to: "/account/whiteip", perm: "usermanager.view" },
    ],
  },
  { label: "환경설정", to: "/settings", icon: "fa-gear", perm: ["permission.menu.view"] },
]);

// 권한 필터: perm(문자열/배열) 중 하나라도 보유해야 노출 (super는 항상 통과, perm 없으면 공개)
function allowed(perm) {
  if (!perm) return true;
  const codes = Array.isArray(perm) ? perm : [perm];
  return codes.some((c) => auth.hasPermission(c));
}
const visibleMenus = computed(() =>
  menus.value
    .map((m) => {
      if (m.children) {
        if (m.perm && !allowed(m.perm)) return null;       // 그룹 자체 권한(게시판 등)
        const kids = m.children.filter((c) => allowed(c.perm));
        if (!kids.length && !m.perm) return null;           // 보이는 하위 없음
        return { ...m, children: kids };
      }
      return allowed(m.perm) ? m : null;
    })
    .filter(Boolean),
);

function isActive(m) {
  if (m.exact) return route.path === m.to;
  return route.path === m.to || route.path.startsWith(m.to + "/");
}
function groupActive(m) { return (m.children || []).some((c) => isActive(c)); }
function toggle(m) { expanded[m.label] = !expanded[m.label]; }

async function load() {
  try { boards.value = await boardApi.list(); } catch (e) { boards.value = []; }
}
onMounted(load);
watch(() => route.path, (p) => { if (p.startsWith("/board") || p.startsWith("/post")) expanded.게시판 = true; }, { immediate: true });
</script>

<style scoped>
.side { position: relative; width: 236px; flex-shrink: 0; height: 100vh; position: sticky; top: 0; display: flex; flex-direction: column; color: #d7d9e8; background: #16182a; border-right: 3px solid var(--line-hard); transition: width 0.2s ease, transform 0.2s ease; overflow: hidden; }
.side.closed { width: 72px; }
.scan { position: absolute; inset: 0; pointer-events: none; opacity: 0.35; background-image: repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0 2px, transparent 2px 4px); }

.brand { position: relative; z-index: 1; height: 64px; display: flex; align-items: center; gap: 0.7rem; padding: 0 1rem; border-bottom: 2px solid rgba(122, 92, 255, 0.25); }
.mark { flex-shrink: 0; width: 40px; height: 40px; display: grid; place-items: center; font-family: var(--font-pixel); font-weight: 700; font-size: 1rem; color: #fff; background: var(--seal); border: 2px solid #0d0e1a; box-shadow: 3px 3px 0 #0d0e1a; letter-spacing: 0.02em; }
.word { display: flex; flex-direction: column; line-height: 1.15; overflow: hidden; }
.word .ko { font-family: var(--font-pixel); font-size: 1.1rem; color: #fff; letter-spacing: 0.04em; }
.word .sub { font-family: var(--font-pixel); font-size: 0.58rem; color: #8b90b8; letter-spacing: 0.1em; }

.menu { position: relative; z-index: 1; flex: 1; padding: 0.75rem 0.6rem; display: flex; flex-direction: column; gap: 3px; overflow-y: auto; }
.item { display: flex; align-items: center; gap: 0.7rem; padding: 0.55rem 0.7rem; color: rgba(215, 217, 232, 0.72); font-size: 0.86rem; font-weight: 600; text-decoration: none; position: relative; transition: background 0.12s, color 0.12s; cursor: pointer; border: 2px solid transparent; border-radius: 3px; }
.closed .item { justify-content: center; }
.item .ic { width: 20px; text-align: center; font-size: 0.95rem; color: rgba(154, 159, 187, 0.8); transition: color 0.12s; }
.item:hover { background: rgba(122, 92, 255, 0.12); color: #fff; }
.item:hover .ic { color: #c3b7ff; }
.item.on { background: rgba(122, 92, 255, 0.2); color: #fff; border-color: var(--seal); box-shadow: 2px 2px 0 #0d0e1a; }
.item.on .ic { color: #c3b7ff; }
.chev { margin-left: auto; font-size: 0.62rem; opacity: 0.5; transition: transform 0.2s; }
.chev.up { transform: rotate(180deg); }

.children { display: flex; flex-direction: column; gap: 1px; margin: 2px 0 4px 0.85rem; padding-left: 0.55rem; border-left: 2px solid rgba(122, 92, 255, 0.22); }
.child { display: flex; align-items: center; gap: 0.5rem; padding: 0.42rem 0.6rem; border-radius: 3px; font-size: 0.82rem; color: rgba(215, 217, 232, 0.6); text-decoration: none; transition: background 0.12s, color 0.12s; }
.child .dot { width: 5px; height: 5px; background: rgba(154, 159, 187, 0.6); }
.child:hover { background: rgba(122, 92, 255, 0.1); color: #fff; }
.child.on { color: #fff; }
.child.on .dot { background: var(--seal); }
.child.empty { color: rgba(154, 159, 187, 0.35); cursor: default; }

.foot { position: relative; z-index: 1; padding: 0.8rem 1rem; font-family: var(--font-pixel); font-size: 0.62rem; letter-spacing: 0.08em; color: rgba(154, 159, 187, 0.5); border-top: 2px solid rgba(122, 92, 255, 0.18); }
.side.mobile { position: fixed; left: 0; top: 0; z-index: 60; box-shadow: 6px 0 0 rgba(13, 14, 26, 0.4); }
.side.mobile.closed { transform: translateX(-100%); width: 236px; }
</style>
