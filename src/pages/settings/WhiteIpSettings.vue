<template>
  <div class="page">
    <header class="phead">
      <div>
        <h1 class="ttl">{{ $t("화이트 아이피") }}</h1>
        <p class="desc">{{ $t("계정별 접근 허용 IP를 관리합니다. IP 제한을 켜면 허용 IP에서만 로그인·접근할 수 있어요. (슈퍼관리자는 제외)") }}</p>
      </div>
      <button class="btn" @click="load"><i class="fa-solid fa-rotate-right"></i> {{ $t("새로고침") }}</button>
    </header>

    <div class="split">
      <!-- 좌측: 계정 선택 -->
      <aside class="pane pcard left">
        <div class="l-head">
          <input v-model="kw" class="field field-xs" :placeholder="$t('아이디 또는 이름 검색')" />
        </div>
        <div class="l-body">
          <div v-if="!filtered.length" class="l-empty"><EmptyState icon="🛡️" :title="$t('계정이 없어요')" desc="" compact /></div>
          <button
            v-for="u in filtered" :key="u.id"
            class="acct-row" :class="{ on: selected?.id === u.id, dim: u.is_super }"
            @click="select(u)"
          >
            <div class="ar-main">
              <span class="ar-nm">{{ u.username }}<span v-if="u.is_super" class="superchip">{{ $t("슈퍼") }}</span></span>
              <span class="ar-sub">{{ u.name }} · {{ u.role_name || u.role?.name || "-" }}</span>
            </div>
            <span v-if="!u.is_super" class="ar-badge" :class="u.ip_restrict ? 'on' : 'off'">
              {{ u.ip_restrict ? $t("사용") : $t("미사용") }}<em v-if="u.ip_restrict"> · {{ u.ip_count ?? 0 }}</em>
            </span>
          </button>
        </div>
      </aside>

      <!-- 우측: IP 등록/목록 -->
      <section class="pane pcard right">
        <div v-if="!selected" class="r-empty">
          <EmptyState variant="select" :desc="$t('좌측에서 계정을 선택하면 허용 IP를 등록·확인할 수 있어요.')" />
        </div>
        <div v-else-if="selected.is_super" class="r-empty">
          <EmptyState icon="👑" :title="$t('슈퍼관리자')" :desc="$t('슈퍼관리자는 IP 제한을 적용받지 않습니다.')" compact />
        </div>
        <template v-else>
          <div class="r-head">
            <div class="r-title">
              <span class="r-eye">{{ $t("화이트 아이피") }}</span>
              <h3 class="r-name">{{ selected.username }} · {{ selected.name }}</h3>
            </div>
            <button class="btn btn-primary" :disabled="saving" @click="save">{{ saving ? $t("저장 중…") : $t("저장") }}</button>
          </div>

          <div class="r-body">
            <label class="iptoggle">
              <span class="lbl"><i class="fa-solid fa-shield-halved"></i> {{ $t("IP 접근 제한") }}</span>
              <BaseToggle v-model="ipRestrict" />
              <span class="sh">{{ ipRestrict ? $t("사용 · 허용 IP만 접근") : $t("미사용") }}</span>
            </label>

            <div class="iplist">
              <div class="iphead">
                <span class="iplbl">{{ $t("허용 IP 목록") }} <b>{{ rows.length }}</b></span>
                <button class="btn btn-xs" @click="addRow"><i class="fa-solid fa-plus"></i> {{ $t("IP 추가") }}</button>
              </div>
              <div v-if="!rows.length" class="ipnone">{{ ipRestrict ? $t("등록된 IP가 없어요. 추가하지 않으면 이 계정은 접근이 차단됩니다.") : $t("IP 제한을 켜고 허용 IP를 추가하세요.") }}</div>
              <div v-for="(r, i) in rows" :key="r._k" class="iprow">
                <input v-model="r.ip" class="ipin" placeholder="203.0.113.5" />
                <input v-model="r.memo" class="ipin memo" :placeholder="$t('메모(회사/재택 등)')" />
                <BaseToggle v-model="r.is_active" :title="$t('활성')" />
                <button class="ipdel" @click="removeRow(i)"><i class="fa-solid fa-xmark"></i></button>
              </div>
              <p class="iphint">{{ $t("저장 후 다음 로그인부터 적용됩니다.") }}</p>
            </div>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import BaseToggle from "@/components/base/BaseToggle.vue";
import { ref, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import EmptyState from "@/components/base/EmptyState.vue";
import { adminApi } from "@/api/admin";

const toast = useToast();
const users = ref([]);
const kw = ref("");
const selected = ref(null);
const ipRestrict = ref(false);
const rows = ref([]);
const removedIds = ref([]);
const saving = ref(false);
let seq = 0;

const filtered = computed(() => {
  const k = kw.value.trim().toLowerCase();
  if (!k) return users.value;
  return users.value.filter((u) => (u.username || "").toLowerCase().includes(k) || (u.name || "").toLowerCase().includes(k));
});

async function load() {
  const list = await adminApi.userList({});
  users.value = list || [];
  await Promise.all(
    users.value.filter((u) => !u.is_super).map(async (u) => {
      try { u.ip_count = (await adminApi.ipList(u.id))?.length ?? 0; } catch (e) { u.ip_count = 0; }
    }),
  );
  // 선택 유지
  if (selected.value) {
    const again = users.value.find((x) => x.id === selected.value.id);
    selected.value = again || null;
  }
}

async function select(u) {
  selected.value = u;
  if (u.is_super) return;
  ipRestrict.value = !!u.ip_restrict;
  removedIds.value = [];
  rows.value = [];
  try {
    const list = await adminApi.ipList(u.id);
    rows.value = (list || []).map((r) => ({ _k: `r${r.id}`, id: r.id, ip: r.ip, memo: r.memo || "", is_active: !!r.is_active }));
  } catch (e) { rows.value = []; }
}
function addRow() { rows.value.push({ _k: `n${seq++}`, id: null, ip: "", memo: "", is_active: true }); }
function removeRow(i) { const r = rows.value[i]; if (r?.id) removedIds.value.push(r.id); rows.value.splice(i, 1); }

async function save() {
  if (!selected.value || selected.value.is_super) return;
  saving.value = true;
  try {
    const uid = selected.value.id;
    await adminApi.ipToggle(uid, ipRestrict.value);
    if (removedIds.value.length) await adminApi.ipBatchDelete(uid, removedIds.value.map((id) => ({ id })));
    const toSave = rows.value.filter((r) => r.ip.trim()).map((r) => ({ ...(r.id ? { id: r.id } : {}), ip: r.ip.trim(), memo: r.memo || null, is_active: r.is_active }));
    if (toSave.length) await adminApi.ipBatchSave(uid, toSave);
    toast.success("저장되었습니다.");
    await load();
  } catch (e) { toast.error(e?.message || "저장 실패"); }
  finally { saving.value = false; }
}

onMounted(load);
</script>

<style scoped>
.page { max-width: 80%; margin: 0; }
.phead { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-bottom: 1.1rem; }
.ttl { font-size: 1.3rem; color: var(--text); }
.desc { font-size: 0.82rem; color: var(--text-muted); margin-top: 0.3rem; max-width: 660px; }

.split { display: grid; grid-template-columns: 320px 1fr; gap: 1rem; align-items: stretch; min-height: 460px; }
@media (max-width: 820px) { .split { grid-template-columns: 1fr; } }
.pane { display: flex; flex-direction: column; overflow: hidden; }
.pane.left { padding: 0; }
.pane.right { padding: 0; }

.l-head { padding: 0.6rem; border-bottom: 1px solid var(--border); }
.l-head .field { width: 100%; }
.l-body { flex: 1; overflow-y: auto; padding: 0.4rem; display: flex; flex-direction: column; gap: 3px; }
.l-empty { padding: 1rem; }
.acct-row { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.5rem 0.6rem; border-radius: var(--radius); border: 1px solid transparent; text-align: left; background: transparent; transition: background 0.1s; }
.acct-row:hover { background: var(--surface-2); }
.acct-row.on { background: var(--accent-soft); border-color: var(--accent); }
.acct-row.dim { opacity: 0.6; }
.ar-main { display: flex; flex-direction: column; min-width: 0; }
.ar-nm { font-weight: 700; color: var(--text); font-size: 0.88rem; display: flex; align-items: center; gap: 0.3rem; }
.ar-sub { font-size: 0.72rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.superchip { font-size: 0.56rem; font-weight: 700; color: var(--warning); background: var(--warning-soft); border: 1px solid var(--border-strong); border-radius: var(--radius); padding: 0.02rem 0.28rem; }
.ar-badge { flex-shrink: 0; font-size: 0.58rem; padding: 0.12rem 0.36rem; border-radius: var(--radius); border: 1px solid var(--border-strong); }
.ar-badge em { font-style: normal; }
.ar-badge.on { color: var(--accent-fg); background: var(--positive); }
.ar-badge.off { color: var(--text-muted); background: var(--surface-2); }

.r-empty { flex: 1; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
.r-head { display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; min-height: 58px; box-sizing: border-box; padding: 0.5rem 0.9rem; border-bottom: 1px solid var(--border); }
.r-title { display: flex; flex-direction: column; line-height: 1.15; }
.r-eye { font-size: 0.6rem; color: var(--accent-hover); }
.r-name { font-size: 1rem; color: var(--text); }
.r-body { flex: 1; overflow-y: auto; padding: 1rem; }

.iptoggle { display: flex; align-items: center; gap: 0.6rem; padding: 0.7rem 0.8rem; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 1rem; }
.iptoggle .lbl { font-size: 0.82rem; font-weight: 700; color: var(--text); display: inline-flex; align-items: center; gap: 0.4rem; }
.iptoggle .lbl i { color: var(--accent); }
.sh { font-size: 0.78rem; color: var(--text-muted); margin-left: auto; }
.sw { flex-shrink: 0; width: 44px; height: 24px; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border-strong); position: relative; cursor: pointer; transition: background 0.18s; }
.sw.on { background: var(--positive); }
.sw .knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border-strong); transition: transform 0.18s; }
.sw.on .knob { transform: translateX(20px); }
.sw.sm { width: 38px; height: 22px; }
.sw.sm .knob { width: 14px; height: 14px; }
.sw.sm.on .knob { transform: translateX(16px); }

.iphead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem; }
.iplbl { font-size: 0.74rem; color: var(--text); }
.iplbl b { color: var(--accent); }
.ipnone { padding: 0.9rem; text-align: center; font-size: 0.8rem; color: var(--text-subtle); background: var(--surface-2); border: 2px dashed var(--border-strong); border-radius: var(--radius); }
.iprow { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
.ipin { height: 34px; padding: 0 0.6rem; font-size: 0.85rem; border: 1px solid var(--border-strong); border-radius: var(--radius); outline: none; background: var(--surface); color: var(--text); width: 160px; flex-shrink: 0; }
.ipin.memo { flex: 1; width: auto; }
.ipin:focus { border-color: var(--accent); box-shadow: var(--ring); }
.ipdel { width: 34px; height: 34px; flex-shrink: 0; border: 1px solid var(--border-strong); border-radius: var(--radius); color: var(--danger); background: var(--surface); box-shadow: var(--shadow-sm); }
.iphint { margin-top: 0.7rem; font-size: 0.74rem; color: var(--text-subtle); }
</style>
