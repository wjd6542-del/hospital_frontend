<template>
  <div class="pdetail" v-if="post">
    <header class="phead">
      <router-link :to="`/board/${post.board?.slug}`" class="back"><i class="fa-solid fa-chevron-left"></i> {{ post.board?.name }}</router-link>
      <h1 class="ttl"><span v-if="post.is_notice" class="pin">{{ $t("공지") }}</span>{{ post.title }}</h1>
      <div class="meta">
        <span class="au">{{ post.user?.name || post.user?.username || "-" }}</span>
        <span class="dot">·</span><span>{{ fmt(post.created_at) }}</span>
        <span class="dot">·</span><span>조회 {{ post.view_count }}</span>
        <div class="acts" v-if="canEdit">
          <router-link :to="`/post/${post.id}/edit`" class="btn btn-xs">{{ $t("수정") }}</router-link>
          <button class="btn btn-xs btn-danger" @click="removePost">{{ $t("삭제") }}</button>
        </div>
      </div>
    </header>

    <article class="body prose" v-html="post.content"></article>

    <!-- 이미지 -->
    <div v-if="images.length" class="gallery">
      <a v-for="a in images" :key="a.id" :href="mediaUrl(a.path)" target="_blank" class="gitem">
        <img :src="mediaUrl(a.path)" :alt="a.filename" />
      </a>
    </div>
    <!-- 파일 -->
    <div v-if="files.length" class="files">
      <a v-for="a in files" :key="a.id" :href="mediaUrl(a.path)" target="_blank" class="file">
        <i class="fa-solid fa-paperclip"></i> {{ a.filename }} <span class="sz">{{ kb(a.size) }}</span>
      </a>
    </div>

    <!-- 댓글 -->
    <section v-if="post.board?.allow_comment" class="comments">
      <h2 class="ch">댓글 {{ post.comments.length }}</h2>
      <ul class="clist">
        <li v-for="c in post.comments" :key="c.id" class="citem">
          <div class="cinfo">
            <span class="cau">{{ c.user?.name || c.user?.username || "-" }}</span>
            <span class="ctime">{{ fmt(c.created_at) }}</span>
            <button v-if="canDeleteComment(c)" class="cdel" @click="removeComment(c.id)">{{ $t("삭제") }}</button>
          </div>
          <p class="ctxt">{{ c.content }}</p>
        </li>
        <li v-if="!post.comments.length" class="cempty">{{ $t("첫 댓글을 남겨보세요.") }}</li>
      </ul>
      <div class="cwrite">
        <textarea v-model="newComment" rows="2" :placeholder="$t('댓글을 입력하세요')" @keydown.meta.enter="addComment"></textarea>
        <button class="btn btn-primary csend" @click="addComment">{{ $t("등록") }}</button>
      </div>
    </section>
  </div>
  <div v-else-if="error" class="err">{{ error }}</div>
  <div v-else class="loading">{{ $t("불러오는 중…") }}</div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useAuthStore } from "@/stores/auth";
import { alertStore } from "@/plugins/alert.store";
import { boardApi, mediaUrl } from "@/api/board";
import { formatDateDotMinute as fmt } from "@/utils/date";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const auth = useAuthStore();
const post = ref(null);
const error = ref("");
const newComment = ref("");

const images = computed(() => (post.value?.attachments || []).filter((a) => a.is_image));
const files = computed(() => (post.value?.attachments || []).filter((a) => !a.is_image));
const canEdit = computed(() => post.value && auth.user && (post.value.user_id === auth.user.id || auth.user.is_super));
function canDeleteComment(c) { return auth.user && (c.user_id === auth.user.id || auth.user.is_super); }

function kb(n) { return n ? `${Math.round(n / 1024)}KB` : ""; }

async function load(id) {
  post.value = null; error.value = "";
  try { post.value = await boardApi.postGet(Number(id)); }
  catch (e) { error.value = e?.message || "게시글을 불러오지 못했습니다."; }
}
async function addComment() {
  if (!newComment.value.trim()) return;
  try {
    const c = await boardApi.commentAdd(post.value.id, newComment.value.trim());
    post.value.comments.push(c);
    newComment.value = "";
  } catch (e) { toast.error(e?.message || "댓글 등록 실패"); }
}
async function removeComment(id) {
  try { await boardApi.commentDelete(id); post.value.comments = post.value.comments.filter((c) => c.id !== id); }
  catch (e) { toast.error(e?.message || "삭제 실패"); }
}
async function removePost() {
  const ok = await alertStore.openConfirm("이 게시글을 삭제할까요?", "게시글 삭제", "danger");
  if (!ok) return;
  try {
    const slug = post.value.board?.slug;
    await boardApi.postDelete(post.value.id);
    toast.success("삭제되었습니다.");
    router.replace(slug ? `/board/${slug}` : "/board");
  } catch (e) { toast.error(e?.message || "삭제 실패"); }
}
onMounted(() => load(route.params.id));
watch(() => route.params.id, (id) => { if (id) load(id); });
</script>

<style scoped>
.pdetail { max-width: 80%; margin: 0; }
.back { font-size: 0.78rem; color: var(--text-muted); text-decoration: none; }
.back:hover { color: var(--accent); }
.ttl { font-size: 1.5rem; font-weight: 700; color: var(--text); margin-top: 0.4rem; }
.pin { font-size: 0.7rem; color: var(--accent); background: var(--accent-soft); padding: 0.1rem 0.45rem; border-radius: var(--radius); margin-right: 0.5rem; vertical-align: middle; }
.meta { display: flex; align-items: center; gap: 0.4rem; margin-top: 0.6rem; font-size: 0.8rem; color: var(--text-muted); padding-bottom: 0.9rem; border-bottom: 1px solid var(--border); }
.meta .au { font-weight: 700; color: var(--text-muted); }
.meta .dot { color: var(--border-strong); }
.acts { margin-left: auto; display: flex; gap: 0.35rem; }
.body { padding: 1.4rem 0; font-size: 0.98rem; line-height: 1.75; color: var(--text); min-height: 80px; }
.prose :deep(h2) { font-size: 1.3rem; font-weight: 700; margin: 1rem 0 0.4rem; color: var(--text); }
.prose :deep(p) { margin: 0.5rem 0; }
.prose :deep(blockquote) { border-left: 3px solid var(--accent); margin: 0.6rem 0; padding: 0.3rem 1rem; color: var(--text-muted); background: var(--surface-2); border-radius: 0 8px 8px 0; }
.prose :deep(ul), .prose :deep(ol) { padding-left: 1.5rem; margin: 0.5rem 0; }
.prose :deep(a) { color: var(--accent); text-decoration: underline; }
.prose :deep(img) { max-width: 100%; border-radius: var(--radius); margin: 0.5rem 0; }
.prose :deep(table) { border-collapse: collapse; width: 100%; margin: 0.6rem 0; }
.prose :deep(td), .prose :deep(th) { border: 1px solid var(--border-strong); padding: 6px 8px; min-width: 40px; }

.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.6rem; margin-bottom: 1rem; }
.gitem { display: block; border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border-strong); }
.gitem img { width: 100%; height: 150px; object-fit: cover; display: block; }
.files { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1.2rem; }
.file { font-size: 0.85rem; color: var(--text-muted); text-decoration: none; padding: 0.5rem 0.7rem; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius); }
.file:hover { background: var(--surface-2); }
.file .sz { color: var(--text-subtle); font-size: 0.75rem; margin-left: 0.3rem; }

.comments { margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 1.2rem; }
.ch { font-weight: 700; color: var(--text); margin-bottom: 0.9rem; }
.clist { display: flex; flex-direction: column; gap: 0.9rem; margin-bottom: 1.1rem; }
.citem { background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius); padding: 0.7rem 0.85rem; }
.cinfo { display: flex; align-items: center; gap: 0.5rem; font-size: 0.78rem; }
.cau { font-weight: 700; color: var(--text); }
.ctime { color: var(--text-subtle); }
.cdel { margin-left: auto; font-size: 0.72rem; color: var(--danger); }
.ctxt { margin-top: 0.35rem; font-size: 0.9rem; color: var(--text); white-space: pre-wrap; }
.cempty { color: var(--text-subtle); font-size: 0.85rem; }
.cwrite { display: flex; gap: 0.5rem; }
.cwrite textarea { flex: 1; padding: 0.6rem 0.7rem; font-size: 0.9rem; border: 1px solid var(--border-strong); border-radius: var(--radius); outline: none; resize: vertical; background: var(--surface); }
.cwrite textarea:focus { border-color: var(--accent); box-shadow: var(--ring); }
.csend { flex-shrink: 0; height: auto; }
.err { color: var(--danger); text-align: center; padding: 2rem; }
.loading { color: var(--text-muted); text-align: center; padding: 2rem; }
</style>
