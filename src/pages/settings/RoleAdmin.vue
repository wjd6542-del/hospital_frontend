<template>
  <div class="radmin">
    <div class="cols">
      <!-- 역할 목록 -->
      <div class="rolelist">
        <div class="rl-head">
          <h3 class="h">{{ $t("역할") }}</h3>
          <button class="btn btn-primary btn-xs" @click="openNewRole"><i class="fa-solid fa-plus"></i> {{ $t("역할") }}</button>
        </div>
        <ul class="rl">
          <li
            v-for="r in roles"
            :key="r.id"
            class="ritem"
            :class="{ on: sel?.id === r.id }"
            @click="select(r)"
          >
            <span class="rname">{{ r.name }}</span>
            <span v-if="r.is_super" class="super">{{ $t("전체") }}</span>
          </li>
        </ul>
      </div>

      <!-- 권한 할당 -->
      <div class="perm">
        <template v-if="sel">
          <div class="p-head">
            <div>
              <h3 class="h">{{ sel.name }} <span v-if="sel.is_super" class="super">{{ $t("슈퍼") }}</span></h3>
              <p class="pdesc">{{ sel.description || "권한을 선택해 저장하세요." }}</p>
            </div>
            <button v-if="!sel.is_super" class="btn btn-primary" :disabled="saving" @click="savePerms">{{ saving ? "저장 중…" : "권한 저장" }}</button>
          </div>

          <p v-if="sel.is_super" class="supernote">{{ $t("슈퍼관리자는 모든 권한을 자동으로 가집니다.") }}</p>
          <div v-else class="groups">
            <div v-for="(perms, g) in grouped" :key="g" class="group">
              <div class="gtitle">{{ g }}</div>
              <label v-for="p in perms" :key="p.id" class="pcheck">
                <input type="checkbox" :value="p.id" v-model="checked" />
                <span>{{ p.name }}</span>
                <code>{{ p.code }}</code>
              </label>
            </div>
          </div>
        </template>
        <div v-else class="empty">{{ $t("역할을 선택하세요.") }}</div>
      </div>
    </div>

    <!-- 새 역할 -->
    <div v-if="showRole" class="drawer" @click.self="showRole = false">
      <div class="panel">
        <h4 class="ph">{{ $t("새 역할") }}</h4>
        <BaseInput v-model="newRole.name" :label="$t('역할 이름')" :placeholder="$t('예: 편집위원')" />
        <div style="margin-top:0.8rem"><BaseInput v-model="newRole.description" :label="$t('설명')" /></div>
        <p v-if="rmsg" class="msg err">{{ rmsg }}</p>
        <div class="acts">
          <button class="btn btn-primary" @click="createRole">{{ $t("저장") }}</button>
          <button class="btn" @click="showRole = false">{{ $t("취소") }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import BaseInput from "@/components/base/BaseInput.vue";
import { adminApi } from "@/api/admin";

const toast = useToast();
const roles = ref([]);
const permissions = ref([]);
const sel = ref(null);
const checked = ref([]);
const saving = ref(false);

const showRole = ref(false);
const newRole = reactive({ name: "", description: "" });
const rmsg = ref("");

const grouped = computed(() => {
  const g = {};
  for (const p of permissions.value) {
    (g[p.group || "기타"] ||= []).push(p);
  }
  return g;
});

async function load() {
  const [rl, pl] = await Promise.all([adminApi.roleList(), adminApi.permissionList()]);
  roles.value = rl || [];
  permissions.value = pl || [];
}
function select(r) {
  sel.value = r;
  // role.permissions = RolePermission[] (permission_id)
  checked.value = (r.permissions || []).map((rp) => rp.permission_id);
}
async function savePerms() {
  if (!sel.value) return;
  saving.value = true;
  try {
    await adminApi.rolePermissionSave(sel.value.id, checked.value.map(Number));
    toast.success("권한이 저장되었습니다.");
    await load();
    const again = roles.value.find((x) => x.id === sel.value.id);
    if (again) select(again);
  } catch (e) {
    toast.error(e?.message || "저장 실패");
  } finally {
    saving.value = false;
  }
}
function openNewRole() { newRole.name = ""; newRole.description = ""; rmsg.value = ""; showRole.value = true; }
async function createRole() {
  if (!newRole.name.trim()) { rmsg.value = "역할 이름을 입력하세요."; return; }
  try {
    await adminApi.roleSave({ name: newRole.name.trim(), description: newRole.description.trim() });
    showRole.value = false;
    await load();
  } catch (e) { rmsg.value = e?.message || "저장 실패"; }
}
onMounted(load);
</script>

<style scoped>
.cols { display: grid; grid-template-columns: 220px 1fr; gap: 1rem; }
@media (max-width: 640px) { .cols { grid-template-columns: 1fr; } }
.h { font-family: var(--font-sans); font-weight: 700; color: var(--text); }

.rolelist { background: var(--surface); border: 2px solid var(--border-strong); border-radius: 4px; padding: 0.8rem; height: max-content; }
.rl-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem; }
.rl { display: flex; flex-direction: column; gap: 2px; }
.ritem { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.6rem; border-radius: 3px; cursor: pointer; transition: background 0.14s; }
.ritem:hover { background: var(--surface-2); }
.ritem.on { background: var(--accent-soft); }
.rname { font-weight: 600; color: var(--text); font-size: 0.9rem; }
.super { font-size: 0.64rem; font-weight: 700; color: var(--accent); background: var(--accent-soft); padding: 0.05rem 0.35rem; border-radius: 3px; }

.perm { background: var(--surface); border: 2px solid var(--border-strong); border-radius: 4px; padding: 1.1rem; min-height: 240px; }
.p-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.pdesc { font-size: 0.82rem; color: var(--text-muted); margin-top: 0.2rem; }
.supernote { color: var(--text-muted); font-size: 0.88rem; }
.groups { display: flex; flex-direction: column; gap: 1.1rem; }
.gtitle { font-family: var(--font-sans); font-weight: 700; font-size: 0.85rem; color: var(--accent); margin-bottom: 0.4rem; padding-bottom: 0.3rem; border-bottom: 1px dashed var(--border); }
.pcheck { display: flex; align-items: center; gap: 0.55rem; padding: 0.3rem 0; font-size: 0.88rem; color: var(--text); cursor: pointer; user-select: none; }
.pcheck input { appearance: none; -webkit-appearance: none; flex-shrink: 0; width: 18px; height: 18px; border: 2px solid var(--border-strong); border-radius: 3px; background: var(--surface); box-shadow: 2px 2px 0 var(--border-strong); cursor: pointer; position: relative; transition: all 0.075s; }
.pcheck input:checked { background: var(--accent); }
.pcheck input:checked::after { content: ""; position: absolute; left: 4px; top: 1px; width: 5px; height: 9px; border: solid var(--accent-fg); border-width: 0 2px 2px 0; transform: rotate(45deg); }
.pcheck input:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--border-strong); }
.pcheck code { margin-left: auto; font-size: 0.72rem; color: var(--text-subtle); }
.empty { color: var(--text-subtle); font-size: 0.9rem; padding: 2rem 0; text-align: center; }

.drawer { position: fixed; inset: 0; z-index: 210; background: rgba(20, 16, 13, 0.45); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.panel { width: 400px; max-width: 100%; background: var(--surface); border: 2px solid var(--border-strong); border-radius: 4px; padding: 1.4rem; }
.ph { font-family: var(--font-sans); font-size: 1.1rem; font-weight: 700; color: var(--text); margin-bottom: 1rem; }
.msg { margin-top: 0.7rem; font-size: 0.82rem; font-weight: 600; }
.msg.err { color: var(--danger); }
.acts { display: flex; gap: 0.6rem; margin-top: 1.1rem; }
</style>
