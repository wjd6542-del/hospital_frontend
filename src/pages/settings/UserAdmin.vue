<template>
  <div class="uadmin">
    <div class="head">
      <h3 class="h">{{ $t("계정") }} <span class="c">{{ users.length }}</span></h3>
      <button class="btn btn-primary" @click="openNew"><i class="fa-solid fa-plus"></i> {{ $t("계정 추가") }}</button>
    </div>

    <div class="tablewrap">
      <table class="tbl">
        <thead>
          <tr><th>{{ $t("아이디") }}</th><th>{{ $t("이름") }}</th><th>{{ $t("역할") }}</th><th class="c">{{ $t("상태") }}</th><th class="c w-act">{{ $t("수정") }}</th></tr>
        </thead>
        <tbody>
          <tr v-if="!users.length"><td colspan="5"><EmptyState icon="fa-user" :title="$t('계정이 없습니다')" :desc="$t('계정을 추가하면 여기에 표시됩니다.')" compact /></td></tr>
          <tr v-for="u in users" :key="u.id">
            <td class="nm">{{ u.username }}</td>
            <td>{{ u.name }}</td>
            <td><span class="rolechip">{{ u.role_name || "-" }}</span></td>
            <td class="c"><span class="st" :class="u.is_active ? 'on' : 'off'">{{ u.is_active ? "활성" : "정지" }}</span></td>
            <td class="c"><button class="btn btn-xs" @click="openEdit(u)">{{ $t("수정") }}</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 폼 -->
    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel">
        <h4 class="ph">{{ editing ? "계정 수정" : "계정 추가" }}</h4>
        <div class="grid">
          <BaseInput v-model="form.username" :label="$t('아이디')" :disabled="editing" :placeholder="$t('영문·숫자')" />
          <BaseInput v-model="form.name" :label="$t('이름')" />
          <div v-if="!editing" class="col2 pwrow">
            <BaseInput v-model="form.password" :label="$t('비밀번호')" type="password" :placeholder="$t('영문+숫자 6자 이상')" />
            <BaseInput v-model="form.passwordConfirm" :label="$t('비밀번호 확인')" type="password" />
          </div>
          <div class="fld">
            <label class="lbl">{{ $t("역할") }}</label>
            <SearchSelect v-model="form.role_id" :options="roleOptions" :placeholder="$t('역할 선택')" />
          </div>
          <div class="fld">
            <label class="lbl">{{ $t("상태") }}</label>
            <div class="tgl-row">
              <BaseToggle v-model="form.is_active" />
              <span class="sh">{{ form.is_active ? "활성" : "정지" }}</span>
            </div>
          </div>
        </div>

        <p v-if="msg" class="msg err">{{ msg }}</p>
        <div class="acts">
          <button class="btn btn-primary" :disabled="saving" @click="submit">{{ saving ? "저장 중…" : "저장" }}</button>
          <button class="btn" @click="showForm = false">{{ $t("취소") }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import BaseToggle from "@/components/base/BaseToggle.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import { ref, reactive, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import BaseInput from "@/components/base/BaseInput.vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import { adminApi } from "@/api/admin";

const toast = useToast();
const users = ref([]);
const roles = ref([]);
const roleOptions = computed(() => roles.value.map((r) => ({ value: r.id, label: r.name })));

const showForm = ref(false);
const editing = ref(false);
const saving = ref(false);
const msg = ref("");
const form = reactive({ id: null, username: "", name: "", role_id: null, is_active: true, password: "", passwordConfirm: "" });

async function load() {
  const [u, r] = await Promise.all([adminApi.userList({}), adminApi.roleAllList()]);
  users.value = u || [];
  roles.value = r || [];
}
function openNew() {
  editing.value = false;
  Object.assign(form, { id: null, username: "", name: "", role_id: roles.value[0]?.id ?? null, is_active: true, password: "", passwordConfirm: "" });
  msg.value = "";
  showForm.value = true;
}
function openEdit(u) {
  editing.value = true;
  Object.assign(form, { id: u.id, username: u.username, name: u.name, role_id: u.role_id, is_active: !!u.is_active, password: "", passwordConfirm: "" });
  msg.value = "";
  showForm.value = true;
}
async function submit() {
  msg.value = "";
  saving.value = true;
  try {
    const role_id = Number(form.role_id);
    if (editing.value) {
      await adminApi.userUpdate({ id: form.id, username: form.username, name: form.name, role_id, is_active: form.is_active });
    } else {
      await adminApi.userCreate({ name: form.name, username: form.username, password: form.password, passwordConfirm: form.passwordConfirm, role_id, is_active: form.is_active });
    }
    toast.success("저장되었습니다.");
    showForm.value = false;
    await load();
  } catch (e) {
    msg.value = e?.message || "저장 실패";
  } finally {
    saving.value = false;
  }
}
onMounted(load);
</script>

<style scoped>
.head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem; }
.h { font-weight: 700; color: var(--text); }
.c { color: var(--accent); margin-left: 0.25rem; }

.tablewrap { border: 1px solid var(--border-strong); border-radius: var(--radius); overflow: hidden; background: var(--surface); }
.tbl { width: 100%; border-collapse: collapse; }
.tbl th { text-align: left; padding: 0.6rem 0.8rem; background: var(--surface-2); border-bottom: 1px solid var(--border-strong); font-weight: 700; font-size: 0.8rem; color: var(--text-muted); }
.tbl td { padding: 0.55rem 0.8rem; border-bottom: 1px solid var(--border); font-size: 0.88rem; color: var(--text); }
.tbl tbody tr:last-child td { border-bottom: none; }
.c { text-align: center; }
.w-act { width: 70px; }
.nm { font-weight: 700; color: var(--text); }
.muted { color: var(--text-muted); }
.state { text-align: center; padding: 1.6rem 0; color: var(--text-subtle); }
.rolechip { font-size: 0.74rem; font-weight: 700; color: var(--accent); background: var(--accent-soft); padding: 0.1rem 0.5rem; border-radius: var(--radius); }
.st { font-size: 0.74rem; font-weight: 700; padding: 0.1rem 0.5rem; border-radius: var(--radius); }
.st.on { color: var(--positive); background: var(--positive-soft); }
.st.off { color: var(--text-subtle); background: var(--border); }

.drawer { position: fixed; inset: 0; z-index: 210; background: rgba(20, 16, 13, 0.45); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.panel { width: 460px; max-width: 100%; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius); padding: 1.4rem; box-shadow: var(--shadow-lg); }
.ph { font-size: 1.15rem; font-weight: 700; color: var(--text); margin-bottom: 1rem; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
.fld { display: block; }
.col2 { grid-column: 1 / -1; }
.pwrow { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
.lbl { display: block; font-size: 0.72rem; font-weight: 700; color: var(--text); margin-bottom: 0.4rem; }
.tgl-row { display: flex; align-items: center; gap: 0.6rem; height: 34px; }
.sw { width: 44px; height: 24px; border-radius: var(--radius); background: var(--surface-2); border: 1px solid var(--border-strong); position: relative; cursor: pointer; transition: background 0.18s; }
.sw.on { background: var(--positive); }
.sw .knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border-strong); transition: transform 0.18s; }
.sw.on .knob { transform: translateX(20px); }
.sh { font-size: 0.78rem; color: var(--text-muted); }
.msg { margin-top: 0.8rem; font-size: 0.82rem; font-weight: 600; }
.msg.err { color: var(--danger); }
.acts { display: flex; gap: 0.6rem; margin-top: 1.2rem; }
@media (max-width: 520px) { .grid { grid-template-columns: 1fr; } }
</style>
