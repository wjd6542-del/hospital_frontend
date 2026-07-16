<template>
  <div class="bview">
    <header class="phead">
      <div>
        <h1 class="ttl">{{ board?.name }}</h1>
        <p v-if="board?.description" class="desc">{{ board.description }}</p>
      </div>
      <router-link v-if="canWrite" :to="`/board/${slug}/write`" class="btn btn-primary"><i class="fa-solid fa-pen"></i> {{ $t("글쓰기") }}</router-link>
    </header>

    <div class="tablewrap">
      <table class="tbl">
        <thead>
          <tr>
            <th class="c w-no">{{ $t("번호") }}</th>
            <th>{{ $t("제목") }}</th>
            <th class="c w-au">{{ $t("작성자") }}</th>
            <th class="c w-vc">{{ $t("조회") }}</th>
            <th class="c w-dt">{{ $t("작성일") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && !notices.length && !rows.length">
            <td colspan="5"><EmptyState variant="board" compact /></td>
          </tr>

          <!-- 공지 (1페이지 상단 고정) -->
          <tr v-for="p in notices" :key="'n' + p.id" class="row notice" @click="open(p.id)">
            <td class="c"><span class="badge badge-indigo">{{ $t("공지") }}</span></td>
            <td class="ti">{{ p.title }}<span v-if="p.comment_count" class="cc">[{{ p.comment_count }}]</span></td>
            <td class="c muted">{{ p.author }}</td>
            <td class="c muted num">{{ p.view_count }}</td>
            <td class="c muted num">{{ fmt(p.created_at) }}</td>
          </tr>

          <!-- 일반글 -->
          <tr v-for="(p, i) in rows" :key="p.id" class="row" @click="open(p.id)">
            <td class="c muted num">{{ total - (page - 1) * LIMIT - i }}</td>
            <td class="ti">{{ p.title }}<span v-if="p.comment_count" class="cc">[{{ p.comment_count }}]</span></td>
            <td class="c muted">{{ p.author }}</td>
            <td class="c muted num">{{ p.view_count }}</td>
            <td class="c muted num">{{ fmt(p.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pager v-model:page="page" :total-pages="totalPages" :total="total" @change="load" />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { boardApi } from "@/api/board";
import Pager from "@/components/base/Pager.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import { formatDateDot as fmt } from "@/utils/date";

const LIMIT = 20;
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const slug = computed(() => route.params.slug);
const board = ref(null);
const notices = ref([]);
const rows = ref([]);
const page = ref(1);
const total = ref(0);
const totalPages = ref(1);
const loading = ref(false);

const canWrite = computed(() => {
  if (!board.value || !auth.user) return false;
  if (board.value.write_level === "ADMIN") return !!auth.user.is_super;
  return true;
});

function open(id) { router.push(`/post/${id}`); }

async function loadBoard() {
  board.value = await boardApi.get(slug.value);
  page.value = 1;
  await load();
}
async function load() {
  loading.value = true;
  try {
    const res = await boardApi.postList(board.value.id, page.value, LIMIT);
    notices.value = res.notices || [];
    rows.value = res.rows || [];
    total.value = res.total || 0;
    totalPages.value = res.totalPages || 1;
  } finally {
    loading.value = false;
  }
}

onMounted(loadBoard);
watch(slug, loadBoard);
</script>

<style scoped>
.bview { max-width: 80%; margin: 0; }
.phead { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 1.1rem; gap: 1rem; }
.eyebrow { font-size: 0.66rem; letter-spacing: 0.16em; color: var(--accent); }
.ttl { font-size: 1.4rem; color: var(--text); margin-top: 0.25rem; }
.desc { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem; }

.tablewrap { border: 1px solid var(--border-strong); border-radius: var(--radius); overflow: hidden; background: var(--surface); box-shadow: var(--shadow-sm); }
.c { text-align: center; }
.w-no { width: 64px; } .w-au { width: 110px; } .w-vc { width: 64px; } .w-dt { width: 110px; }
.row { cursor: pointer; }
.row:hover { background: var(--surface-2); }
.row:hover .ti { color: var(--accent); }
.row.notice { background: var(--accent-soft); }
.ti { font-weight: 600; }
.cc { color: var(--accent); font-weight: 700; margin-left: 0.3rem; font-size: 0.8rem; }
.muted { color: var(--text-muted); }
</style>
