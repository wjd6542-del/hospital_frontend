<template>
  <div class="account">
    <div class="subtabs">
      <button class="st" :class="{ on: sub === 'user' }" @click="sub = 'user'"><i class="fa-solid fa-user"></i> {{ $t("계정") }}</button>
      <button class="st" :class="{ on: sub === 'role' }" @click="sub = 'role'"><i class="fa-solid fa-user-shield"></i> {{ $t("역할·권한") }}</button>
    </div>
    <UserAdmin v-if="sub === 'user'" />
    <RoleAdmin v-else />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref } from "vue";
import UserAdmin from "@/pages/settings/UserAdmin.vue";
import RoleAdmin from "@/pages/settings/RoleAdmin.vue";

const sub = ref("user");
</script>

<style scoped>
.account { max-width: 940px; margin: 0 auto; }
.subtabs { display: flex; gap: 0.4rem; margin-bottom: 1.1rem; }
.st {
  display: inline-flex; align-items: center; gap: 0.4rem;
  height: 34px; padding: 0 0.9rem; border-radius: 3px;
  font-size: 0.85rem; font-weight: 600; color: var(--text);
  background: var(--surface-2); border: 2px solid var(--border-strong);
}
.st:hover { background: var(--canvas); }
.st.on { color: var(--accent-fg); background: var(--accent); border-color: var(--accent-hover); }
</style>
