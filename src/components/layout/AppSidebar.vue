<template>
  <aside class="side" :class="{ open, mobile: isMobile, closed: !open }">
    <div class="brand">
      <div class="mark" aria-hidden="true">HMS</div>
      <div v-if="open" class="word">
        <span class="ko">병원 관리</span>
        <span class="sub">Hospital Management</span>
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

    <div v-if="open" class="foot">v0.1</div>
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
const expanded = reactive({ 인사: true, 게시판: false });

const menus = computed(() => [
  { label: "대시보드", to: "/", icon: "fa-gauge-high", exact: true },
  {
    label: "인사",
    icon: "fa-hospital-user",
    children: [
      { label: "부서 관리", to: "/hr/department", perm: "department.view" },
      { label: "직원 관리", to: "/hr/employee", perm: "hr.view" },
      { label: "근무표", to: "/hr/schedule", perm: "attendance.view" },
      { label: "출퇴근", to: "/hr/attendance", perm: "attendance.view" },
      { label: "휴가 관리", to: "/hr/leave", perm: "leave.view" },
      { label: "연차 부여", to: "/hr/leave-grant", perm: "leave.view" },
    ],
  },
  {
    label: "진료",
    icon: "fa-stethoscope",
    children: [
      { label: "환자 관리", to: "/emr/patients", perm: "patient.view" },
      { label: "진료", to: "/emr/encounters", perm: "emr.view" },
    ],
  },
  {
    label: "재무",
    icon: "fa-won-sign",
    children: [
      { label: "대시보드", to: "/finance/dashboard", perm: "finance.view" },
      { label: "수입·지출 내역", to: "/finance/transactions", perm: "finance.view" },
      { label: "예산 관리", to: "/finance/budget", perm: "finance.view" },
      { label: "기간 비교", to: "/finance/report", perm: "finance.view" },
    ],
  },
  {
    label: "구매",
    icon: "fa-cart-shopping",
    children: [
      { label: "발주 관리", to: "/purchase/orders", perm: "purchase.view" },
      { label: "거래처", to: "/purchase/vendors", perm: "purchase.view" },
    ],
  },
  {
    label: "재고",
    icon: "fa-boxes-stacked",
    children: [
      { label: "품목·현재고", to: "/inventory/items", perm: "inventory.view" },
      { label: "입출고", to: "/inventory/movements", perm: "inventory.view" },
    ],
  },
  { label: "자산", to: "/assets", icon: "fa-heart-pulse", perm: "asset.view" },
  { label: "시설", to: "/facility/maintenance", icon: "fa-screwdriver-wrench", perm: "facility.view" },
  { label: "예약", to: "/reservation/appointments", icon: "fa-calendar-check", perm: "reservation.view" },
  { label: "병동", to: "/ward/admissions", icon: "fa-bed-pulse", perm: "ward.view" },
  { label: "보험청구", to: "/insurance/claims", icon: "fa-file-invoice-dollar", perm: "insurance.view" },
  { label: "통계", to: "/stats", icon: "fa-chart-line", perm: "stats.view" },
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
.side { position: relative; width: 236px; flex-shrink: 0; height: 100vh; position: sticky; top: 0; display: flex; flex-direction: column; color: var(--text-muted); background: var(--surface); border-right: 1px solid var(--border); transition: width 0.2s ease, transform 0.2s ease; overflow: hidden; }
.side.closed { width: 72px; }

.brand { position: relative; z-index: 1; height: 64px; display: flex; align-items: center; gap: 0.7rem; padding: 0 1rem; border-bottom: 1px solid var(--border); }
.mark { flex-shrink: 0; width: 40px; height: 40px; display: grid; place-items: center; font-weight: 700; font-size: 0.82rem; color: var(--accent-fg); background: var(--accent); border-radius: var(--radius); letter-spacing: 0.01em; }
.word { display: flex; flex-direction: column; line-height: 1.15; overflow: hidden; }
.word .ko { font-size: 0.98rem; font-weight: 600; color: var(--text); letter-spacing: -0.01em; }
.word .sub { font-size: 0.58rem; color: var(--text-subtle); letter-spacing: 0.1em; }

.menu { position: relative; z-index: 1; flex: 1; padding: 0.75rem 0.6rem; display: flex; flex-direction: column; gap: 3px; overflow-y: auto; }
.item { display: flex; align-items: center; gap: 0.7rem; padding: 0.55rem 0.7rem; color: var(--text-muted); font-size: 0.86rem; font-weight: 500; text-decoration: none; position: relative; transition: background 0.12s, color 0.12s; cursor: pointer; border-radius: var(--radius); }
.closed .item { justify-content: center; }
.item .ic { width: 20px; text-align: center; font-size: 0.95rem; color: var(--text-subtle); transition: color 0.12s; }
.item:hover { background: var(--surface-2); color: var(--text); }
.item:hover .ic { color: var(--text-muted); }
.item.on { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
.item.on .ic { color: var(--accent); }
/* 활성 표시 레일 — 밀도 높은 화면에서 "지금 여기"를 한눈에 */
.item.on::before { content: ""; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 18px; border-radius: 0 2px 2px 0; background: var(--accent); }
.closed .item.on::before { left: -0.6rem; }
.chev { margin-left: auto; font-size: 0.62rem; opacity: 0.5; transition: transform 0.2s; }
.chev.up { transform: rotate(180deg); }

.children { display: flex; flex-direction: column; gap: 1px; margin: 2px 0 4px 0.85rem; padding-left: 0.55rem; border-left: 1px solid var(--border); }
.child { display: flex; align-items: center; gap: 0.5rem; padding: 0.42rem 0.6rem; border-radius: var(--radius); font-size: 0.82rem; color: var(--text-subtle); text-decoration: none; transition: background 0.12s, color 0.12s; }
.child .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--border-strong); }
.child:hover { background: var(--surface-2); color: var(--text); }
.child.on { color: var(--accent); font-weight: 700; }
.child.on .dot { background: var(--accent); }
.child.empty { color: var(--text-subtle); opacity: 0.6; cursor: default; }

.foot { position: relative; z-index: 1; padding: 0.8rem 1rem; font-size: 0.62rem; letter-spacing: 0.08em; color: var(--text-subtle); border-top: 1px solid var(--border); }
.side.mobile { position: fixed; left: 0; top: 0; z-index: 60; box-shadow: var(--shadow-lg); }
.side.mobile.closed { transform: translateX(-100%); width: 236px; }
</style>
