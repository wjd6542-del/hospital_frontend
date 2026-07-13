<template>
  <div class="login">
    <!-- 좌: 브랜드 패널 -->
    <section class="console">
      <div class="top">
        <div class="logo">
          <span class="logo-mark">HMS</span>
          <span class="logo-cap">HOSPITAL MANAGEMENT</span>
        </div>
      </div>

      <div class="mid">
        <h2 class="headline">{{ $t("병원") }}<br />{{ $t("관리 시스템") }}</h2>
        <p class="lead">{{ $t("인사 · 재무 · 구매 · 재고부터 예약 · 병동 · 청구까지") }}<br />{{ $t("하나의 콘솔에서.") }}</p>
      </div>

      <p class="pfoot">© {{ year }} HMS · Hospital Management System</p>
    </section>

    <!-- 우: 로그인 폼 -->
    <section class="formpane">
      <div class="card">
        <div class="m-brand"><span class="logo-mark sm">HMS</span></div>

        <p class="eyebrow">SYSTEM LOGIN</p>
        <h1 class="title">{{ $t("로그인") }}</h1>
        <p class="hint">{{ $t("관리자 계정으로 로그인하세요.") }}</p>

        <form class="form" @submit.prevent="onSubmit">
          <label class="fld">
            <span class="lbl">{{ $t("아이디") }}</span>
            <div class="inputwrap">
              <i class="fa-solid fa-user ico"></i>
              <input v-model="username" autocomplete="username" :placeholder="$t('아이디를 입력하세요')" @keyup.enter="onSubmit" />
            </div>
          </label>

          <label class="fld">
            <span class="lbl">{{ $t("비밀번호") }}</span>
            <div class="inputwrap">
              <i class="fa-solid fa-lock ico"></i>
              <input v-model="password" :type="show ? 'text' : 'password'" autocomplete="current-password" :placeholder="$t('비밀번호를 입력하세요')" @keyup.enter="onSubmit" />
              <button type="button" class="eye" tabindex="-1" @click="show = !show"><i class="fa-solid" :class="show ? 'fa-eye-slash' : 'fa-eye'"></i></button>
            </div>
          </label>

          <p v-if="error" class="err" role="alert"><i class="fa-solid fa-circle-exclamation"></i> {{ error }}</p>

          <button class="enter" type="submit" :disabled="loading">
            <span v-if="loading"><i class="fa-solid fa-spinner fa-spin"></i> {{ $t("로그인 중…") }}</span>
            <span v-else>{{ $t("로그인") }}</span>
          </button>
        </form>

        <p class="foot">{{ $t("계정이 없으면 관리자에게 문의하세요.") }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "@/api/api";
import { useAuthStore } from "@/stores/auth";

const username = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const show = ref(false);
const year = new Date().getFullYear();
const router = useRouter();
const auth = useAuthStore();

async function onSubmit() {
  if (loading.value) return;
  error.value = "";
  loading.value = true;
  try {
    const { data } = await api.post("/auth/login", { username: username.value, password: password.value });
    auth.login(data);
    router.replace("/");
  } catch (e: any) {
    error.value = e?.message || "아이디 또는 비밀번호를 확인하세요.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login { min-height: 100vh; display: grid; grid-template-columns: 1.1fr 1fr; background: var(--canvas); }

/* ── 좌: 브랜드 패널 ── */
.console {
  position: relative; overflow: hidden;
  display: flex; flex-direction: column; justify-content: space-between;
  padding: 3rem 3rem;
  color: #f8fafc;
  background:
    radial-gradient(60% 45% at 82% 6%, color-mix(in srgb, var(--accent) 40%, transparent), transparent 60%),
    radial-gradient(55% 45% at 6% 100%, color-mix(in srgb, var(--info) 18%, transparent), transparent 60%),
    #0f172a;
  border-right: 1px solid var(--border);
}
.top, .mid, .pfoot { position: relative; z-index: 1; }

.logo { display: flex; align-items: center; gap: 0.8rem; }
.logo-mark {
  display: grid; place-items: center; width: 56px; height: 56px;
  font-size: 1.05rem; font-weight: 700; color: var(--accent-fg);
  background: var(--accent); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md); letter-spacing: 0.01em;
}
.logo-cap { font-size: 0.7rem; letter-spacing: 0.18em; color: rgba(248, 250, 252, 0.6); }

.headline { font-size: clamp(1.7rem, 3.4vw, 2.5rem); line-height: 1.35; color: #ffffff; letter-spacing: -0.01em; }
.lead { margin-top: 1.1rem; font-size: 0.95rem; line-height: 1.7; color: rgba(248, 250, 252, 0.7); }


.pfoot { font-size: 0.66rem; letter-spacing: 0.08em; color: rgba(248, 250, 252, 0.45); }

/* ── 우: 폼 ─────────────────────────── */
.formpane { display: grid; place-items: center; padding: 2.5rem; background: var(--surface); }
.card { width: 100%; max-width: 380px; }
.m-brand { display: none; margin-bottom: 1.4rem; }
.logo-mark.sm { width: 44px; height: 44px; font-size: 0.85rem; box-shadow: var(--shadow-sm); }

.eyebrow { font-size: 0.7rem; letter-spacing: 0.16em; color: var(--accent-hover); }
.title { margin-top: 0.5rem; font-size: 1.7rem; color: var(--text); }
.hint { margin-top: 0.5rem; font-size: 0.88rem; color: var(--text-muted); }

.form { margin-top: 2rem; display: flex; flex-direction: column; gap: 1.05rem; }
.fld { display: block; }
.lbl { display: block; font-size: 0.72rem; color: var(--text); margin-bottom: 0.45rem; }
.inputwrap { position: relative; display: flex; align-items: center; }
.inputwrap .ico { position: absolute; left: 0.85rem; font-size: 0.85rem; color: var(--text-subtle); pointer-events: none; }
.inputwrap input {
  width: 100%; height: 50px; padding: 0 2.6rem; font-size: 0.95rem; color: var(--text);
  background: var(--surface-2); border: 1px solid var(--border-strong); border-radius: var(--radius); outline: none;
  transition: box-shadow 0.12s, background 0.12s, border-color 0.12s;
}
.inputwrap input::placeholder { color: var(--text-subtle); }
.inputwrap input:focus { background: var(--surface); box-shadow: var(--ring); border-color: var(--accent); }
.eye { position: absolute; right: 0.5rem; width: 34px; height: 34px; color: var(--text-subtle); }
.eye:hover { color: var(--text-muted); }

.err { display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; color: var(--danger); font-weight: 700; }

.enter {
  margin-top: 0.4rem; height: 52px; font-size: 0.95rem; font-weight: 600;
  color: var(--accent-fg); background: var(--accent); border: none; border-radius: var(--radius); cursor: pointer;
  box-shadow: var(--shadow-sm); transition: transform 0.08s, box-shadow 0.12s, background 0.12s;
}
.enter:hover { background: var(--accent-hover); box-shadow: var(--shadow-md); }
.enter:active { transform: translateY(1px); }
.enter:disabled { opacity: 0.6; cursor: default; }

.foot { margin-top: 1.6rem; font-size: 0.8rem; color: var(--text-subtle); text-align: center; }

@media (max-width: 860px) {
  .login { grid-template-columns: 1fr; }
  .console { display: none; }
  .m-brand { display: block; }
  .formpane { align-items: flex-start; padding-top: 4rem; }
}
</style>
