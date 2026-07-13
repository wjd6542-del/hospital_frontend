<template>
  <div class="mypage">
    <header class="phead">
      <h1 class="ttl">{{ $t("마이페이지") }}</h1>
    </header>

    <div class="grid">
      <!-- 좌: 프로필 + 권한 -->
      <div class="col">
        <section class="pcard profile">
          <div class="ptop">
            <div class="avatar">{{ initial }}</div>
            <div class="pmeta">
              <div class="pname">{{ auth.user?.name || auth.user?.username }}</div>
              <div class="pid">@{{ auth.user?.username }}</div>
              <span class="rolechip">{{ roleLabel }}</span>
            </div>
          </div>
          <dl class="pdl">
            <dt>{{ $t("아이디") }}</dt><dd>{{ auth.user?.username }}</dd>
            <dt>{{ $t("이름") }}</dt><dd>{{ auth.user?.name || "-" }}</dd>
            <dt>{{ $t("이메일") }}</dt><dd>{{ auth.user?.email || "-" }}</dd>
          </dl>
        </section>

        <section class="pcard perms">
          <h2 class="ch"><i class="fa-solid fa-user-shield"></i> {{ $t("내 권한") }}</h2>
          <div v-if="auth.user?.is_super" class="superbadge">{{ $t("👑 전체 권한 (슈퍼관리자)") }}</div>
          <div v-else-if="auth.user?.permissions?.length" class="chips">
            <span v-for="p in auth.user.permissions" :key="p" class="pchip">{{ p }}</span>
          </div>
          <div v-else class="noperm">{{ $t("부여된 권한이 없어요. 관리자에게 문의하세요.") }}</div>
        </section>
      </div>

      <!-- 우: 비밀번호 변경 -->
      <section class="pcard">
        <h2 class="ch"><i class="fa-solid fa-key"></i> {{ $t("비밀번호 변경") }}</h2>
        <form class="pwform" @submit.prevent="changePw">
          <label class="fld"><span class="lbl">{{ $t("현재 비밀번호") }}</span>
            <input v-model="pw.old_password" type="password" autocomplete="current-password" :placeholder="$t('현재 비밀번호')" />
          </label>
          <label class="fld"><span class="lbl">{{ $t("새 비밀번호") }}</span>
            <input v-model="pw.new_password" type="password" autocomplete="new-password" :placeholder="$t('영문+숫자 6자 이상')" />
          </label>
          <label class="fld"><span class="lbl">{{ $t("새 비밀번호 확인") }}</span>
            <input v-model="pw.new_confirm_password" type="password" autocomplete="new-password" :placeholder="$t('새 비밀번호 재입력')" />
          </label>
          <p v-if="msg" class="msg" :class="msgErr ? 'err' : 'ok'"><i class="fa-solid" :class="msgErr ? 'fa-circle-exclamation' : 'fa-circle-check'"></i> {{ msg }}</p>
          <button class="btn btn-primary save" type="submit" :disabled="saving">{{ saving ? "변경 중…" : "비밀번호 변경" }}</button>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { reactive, ref, computed } from "vue";
import api from "@/api/api";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const roleLabel = computed(() => auth.user?.role?.name || (auth.user?.is_super ? "슈퍼관리자" : "회원"));
const initial = computed(() => (auth.user?.name || auth.user?.username || "?").slice(0, 1));

const pw = reactive({ old_password: "", new_password: "", new_confirm_password: "" });
const msg = ref("");
const msgErr = ref(false);
const saving = ref(false);

async function changePw() {
  msg.value = "";
  msgErr.value = false;
  if (pw.new_password !== pw.new_confirm_password) {
    msg.value = "새 비밀번호가 일치하지 않습니다.";
    msgErr.value = true;
    return;
  }
  saving.value = true;
  try {
    await api.post("/auth/changePassword", { ...pw });
    msg.value = "비밀번호가 변경되었습니다.";
    pw.old_password = pw.new_password = pw.new_confirm_password = "";
  } catch (e) {
    msg.value = e?.message || "변경에 실패했습니다.";
    msgErr.value = true;
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.mypage { max-width: 900px; margin: 0 auto; }
.phead { margin-bottom: 1.25rem; }
.eyebrow { font-size: 0.66rem; letter-spacing: 0.18em; color: var(--accent); }
.ttl { font-size: 1.4rem; color: var(--text); margin-top: 0.25rem; }

.grid { display: grid; grid-template-columns: 1fr 1.15fr; gap: 1rem; align-items: start; }
@media (max-width: 760px) { .grid { grid-template-columns: 1fr; } }
.col { display: flex; flex-direction: column; gap: 1rem; }

.pcard { background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius); box-shadow: var(--shadow-sm); padding: 1.25rem; }

.profile .ptop { display: flex; align-items: center; gap: 0.9rem; }
.avatar {
  width: 64px; height: 64px; flex-shrink: 0; display: grid; place-items: center;
  border-radius: var(--radius); border: 1px solid var(--border-strong); box-shadow: var(--shadow-md);
  font-weight: 700; font-size: 1.7rem; color: var(--accent-fg);
  background: linear-gradient(145deg, color-mix(in srgb, var(--accent) 70%, white), var(--accent) 55%, var(--accent-hover));
}
.pname { font-size: 1.05rem; color: var(--text); }
.pid { font-size: 0.82rem; color: var(--text-muted); margin-top: 0.15rem; }
.rolechip { display: inline-block; margin-top: 0.5rem; padding: 0.12rem 0.5rem; border-radius: var(--radius); font-size: 0.64rem; color: var(--accent-hover); background: var(--accent-soft); border: 1px solid var(--border-strong); }
.pdl { display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1rem; font-size: 0.85rem; border-top: 1px solid var(--border); padding-top: 1rem; margin-top: 1rem; }
.pdl dt { color: var(--text-muted); font-weight: 600; }
.pdl dd { color: var(--text); word-break: break-word; }

.ch { font-size: 0.95rem; color: var(--text); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.45rem; }
.ch i { color: var(--accent); font-size: 0.85rem; }
.superbadge { font-size: 0.8rem; color: var(--accent-hover); background: var(--accent-soft); border: 1px solid var(--border-strong); border-radius: var(--radius); box-shadow: var(--shadow-sm); padding: 0.6rem 0.8rem; text-align: center; }
.chips { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.pchip { font-size: 0.64rem; color: var(--text); background: var(--surface-2); border: 1px solid var(--border-strong); border-radius: var(--radius); padding: 0.15rem 0.45rem; }
.noperm { font-size: 0.85rem; color: var(--text-subtle); text-align: center; padding: 0.8rem 0; }

.pwform { display: flex; flex-direction: column; gap: 0.85rem; }
.fld .lbl { display: block; font-size: 0.66rem; color: var(--text); margin-bottom: 0.4rem; }
.fld input {
  width: 100%; height: 42px; padding: 0 0.8rem; font-size: 0.9rem; color: var(--text);
  background: var(--surface-2); border: 1px solid var(--border-strong); border-radius: var(--radius); outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.fld input:focus { border-color: var(--accent); background: var(--surface); box-shadow: var(--ring); }
.msg { display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; font-weight: 700; }
.msg.ok { color: var(--positive); } .msg.err { color: var(--danger); }
.save { margin-top: 0.2rem; height: 44px; font-size: 0.92rem; box-shadow: var(--shadow-md); }
</style>
