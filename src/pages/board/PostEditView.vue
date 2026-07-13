<template>
  <div class="pedit">
    <header class="phead">
      <h1 class="ttl">{{ isNew ? "글쓰기" : "글 수정" }}</h1>
    </header>

    <form class="card" @submit.prevent="submit">
      <input v-model="form.title" class="title" :placeholder="$t('제목')" />
      <RichEditor v-model="form.content" :upload="!!board?.allow_upload" :placeholder="$t('내용을 입력하세요')" />

      <div v-if="board?.allow_upload" class="uploads">
        <label class="ubtn">
          <i class="fa-solid fa-paperclip"></i> {{ $t("이미지·파일 첨부") }}
          <input type="file" multiple hidden @change="onFiles" />
        </label>
        <span v-if="uploading" class="uprog">{{ $t("업로드 중…") }}</span>
        <div v-if="form.attachments.length" class="ulist">
          <div v-for="(a, i) in form.attachments" :key="i" class="uitem">
            <img v-if="a.is_image" :src="mediaUrl(a.path)" class="uthumb" />
            <i v-else class="fa-solid fa-file"></i>
            <span class="uname">{{ a.filename }}</span>
            <button type="button" class="urm" @click="form.attachments.splice(i, 1)"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
      </div>

      <label v-if="auth.user?.is_super" class="notice-toggle">
        <input type="checkbox" v-model="form.is_notice" /> {{ $t("공지로 고정 (관리자)") }}
      </label>

      <p v-if="msg" class="msg err">{{ msg }}</p>
      <div class="acts">
        <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? "저장 중…" : "등록" }}</button>
        <router-link :to="`/board/${slug}`" class="btn">{{ $t("취소") }}</router-link>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useAuthStore } from "@/stores/auth";
import { boardApi, mediaUrl } from "@/api/board";
import RichEditor from "@/components/base/RichEditor.vue";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const auth = useAuthStore();

const slug = computed(() => route.params.slug);
const editId = computed(() => route.params.id);
const isNew = computed(() => !route.params.id);
const board = ref(null);
const saving = ref(false);
const uploading = ref(false);
const msg = ref("");
const form = reactive({ title: "", content: "", is_notice: false, attachments: [] });

async function loadBoard() {
  if (isNew.value) {
    board.value = await boardApi.get(slug.value);
  } else {
    const p = await boardApi.postGet(Number(editId.value));
    board.value = p.board;
    form.title = p.title;
    form.content = p.content;
    form.is_notice = p.is_notice;
    // 기존 첨부는 유지 표시만(추가 업로드는 신규로 붙음)
  }
}
async function onFiles(e) {
  const files = [...e.target.files];
  if (!files.length) return;
  uploading.value = true;
  try {
    const saved = await boardApi.upload(files);
    form.attachments.push(...saved);
  } catch (err) { toast.error(err?.message || "업로드 실패"); }
  finally { uploading.value = false; e.target.value = ""; }
}
async function submit() {
  msg.value = "";
  if (!form.title.trim()) { msg.value = "제목을 입력하세요."; return; }
  saving.value = true;
  try {
    const body = { board_id: board.value.id, title: form.title, content: form.content, is_notice: form.is_notice, attachments: form.attachments };
    if (!isNew.value) body.id = Number(editId.value);
    const saved = await boardApi.postSave(body);
    toast.success("등록되었습니다.");
    router.replace(`/post/${saved.id}`);
  } catch (e) { msg.value = e?.message || "저장 실패"; }
  finally { saving.value = false; }
}
onMounted(loadBoard);
</script>

<style scoped>
.pedit { max-width: 780px; margin: 0 auto; }
.phead { margin-bottom: 1rem; }
.eyebrow { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.15em; color: var(--accent); }
.ttl { font-family: var(--font-sans); font-size: 1.5rem; font-weight: 700; color: var(--text); margin-top: 0.2rem; }
.card { background: var(--surface); border: 2px solid var(--border-strong); border-radius: 4px; padding: 1.3rem; display: flex; flex-direction: column; gap: 1rem; }
.title { height: 46px; padding: 0 0.9rem; font-size: 1.05rem; font-weight: 700; color: var(--text); border: 2px solid var(--border-strong); border-radius: 3px; outline: none; background: var(--surface); }
.title:focus { border-color: var(--accent); box-shadow: var(--ring); }
.content { padding: 0.8rem 0.9rem; font-size: 0.95rem; line-height: 1.7; color: var(--text); border: 2px solid var(--border-strong); border-radius: 3px; outline: none; resize: vertical; background: var(--surface); }
.content:focus { border-color: var(--accent); box-shadow: var(--ring); }

.uploads { border-top: 1px dashed var(--border); padding-top: 1rem; }
.ubtn { display: inline-flex; align-items: center; gap: 0.4rem; height: 34px; padding: 0 0.9rem; border-radius: 3px; font-family: var(--font-sans); font-size: 0.76rem; font-weight: 600; color: var(--text); background: var(--surface); border: 2px solid var(--border-strong); box-shadow: 2px 2px 0 var(--border-strong); cursor: pointer; transition: all 0.075s; }
.ubtn:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--border-strong); }
.ubtn:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--border-strong); }
.uprog { margin-left: 0.6rem; font-size: 0.8rem; color: var(--accent); }
.ulist { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 0.8rem; }
.uitem { display: flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.5rem; background: var(--surface); border: 2px solid var(--border-strong); border-radius: 3px; font-size: 0.78rem; color: var(--text-muted); }
.uthumb { width: 34px; height: 34px; object-fit: cover; border-radius: 3px; }
.uname { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.urm { color: var(--text-subtle); }
.urm:hover { color: var(--accent); }

.notice-toggle { display: flex; align-items: center; gap: 0.5rem; font-size: 0.86rem; font-weight: 600; color: var(--text); cursor: pointer; user-select: none; }
.notice-toggle input { appearance: none; -webkit-appearance: none; flex-shrink: 0; width: 18px; height: 18px; border: 2px solid var(--border-strong); border-radius: 3px; background: var(--surface); box-shadow: 2px 2px 0 var(--border-strong); cursor: pointer; position: relative; transition: all 0.075s; }
.notice-toggle input:checked { background: var(--accent); }
.notice-toggle input:checked::after { content: ""; position: absolute; left: 4px; top: 1px; width: 5px; height: 9px; border: solid var(--accent-fg); border-width: 0 2px 2px 0; transform: rotate(45deg); }
.notice-toggle input:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--border-strong); }
.msg.err { color: var(--danger); font-size: 0.85rem; font-weight: 600; }
.acts { display: flex; gap: 0.6rem; }
</style>
