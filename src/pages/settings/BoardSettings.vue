<template>
  <div>
    <div class="head">
      <h3 class="h">{{ $t("게시판") }} <span class="c">{{ boards.length }}</span></h3>
      <button class="btn btn-primary" @click="openNew"><i class="fa-solid fa-plus"></i> {{ $t("게시판 추가") }}</button>
    </div>

    <p class="hint">{{ $t("↑↓ 버튼으로 게시판 노출 순서를 바꿀 수 있습니다. 사이드 메뉴에도 이 순서로 표시됩니다.") }}</p>
    <ul class="list">
      <li v-for="(b, i) in boards" :key="b.id" class="row">
        <div class="order">
          <button class="ord" :disabled="i === 0 || reordering" :title="$t('위로')" @click="move(i, -1)"><i class="fa-solid fa-chevron-up"></i></button>
          <button class="ord" :disabled="i === boards.length - 1 || reordering" :title="$t('아래로')" @click="move(i, 1)"><i class="fa-solid fa-chevron-down"></i></button>
        </div>
        <div class="rinfo">
          <span class="bn">{{ b.name }}</span>
          <code class="slug">/{{ b.slug }}</code>
          <span v-if="!b.is_active" class="off">{{ $t("비활성") }}</span>
        </div>
        <div class="rtags">
          <span class="tag">읽기 {{ lv(b.read_level) }}</span>
          <span class="tag">쓰기 {{ lv(b.write_level) }}</span>
          <span v-if="b.allow_comment" class="tag on">{{ $t("댓글") }}</span>
          <span v-if="b.allow_upload" class="tag on">{{ $t("첨부") }}</span>
        </div>
        <div class="acts">
          <button class="btn btn-xs" @click="openEdit(b)">{{ $t("수정") }}</button>
          <button class="btn btn-xs btn-danger" @click="del(b)">{{ $t("삭제") }}</button>
        </div>
      </li>
      <li v-if="!boards.length"><EmptyState variant="board" :title="$t('게시판이 없습니다')" :desc="$t('게시판을 만들면 여기에 표시됩니다.')" compact /></li>
    </ul>

    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel">
        <h4 class="ph">{{ editing ? "게시판 수정" : "게시판 추가" }}</h4>
        <div class="grid">
          <BaseInput v-model="form.name" :label="$t('게시판명')" />
          <BaseInput v-model="form.slug" :label="$t('슬러그(영문)')" :disabled="editing" :placeholder="$t('예: notice')" />
          <div class="col2"><BaseInput v-model="form.description" :label="$t('설명')" /></div>
          <div class="fld">
            <label class="lbl">{{ $t("읽기 권한") }}</label>
            <SearchSelect v-model="form.read_level" :options="levelOpts" />
          </div>
          <div class="fld">
            <label class="lbl">{{ $t("쓰기 권한") }}</label>
            <SearchSelect v-model="form.write_level" :options="levelOpts" />
          </div>
          <label class="chk"><input type="checkbox" v-model="form.allow_comment" /> {{ $t("댓글 허용") }}</label>
          <label class="chk"><input type="checkbox" v-model="form.allow_upload" /> {{ $t("파일·이미지 첨부 허용") }}</label>
          <label class="chk"><input type="checkbox" v-model="form.is_active" /> {{ $t("활성") }}</label>
        </div>
        <p v-if="msg" class="msg err">{{ msg }}</p>
        <div class="pacts">
          <button class="btn btn-primary" :disabled="saving" @click="submit">{{ saving ? "저장 중…" : "저장" }}</button>
          <button class="btn" @click="showForm = false">{{ $t("취소") }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import EmptyState from "@/components/base/EmptyState.vue";
import { ref, reactive, onMounted } from "vue";
import { useToast } from "vue-toastification";
import BaseInput from "@/components/base/BaseInput.vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import { boardApi } from "@/api/board";

const toast = useToast();
const boards = ref([]);
const levelOpts = [
  { value: "ALL", label: "전체" },
  { value: "MEMBER", label: "회원" },
  { value: "ADMIN", label: "관리자" },
];
function lv(l) { return l === "ADMIN" ? "관리자" : l === "MEMBER" ? "회원" : "전체"; }

const showForm = ref(false);
const editing = ref(false);
const saving = ref(false);
const reordering = ref(false);
const msg = ref("");
const form = reactive({ id: null, name: "", slug: "", description: "", read_level: "ALL", write_level: "MEMBER", allow_comment: true, allow_upload: true, sort: 0, is_active: true });

function toBody(b) {
  return { id: b.id, name: b.name, slug: b.slug, description: b.description || "", read_level: b.read_level, write_level: b.write_level, allow_comment: b.allow_comment, allow_upload: b.allow_upload, sort: b.sort ?? 0, is_active: b.is_active };
}

async function load() { boards.value = await boardApi.listAll(); }
function openNew() {
  editing.value = false;
  Object.assign(form, { id: null, name: "", slug: "", description: "", read_level: "ALL", write_level: "MEMBER", allow_comment: true, allow_upload: true, sort: boards.value.length, is_active: true });
  msg.value = ""; showForm.value = true;
}
function openEdit(b) {
  editing.value = true;
  Object.assign(form, { id: b.id, name: b.name, slug: b.slug, description: b.description || "", read_level: b.read_level, write_level: b.write_level, allow_comment: b.allow_comment, allow_upload: b.allow_upload, sort: b.sort ?? 0, is_active: b.is_active });
  msg.value = ""; showForm.value = true;
}
async function move(idx, dir) {
  const j = idx + dir;
  if (reordering.value || j < 0 || j >= boards.value.length) return;
  reordering.value = true;
  const arr = [...boards.value];
  [arr[idx], arr[j]] = [arr[j], arr[idx]];
  boards.value = arr; // 낙관적 반영
  try {
    // 순서대로 sort 값 재부여 후 변경분만 저장
    await Promise.all(arr.map((b, i) => (b.sort ?? 0) !== i ? boardApi.save({ ...toBody(b), sort: i }) : null).filter(Boolean));
    await load();
  } catch (e) {
    toast.error(e?.message || "순서 변경 실패");
    await load();
  } finally { reordering.value = false; }
}
async function submit() {
  msg.value = ""; saving.value = true;
  try {
    const body = { ...form };
    if (!editing.value) delete body.id;
    await boardApi.save(body);
    toast.success("저장되었습니다.");
    showForm.value = false;
    await load();
  } catch (e) { msg.value = e?.message || "저장 실패"; }
  finally { saving.value = false; }
}
async function del(b) {
  try { await boardApi.remove(b.id); await load(); }
  catch (e) { toast.error(e?.message || "삭제 실패"); }
}
onMounted(load);
</script>

<style scoped>
.head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.9rem; }
.h { font-weight: 700; color: var(--text); }
.c { color: var(--accent); margin-left: 0.25rem; }
.hint { font-size: 0.76rem; color: var(--text-muted); margin-bottom: 0.7rem; }
.list { display: flex; flex-direction: column; gap: 0.5rem; }
.row { display: flex; align-items: center; gap: 0.8rem; padding: 0.8rem 1rem; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius); flex-wrap: wrap; }
.order { display: flex; flex-direction: column; gap: 3px; }
.ord { width: 26px; height: 18px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius); font-size: 0.66rem; color: var(--text); background: var(--surface); border: 1px solid var(--border-strong); box-shadow: var(--shadow-sm); transition: all 0.075s; }
.ord:hover:not(:disabled) { color: var(--accent);  box-shadow: var(--shadow-md); }
.ord:active:not(:disabled) {  box-shadow: var(--shadow-sm); }
.ord:disabled { opacity: 0.35; cursor: default; box-shadow: none; }
.rinfo { display: flex; align-items: center; gap: 0.5rem; }
.bn { font-weight: 700; color: var(--text); }
.slug { font-size: 0.75rem; color: var(--text-subtle); }
.off { font-size: 0.68rem; color: var(--text-subtle); background: var(--border); padding: 0.05rem 0.4rem; border-radius: var(--radius); }
.rtags { display: flex; gap: 0.3rem; flex-wrap: wrap; }
.tag { font-size: 0.68rem; font-weight: 700; color: var(--text-muted); background: var(--border); padding: 0.1rem 0.5rem; border-radius: var(--radius); }
.tag.on { color: var(--accent); background: var(--accent-soft); }
.acts { margin-left: auto; display: flex; gap: 0.35rem; }
.empty { padding: 1.4rem; text-align: center; color: var(--text-subtle); }

.drawer { position: fixed; inset: 0; z-index: 210; background: rgba(20, 16, 13, 0.45); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.panel { width: 480px; max-width: 100%; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius); padding: 1.4rem; }
.ph { font-size: 1.15rem; font-weight: 700; color: var(--text); margin-bottom: 1rem; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
.col2 { grid-column: 1 / -1; }
.fld { display: block; }
.lbl { display: block; font-size: 0.72rem; font-weight: 700; color: var(--text); margin-bottom: 0.4rem; }
.chk { display: flex; align-items: center; gap: 0.5rem; font-size: 0.84rem; font-weight: 600; color: var(--text); cursor: pointer; user-select: none; }
.chk input { appearance: none; -webkit-appearance: none; flex-shrink: 0; width: 18px; height: 18px; border: 1px solid var(--border-strong); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow-sm); cursor: pointer; position: relative; transition: all 0.075s; }
.chk input:checked { background: var(--accent); }
.chk input:checked::after { content: ""; position: absolute; left: 4px; top: 1px; width: 5px; height: 9px; border: solid var(--accent-fg); border-width: 0 2px 2px 0; transform: rotate(45deg); }
.chk input:active {  box-shadow: var(--shadow-sm); }
.msg.err { color: var(--danger); font-size: 0.82rem; margin-top: 0.7rem; font-weight: 600; }
.pacts { display: flex; gap: 0.6rem; margin-top: 1.2rem; }
</style>
