<template>
  <div class="home">
    <header class="phead">
      <h1 class="ttl">{{ $t("대시보드") }}</h1>
      <p class="sub">{{ auth.user?.name || auth.user?.username }}{{ $t("님, 환영합니다.") }}</p>
    </header>

    <div v-if="canBoard" class="grid">
      <section v-for="b in widgets" :key="b.slug" class="pcard widget">
        <header class="whead">
          <h2 class="wttl">{{ b.name }}</h2>
          <RouterLink :to="`/board/${b.slug}`" class="wmore">{{ $t("더보기 ›") }}</RouterLink>
        </header>

        <ul v-if="b.posts.length" class="wlist">
          <li v-for="p in b.posts" :key="p.id">
            <RouterLink :to="`/post/${p.id}`" class="wrow">
              <span class="wtitle">{{ p.title }}</span>
              <span class="wdate">{{ fmt(p.created_at) }}</span>
            </RouterLink>
          </li>
        </ul>
        <EmptyState v-else :message="$t('게시글이 없습니다.')" />
      </section>
    </div>

    <EmptyState v-else :message="$t('표시할 항목이 없습니다.')" />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from "vue";
import EmptyState from "@/components/base/EmptyState.vue";
import { useAuthStore } from "@/stores/auth";
import { boardApi } from "@/api/board";
import { formatDateDot as fmt } from "@/utils/date";

const auth = useAuthStore();
const canBoard = computed(() => auth.hasPermission("board.view"));

// 대시보드에 요약을 띄울 게시판 slug (seed-board 기준)
const SLUGS = ["notice", "free"];
const widgets = ref([]);

async function loadBoard(slug) {
  const board = await boardApi.get(slug);
  const res = await boardApi.postList(board.id, 1, 5);
  return {
    slug,
    name: board.name,
    posts: [...(res.notices || []), ...(res.rows || [])].slice(0, 5),
  };
}

onMounted(async () => {
  if (!canBoard.value) return;
  const loaded = [];
  for (const slug of SLUGS) {
    try {
      loaded.push(await loadBoard(slug));
    } catch (e) {
      /* 게시판이 없으면 위젯을 건너뛴다 */
    }
  }
  widgets.value = loaded;
});
</script>

<style scoped>
.home { max-width: 1000px; margin: 0 auto; }
.phead { margin-bottom: 1.1rem; }
.ttl { font-size: 1.5rem; font-weight: 800; color: var(--text); }
.sub { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem; }

.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; }
.widget { padding: 1rem 1.1rem; }
.whead { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 0.75rem; }
.wttl { font-size: 1rem; font-weight: 700; color: var(--text); }
.wmore { font-size: 0.78rem; color: var(--accent); }
.wmore:hover { color: var(--accent-hover); }

.wlist { display: flex; flex-direction: column; }
.wrow { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid var(--border); }
.wlist li:last-child .wrow { border-bottom: none; }
.wtitle { font-size: 0.85rem; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wrow:hover .wtitle { color: var(--accent); }
.wdate { font-size: 0.72rem; color: var(--text-subtle); flex-shrink: 0; font-variant-numeric: tabular-nums; }
</style>
