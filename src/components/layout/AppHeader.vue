<template>
  <header class="hdr">
    <div class="left">
      <button class="ham" :aria-label="$t('메뉴')" @click="emit('toggle')">
        <i class="fa-solid fa-bars"></i>
      </button>
      <h1 class="ttl">{{ title }}</h1>
    </div>

    <div class="right">
      <!-- 다크모드 토글 -->
      <button class="tmode" :title="theme.dark ? $t('라이트 모드') : $t('다크 모드')" @click="theme.toggle()">
        <i class="fa-solid" :class="theme.dark ? 'fa-sun' : 'fa-moon'"></i>
      </button>

      <!-- 언어 스위처 -->
      <div ref="langWrap" class="lang-wrap">
        <button class="lang-btn" :class="{ on: langOpen }" :title="$t('언어 / Language')" @click="toggleLang">
          <span class="lang-flag">{{ curLang.flag }}</span>
          <span class="lang-code">{{ curLang.value.toUpperCase() }}</span>
          <i class="fa-solid fa-chevron-down lang-chev" :class="{ up: langOpen }"></i>
        </button>
        <div v-if="langOpen" class="dropdown lang-dd">
          <button v-for="l in LANGS" :key="l.value" class="lang-item" :class="{ sel: l.value === i18n.locale }" @click="pickLang(l.value)">
            <span class="lf">{{ l.flag }}</span><span class="ll">{{ l.label }}</span>
            <i v-if="l.value === i18n.locale" class="fa-solid fa-check ck"></i>
          </button>
        </div>
      </div>

      <!-- 계정 드롭다운 -->
      <div ref="acctWrap" class="acct-wrap">
        <button class="acct" :class="{ on: acctOpen }" @click="toggleAcct">
          <div class="who">
            <span class="nm">{{ auth.user?.name || auth.user?.username }}</span>
            <span class="rl">{{ roleLabel }}</span>
          </div>
          <div class="avatar">{{ initial }}</div>
          <i class="fa-solid fa-chevron-down acc-chev" :class="{ up: acctOpen }"></i>
        </button>

        <div v-if="acctOpen" class="dropdown acct-dd">
          <div class="acc-head">
            <div class="avatar sm">{{ initial }}</div>
            <div class="acc-who">
              <div class="acc-name">{{ auth.user?.name || auth.user?.username }}</div>
              <div class="acc-id">@{{ auth.user?.username }} · {{ roleLabel }}</div>
            </div>
          </div>
          <RouterLink to="/mypage" class="acc-item" @click="acctOpen = false"><i class="fa-solid fa-id-card"></i> {{ $t("마이페이지") }}</RouterLink>
          <button class="acc-item danger" @click="onLogout"><i class="fa-solid fa-right-from-bracket"></i> {{ $t("로그아웃") }}</button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useI18nStore, LANGS } from "@/stores/i18n";
import { useThemeStore } from "@/stores/theme";

const emit = defineEmits(["toggle"]);
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const i18n = useI18nStore();
const theme = useThemeStore();

const title = computed(() => i18n.t(route.meta?.title || "CS"));

// 언어 스위처
const langOpen = ref(false);
const langWrap = ref(null);
const curLang = computed(() => LANGS.find((l) => l.value === i18n.locale) || LANGS[0]);
function toggleLang() { langOpen.value = !langOpen.value; acctOpen.value = false; }
function pickLang(code) { i18n.setLocale(code); langOpen.value = false; }
const roleLabel = computed(() => auth.user?.role?.name || (auth.user?.is_super ? "슈퍼관리자" : "회원"));
const initial = computed(() => (auth.user?.name || auth.user?.username || "?").slice(0, 1));

const acctOpen = ref(false);
const acctWrap = ref(null);
function toggleAcct() { acctOpen.value = !acctOpen.value; }
function onOutside(e) {
  if (acctWrap.value && !acctWrap.value.contains(e.target)) acctOpen.value = false;
  if (langWrap.value && !langWrap.value.contains(e.target)) langOpen.value = false;
}

onMounted(() => {
  document.addEventListener("click", onOutside, true);
});
onBeforeUnmount(() => document.removeEventListener("click", onOutside, true));

function onLogout() {
  acctOpen.value = false;
  auth.logout();
  router.replace("/login");
}
</script>

<style scoped>
.hdr {
  height: 64px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
  padding: 0 1rem 0 0.75rem; background: var(--surface); border-bottom: 3px solid var(--line-hard);
}
.left { display: flex; align-items: center; gap: 0.7rem; min-width: 0; }
.ham { width: 36px; height: 36px; border: 2px solid var(--line-hard); border-radius: 3px; color: var(--ink); background: var(--surface); box-shadow: 2px 2px 0 var(--line-hard); transition: transform 0.08s, box-shadow 0.08s; }
.ham:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--line-hard); }
.ham:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--line-hard); }
.ttl { font-family: var(--font-pixel); font-size: 1.05rem; color: var(--ink); letter-spacing: 0.02em; white-space: nowrap; }

.right { display: flex; align-items: center; gap: 0.7rem; }

/* 다크모드 토글 */
.tmode { width: 40px; height: 40px; border: 2px solid var(--line-hard); border-radius: 3px; background: var(--surface); color: var(--ink); box-shadow: 2px 2px 0 var(--line-hard); transition: transform 0.08s, box-shadow 0.08s; }
.tmode:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--line-hard); color: var(--seal); }

/* 언어 스위처 */
.lang-wrap { position: relative; }
.lang-btn { display: flex; align-items: center; gap: 0.3rem; height: 40px; padding: 0 0.6rem; border: 2px solid var(--line-hard); border-radius: 3px; background: var(--surface); color: var(--ink); box-shadow: 2px 2px 0 var(--line-hard); transition: transform 0.08s, box-shadow 0.08s; }
.lang-btn:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--line-hard); }
.lang-btn.on { border-color: var(--seal); }
.lang-flag { font-size: 1rem; line-height: 1; }
.lang-code { font-family: var(--font-pixel); font-size: 0.66rem; color: var(--ink-muted); }
.lang-chev { font-size: 0.6rem; color: var(--ink-faint); transition: transform 0.2s; }
.lang-chev.up { transform: rotate(180deg); }
.lang-dd { width: 160px; }
.lang-item { width: 100%; display: flex; align-items: center; gap: 0.55rem; padding: 0.55rem 0.8rem; font-size: 0.86rem; font-weight: 600; color: var(--ink); background: var(--surface); border-bottom: 1px solid var(--line); }
.lang-item:last-child { border-bottom: none; }
.lang-item:hover { background: var(--surface-2); }
.lang-item.sel { color: var(--seal-deep); background: #f6f4ff; }
.lang-item .lf { font-size: 1rem; }
.lang-item .ll { flex: 1; text-align: left; }
.lang-item .ck { font-size: 0.72rem; color: var(--seal); }

.dropdown { position: absolute; right: 0; top: calc(100% + 8px); width: 320px; max-width: 84vw; z-index: 80; background: var(--surface); border: 2px solid var(--line-hard); border-radius: 4px; box-shadow: 4px 4px 0 var(--line-hard); overflow: hidden; }
/* 계정 트리거 */
.acct-wrap { position: relative; }
.acct {
  display: flex; align-items: center; gap: 0.6rem; height: 40px; padding: 0 0.5rem 0 0.7rem;
  border: 2px solid var(--line-hard); border-radius: 3px; background: var(--surface);
  box-shadow: 2px 2px 0 var(--line-hard); transition: transform 0.08s, box-shadow 0.08s;
}
.acct:hover, .acct.on { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--line-hard); }
.who { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.15; }
.who .nm { font-size: 0.84rem; font-weight: 700; color: var(--ink); }
.who .rl { font-family: var(--font-pixel); font-size: 0.58rem; letter-spacing: 0.04em; color: var(--seal-deep); }
.avatar {
  width: 34px; height: 34px; display: grid; place-items: center; font-family: var(--font-pixel);
  font-weight: 700; font-size: 0.9rem; color: #fff;
  background: var(--seal); border: 2px solid var(--line-hard); border-radius: 3px;
}
.avatar.sm { width: 40px; height: 40px; font-size: 1rem; box-shadow: 2px 2px 0 var(--line-hard); }
.acc-chev { font-size: 0.62rem; color: var(--ink-faint); transition: transform 0.2s; }
.acc-chev.up { transform: rotate(180deg); }

.acct-dd { width: 240px; }
.acc-head { display: flex; align-items: center; gap: 0.6rem; padding: 0.8rem; background: var(--surface-2); border-bottom: 2px solid var(--line); }
.acc-name { font-family: var(--font-pixel); font-size: 0.85rem; color: var(--ink); }
.acc-id { font-size: 0.72rem; color: var(--ink-muted); margin-top: 0.15rem; }
.acc-item { width: 100%; display: flex; align-items: center; gap: 0.6rem; padding: 0.7rem 0.9rem; font-size: 0.88rem; font-weight: 600; color: var(--ink); text-decoration: none; background: var(--surface); border-bottom: 1px solid var(--line); }
.acc-item:last-child { border-bottom: none; }
.acc-item i { width: 18px; text-align: center; color: var(--ink-muted); }
.acc-item:hover { background: var(--surface-2); color: var(--seal); }
.acc-item:hover i { color: var(--seal); }
.acc-item.danger:hover { color: var(--danger); }
.acc-item.danger:hover i { color: var(--danger); }

@media (max-width: 640px) { .who { display: none; } .acct { padding: 0 0.4rem; } }
</style>
