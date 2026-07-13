<template>
  <div class="page">
    <header class="phead">
      <div>
        <h1 class="ttl">{{ $t("자주 하는 질문") }}</h1>
      </div>
      <button v-if="canEdit" class="btn btn-primary" @click="openNew()">{{ $t("+ FAQ 추가") }}</button>
    </header>

    <div class="faq-grid">
      <!-- 메인: 검색 + 목록 -->
      <div class="main">
        <div class="filterbar">
          <input v-model="q" class="field !w-56" :placeholder="$t('질문·답변 검색')" @keyup.enter="search" />
          <div class="msbox"><MultiSelect v-model="cats" :options="catOptions" :placeholder="$t('분류(다중 선택)')" :search-placeholder="$t('분류 검색…')" @change="search" /></div>
          <div class="msbox"><TagSelect v-model="ftags" :placeholder="$t('태그 필터')" @change="search" /></div>
        </div>

        <div v-if="!rows.length" class="listcard"><EmptyState variant="faq" /></div>
        <ul v-else class="list">
          <li v-for="f in rows" :key="f.id" class="item" :class="{ pinned: f.is_pinned }">
            <div class="q" @click="toggle(f)">
              <i v-if="f.is_pinned" class="fa-solid fa-thumbtack pin" :title="$t('상단 고정')"></i>
              <span class="cat" v-if="f.category">{{ f.category }}</span>
              <span class="qt">{{ f.question }}</span>
              <TagChips :tags="f.tags" />
              <span class="vc num">👁 {{ f.view_count }}</span>
              <i class="fa-solid fa-chevron-down chev" :class="{ up: open[f.id] }"></i>
            </div>
            <div v-if="open[f.id]" class="a">
              <div v-if="f.question_body" class="qbody">
                <span class="blk">{{ $t("질문") }}</span>
                <div class="prose" v-html="f.question_body"></div>
              </div>
              <div class="ans">
                <span class="blk ansblk">{{ $t("답변") }}</span>
                <div class="atext prose" v-html="f.answer"></div>
              </div>
              <div v-if="canEdit" class="itools">
                <button class="btn btn-xs" @click="openEdit(f)">{{ $t("수정") }}</button>
                <button class="btn btn-xs btn-danger" @click="remove(f)">{{ $t("삭제") }}</button>
              </div>
            </div>
          </li>
        </ul>

        <Pager v-model:page="page" :total-pages="totalPages" :total="total" @change="reload" />
      </div>

      <!-- 사이드: 인기 FAQ -->
      <aside class="aside">
        <div class="pcard pop">
          <div class="pop-head"><i class="fa-solid fa-fire"></i> {{ $t("많이 본 질문") }}</div>
          <ul class="pop-list">
            <li v-if="!popular.length" class="pop-empty">{{ $t("아직 조회 이력이 없어요.") }}</li>
            <li v-for="(p, i) in popular" :key="p.id" class="pop-row" @click="openView(p.id)">
              <span class="rank" :class="'r' + (i + 1)">{{ i + 1 }}</span>
              <span class="pop-q">{{ p.question }}</span>
              <span class="pop-v num">{{ p.view_count }}</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>

    <!-- 등록/수정 -->
    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel">
        <h4 class="ph">{{ editing ? "FAQ 수정" : "FAQ 추가" }}</h4>
        <div class="fcol">
          <BaseInput v-model="form.question" :label="$t('질문 제목')" :placeholder="$t('한 줄 요약 제목')" />
          <div class="frow">
            <div class="fld flex-1">
              <span class="form-label">{{ $t("분류") }}</span>
              <SearchSelect v-model="form.category" :options="catOptions" :placeholder="$t('분류 선택 · 없으면 추가')" :search-placeholder="$t('분류 검색 또는 새 분류명…')" creatable @create="createCategory" />
            </div>
            <div class="fld toggle">
              <span class="form-label">{{ $t("상단 고정") }}</span>
              <BaseToggle v-model="form.is_pinned" />
            </div>
          </div>
          <div class="fld">
            <span class="form-label">{{ $t("태그") }}</span>
            <TagSelect v-model="form.tag_ids" />
          </div>
          <div class="fld">
            <span class="form-label">{{ $t("답변") }}</span>
            <RichEditor v-model="form.answer" :placeholder="$t('답변 내용')" />
          </div>
          <BaseInput v-model="form.sort" :label="$t('정렬순서')" type="number" />
        </div>
        <p v-if="msg" class="msg err">{{ msg }}</p>
        <div class="acts">
          <button class="btn btn-primary" :disabled="saving" @click="submit">{{ saving ? "저장 중…" : "저장" }}</button>
          <button class="btn" @click="showForm = false">{{ $t("취소") }}</button>
        </div>
      </div>
    </div>

    <!-- 인기글 보기 모달 -->
    <div v-if="viewing" class="drawer" @click.self="viewing = null">
      <div class="panel vmodal">
        <button class="vclose" @click="viewing = null"><i class="fa-solid fa-xmark"></i></button>
        <span class="cat" v-if="viewing.category">{{ viewing.category }}</span>
        <h3 class="vtitle">{{ viewing.question }}</h3>
        <TagChips :tags="viewing.tags" />
        <div v-if="viewing.question_body" class="qbody"><span class="blk">{{ $t("질문") }}</span><div class="prose" v-html="viewing.question_body"></div></div>
        <div class="ans"><span class="blk ansblk">{{ $t("답변") }}</span><div class="atext prose" v-html="viewing.answer"></div></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import BaseToggle from "@/components/base/BaseToggle.vue";
import { ref, reactive, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { confirmDelete } from "@/lib/ui";
import BaseInput from "@/components/base/BaseInput.vue";
import Pager from "@/components/base/Pager.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import MultiSelect from "@/components/base/MultiSelect.vue";
import TagSelect from "@/components/base/TagSelect.vue";
import TagChips from "@/components/base/TagChips.vue";
import RichEditor from "@/components/base/RichEditor.vue";
import { faqApi, faqCategoryApi } from "@/api/faq";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const canEdit = computed(() => auth.hasPermission("faq.edit"));

const LIMIT = 10;
const toast = useToast();
const rows = ref([]);
const page = ref(1);
const total = ref(0);
const totalPages = ref(1);
const categories = ref([]);
const popular = ref([]);
const open = reactive({});
const q = ref("");
const cats = ref([]);
const ftags = ref([]);
const viewing = ref(null);

const catOptions = computed(() => categories.value.map((c) => ({ value: c.name, label: c.name })));

const showForm = ref(false);
const editing = ref(false);
const saving = ref(false);
const msg = ref("");
const form = reactive({ id: null, category: "", question: "", question_body: "", answer: "", sort: 0, is_pinned: false, tag_ids: [] });

async function reload() {
  const res = await faqApi.list({
    q: q.value || undefined,
    categories: cats.value.length ? cats.value : undefined,
    tag_ids: ftags.value.length ? ftags.value : undefined,
    page: page.value,
    limit: LIMIT,
  });
  rows.value = res.rows || [];
  total.value = res.total || 0;
  totalPages.value = res.totalPages || 1;
}
function search() { page.value = 1; reload(); }
async function loadCats() { categories.value = await faqCategoryApi.list({ only_active: true }); }
async function createCategory(name) {
  try {
    await faqCategoryApi.save({ name, sort: categories.value.length });
    await loadCats();
    form.category = name;
    toast.success(`'${name}' 분류가 추가되었습니다.`);
  } catch (e) { toast.error(e?.message || "분류 추가 실패"); }
}
async function loadPopular() { popular.value = await faqApi.popular({ limit: 10 }); }

async function toggle(f) {
  const willOpen = !open[f.id];
  open[f.id] = willOpen;
  if (willOpen) {
    // 조회수 증가(백엔드) + 로컬 반영
    try { const full = await faqApi.get(f.id); f.view_count = full.view_count; loadPopular(); } catch (e) { /* noop */ }
  }
}
async function openView(id) {
  try { viewing.value = await faqApi.get(id); loadPopular(); } catch (e) { toast.error("불러오기 실패"); }
}

function openNew() {
  editing.value = false;
  Object.assign(form, { id: null, category: "", question: "", question_body: "", answer: "", sort: 0, is_pinned: false, tag_ids: [] });
  msg.value = ""; showForm.value = true;
}
function openEdit(f) {
  editing.value = true;
  Object.assign(form, { id: f.id, category: f.category || "", question: f.question, question_body: f.question_body || "", answer: f.answer, sort: f.sort, is_pinned: !!f.is_pinned, tag_ids: (f.tags || []).map((t) => t.id) });
  msg.value = ""; showForm.value = true;
}
async function submit() {
  msg.value = ""; saving.value = true;
  try {
    await faqApi.save({
      id: form.id || undefined, category: form.category || null,
      question: form.question, question_body: null, answer: form.answer,
      sort: Number(form.sort) || 0, is_pinned: form.is_pinned, is_active: true, tag_ids: form.tag_ids,
    });
    toast.success("저장되었습니다."); showForm.value = false; await Promise.all([reload(), loadCats()]);
  } catch (e) { msg.value = e?.message || "저장 실패"; }
  finally { saving.value = false; }
}
async function remove(f) {
  if (!await confirmDelete("이 FAQ를 삭제할까요?")) return;
  try { await faqApi.remove(f.id); toast.success("삭제되었습니다."); await Promise.all([reload(), loadPopular()]); }
  catch (e) { toast.error(e?.message || "삭제 실패"); }
}
onMounted(async () => { await Promise.all([reload(), loadCats(), loadPopular()]); });
</script>

<style scoped>
.page { max-width: 1120px; margin: 0 auto; }
.phead { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 1.1rem; }
.eyebrow { font-family: var(--font-sans); font-size: 0.66rem; letter-spacing: 0.16em; color: var(--accent); }
.ttl { font-family: var(--font-sans); font-size: 1.35rem; color: var(--text); margin-top: 0.25rem; }

.faq-grid { display: grid; grid-template-columns: 1fr 300px; gap: 1rem; align-items: start; }
@media (max-width: 860px) { .faq-grid { grid-template-columns: 1fr; } .aside { order: -1; } }
.main { min-width: 0; }
.msbox { width: 12rem; }

.listcard { background: var(--surface); border: 2px solid var(--border-strong); border-radius: 4px; box-shadow: var(--shadow-sm); }
.list { display: flex; flex-direction: column; gap: 0.5rem; }
.item { background: var(--surface); border: 2px solid var(--border-strong); border-radius: 4px; box-shadow: var(--shadow-sm); overflow: hidden; }
.item.pinned { border-color: var(--accent); }
.q { display: flex; align-items: center; gap: 0.6rem; padding: 0.85rem 1rem; cursor: pointer; }
.q:hover { background: var(--surface-2); }
.pin { color: var(--accent); font-size: 0.8rem; transform: rotate(20deg); }
.cat { font-family: var(--font-sans); font-size: 0.64rem; color: var(--accent-hover); background: var(--accent-soft); border: 1px solid var(--border-strong); padding: 0.1rem 0.45rem; border-radius: 3px; flex-shrink: 0; }
.qt { font-weight: 600; color: var(--text); flex: 1; min-width: 0; }
.vc { font-size: 0.72rem; color: var(--text-subtle); flex-shrink: 0; }
.chev { font-size: 0.7rem; color: var(--text-subtle); transition: transform 0.2s; }
.chev.up { transform: rotate(180deg); }
.a { padding: 0 1rem 1rem; border-top: 1px solid var(--border); }
.blk { display: inline-block; font-family: var(--font-sans); font-size: 0.62rem; color: var(--text-muted); background: var(--surface-2); border: 1px solid var(--border-strong); border-radius: 3px; padding: 0.05rem 0.4rem; margin: 0.8rem 0 0.4rem; }
.blk.ansblk { color: var(--accent-hover); background: var(--accent-soft); }
.qbody .prose, .atext { font-size: 0.9rem; color: var(--text); line-height: 1.6; }
.prose :deep(img), .atext :deep(img) { max-width: 100%; border-radius: 3px; }
.prose :deep(ul), .prose :deep(ol), .atext :deep(ul), .atext :deep(ol) { padding-left: 1.3rem; margin: 0.3rem 0; }
.prose :deep(a), .atext :deep(a) { color: var(--accent); text-decoration: underline; }
.itools { display: flex; gap: 0.4rem; margin-top: 0.9rem; }

/* 인기 FAQ */
.aside { min-width: 0; }
.pop { position: sticky; top: 1rem; }
.pop-head { font-family: var(--font-sans); font-size: 0.82rem; color: var(--text); padding: 0.8rem 0.9rem; border-bottom: 2px solid var(--border); display: flex; align-items: center; gap: 0.45rem; }
.pop-head i { color: var(--warning); }
.pop-list { display: flex; flex-direction: column; }
.pop-empty { padding: 1.2rem 0.9rem; text-align: center; color: var(--text-subtle); font-size: 0.82rem; }
.pop-row { display: flex; align-items: center; gap: 0.5rem; padding: 0.55rem 0.9rem; border-bottom: 1px solid var(--border); cursor: pointer; }
.pop-row:last-child { border-bottom: none; }
.pop-row:hover { background: var(--surface-2); }
.pop-row:hover .pop-q { color: var(--accent); }
.rank { flex-shrink: 0; width: 20px; height: 20px; display: grid; place-items: center; font-family: var(--font-sans); font-size: 0.66rem; color: var(--accent-fg); background: var(--text-subtle); border: 1px solid var(--border-strong); border-radius: 3px; }
.rank.r1 { background: #f5a623; } .rank.r2 { background: #9aa4b2; } .rank.r3 { background: #cd7f32; }
.pop-q { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.84rem; font-weight: 600; color: var(--text); }
.pop-v { font-size: 0.68rem; color: var(--text-subtle); flex-shrink: 0; }

.drawer { position: fixed; inset: 0; z-index: 210; background: rgba(27, 29, 46, 0.55); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.panel { width: 600px; max-width: 100%; max-height: 88vh; overflow-y: auto; background: var(--surface); border: 2px solid var(--border-strong); border-radius: 4px; padding: 1.4rem; box-shadow: var(--shadow-lg); }
.ph { font-family: var(--font-sans); font-size: 1rem; color: var(--text); margin-bottom: 1rem; }
.fcol { display: flex; flex-direction: column; gap: 0.9rem; }
.frow { display: flex; gap: 0.9rem; align-items: flex-start; }
.fld { display: block; } .flex-1 { flex: 1; min-width: 0; }
.toggle { display: flex; flex-direction: column; gap: 0.4rem; flex-shrink: 0; }
.sw { width: 44px; height: 24px; border-radius: 3px; background: var(--border-strong); position: relative; cursor: pointer; transition: background 0.18s; border: 2px solid var(--border-strong); }
.sw.on { background: var(--accent); }
.sw .knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 2px; background: var(--surface); transition: transform 0.18s; }
.sw.on .knob { transform: translateX(20px); }
.msg { margin-top: 0.8rem; font-size: 0.82rem; font-weight: 600; } .msg.err { color: var(--danger); }
.acts { display: flex; gap: 0.6rem; margin-top: 1.2rem; }

.vmodal { position: relative; }
.vclose { position: absolute; top: 1rem; right: 1rem; width: 32px; height: 32px; border: 2px solid var(--border-strong); border-radius: 3px; color: var(--text); box-shadow: 2px 2px 0 var(--border-strong); }
.vclose:hover { background: var(--surface-2); }
.vtitle { font-family: var(--font-sans); font-size: 1.15rem; color: var(--text); margin: 0.4rem 0; }
</style>
