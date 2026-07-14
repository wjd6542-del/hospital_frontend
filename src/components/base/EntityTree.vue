<template>
  <div class="vtree">
    <div class="vt-head">
      <input v-model="kw" class="field field-xs" :placeholder="`${label} 명칭 검색`" />
      <button class="btn btn-xs" :title="allExpanded ? $t('전체 접기') : $t('전체 펼치기')" :disabled="!hasBranches" @click="toggleAllBranches"><i class="fa-solid" :class="allExpanded ? 'fa-angles-up' : 'fa-angles-down'"></i></button>
      <button class="btn btn-xs btn-primary" :title="`최상위 ${label} 추가`" @click="startAdd(null)">＋</button>
    </div>

    <!-- 추가 입력 바 -->
    <div v-if="adding" class="vt-edit">
      <span class="vt-under" v-if="adding.parent_name">↳ {{ adding.parent_name }} 하위</span>
      <input ref="addInput" v-model="addName" class="field field-xs" :placeholder="`${label}명`" @keyup.enter="onEnter($event, confirmAdd)" @keyup.esc="adding = null" />
      <button class="btn btn-xs btn-primary" @click="confirmAdd">{{ $t("저장") }}</button>
      <button class="btn btn-xs" @click="adding = null">{{ $t("취소") }}</button>
    </div>

    <div class="vt-body">
      <div v-if="!flat.length"><EmptyState :icon="emptyIcon" :title="`${label}가 없어요`" :desc="`${label}를 추가해 보세요.`" :hint="$t('＋ 로 추가!')" compact /></div>

      <!-- 최상위로 이동 드롭존 (드래그 중에만) -->
      <div v-if="dragId" class="rootdrop" :class="{ over: dragOverRoot }">
        {{ $t("⤒ 여기에 놓으면 최상위로 이동") }}
      </div>

      <div
        v-for="row in flat"
        :key="row.node.id"
        class="vt-row"
        :class="{
          on: row.node.id === selectedId,
          dim: !row.node.is_active,
          dragging: dragId === row.node.id,
          'dz-before': dragOverId === row.node.id && dropPos === 'before',
          'dz-after': dragOverId === row.node.id && dropPos === 'after',
          'dz-inside': dragOverId === row.node.id && dropPos === 'inside',
        }"
        :style="{ paddingLeft: 0.4 + row.depth * 0.9 + 'rem' }"
        :data-node-id="row.node.id"
        @click="select(row.node)"
      >
        <span class="grip" :title="$t('드래그하여 위치·순서 이동')" @mousedown.stop="onGripDown(row.node, $event)"><i class="fa-solid fa-grip-vertical"></i></span>
        <button v-if="row.hasChildren" class="caret" @click.stop="toggle(row.node.id)">
          <i class="fa-solid" :class="isCollapsed(row.node.id) ? 'fa-caret-right' : 'fa-caret-down'"></i>
        </button>
        <span v-else class="caret ph"></span>

        <template v-if="editId === row.node.id">
          <input v-model="editName" class="field field-xs !h-[24px] flex-1" @click.stop @keyup.enter="onEnter($event, confirmEdit)" @keyup.esc="editId = null" />
          <button class="ico ok" @click.stop="confirmEdit"><i class="fa-solid fa-check"></i></button>
          <button class="ico" @click.stop="editId = null"><i class="fa-solid fa-xmark"></i></button>
        </template>
        <template v-else>
          <span class="nm">{{ row.node.name }}</span>
          <span class="acts">
            <button class="ico" :title="$t('하위 추가')" @click.stop="startAdd(row.node)"><i class="fa-solid fa-plus"></i></button>
            <button class="ico" :title="$t('명칭 수정')" @click.stop="startEdit(row.node)"><i class="fa-solid fa-pen"></i></button>
            <button class="ico del" :title="$t('삭제')" @click.stop="remove(row.node)"><i class="fa-solid fa-trash"></i></button>
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useToast } from "vue-toastification";
import { confirmDelete } from "@/lib/ui";
import EmptyState from "@/components/base/EmptyState.vue";

const props = defineProps({
  api: { type: Object, required: true }, // { tree, save, remove }
  label: { type: String, default: "항목" },
  emptyIcon: { type: String, default: "fa-sitemap" },
  selectedId: { type: Number, default: null },
});
const emit = defineEmits(["select", "change"]);
const toast = useToast();

const roots = ref([]);
const collapsed = reactive({});
const kw = ref("");

const adding = ref(null);
const addName = ref("");
const addInput = ref(null);
const editId = ref(null);
const editName = ref("");

// 드래그&드롭
const dragId = ref(null);
const dragOverId = ref(null);
const dragOverRoot = ref(false);
const dropPos = ref("inside"); // before | after | inside

function isCollapsed(id) { return !!collapsed[id]; }
function toggle(id) { collapsed[id] = !collapsed[id]; }

// 자식을 가진 노드 id 목록 (전체 펼치기/접기 대상)
function branchIds(nodes = roots.value, acc = []) {
  for (const n of nodes) {
    if ((n.children || []).length) { acc.push(n.id); branchIds(n.children, acc); }
  }
  return acc;
}
const hasBranches = computed(() => branchIds().length > 0);
const allExpanded = computed(() => { const ids = branchIds(); return ids.length > 0 && ids.every((id) => !collapsed[id]); });
function expandAll() { for (const id of branchIds()) collapsed[id] = false; }
function collapseAll() { for (const id of branchIds()) collapsed[id] = true; }
function toggleAllBranches() { allExpanded.value ? collapseAll() : expandAll(); }

function filterTree(nodes) {
  const k = kw.value.trim().toLowerCase();
  if (!k) return nodes;
  const walk = (list) =>
    list
      .map((n) => {
        const kids = walk(n.children || []);
        const hit = n.name.toLowerCase().includes(k) || (n.code || "").toLowerCase().includes(k);
        if (hit || kids.length) return { ...n, children: kids };
        return null;
      })
      .filter(Boolean);
  return walk(nodes);
}

const flat = computed(() => {
  const out = [];
  const searching = !!kw.value.trim();
  const walk = (nodes, depth) => {
    for (const n of nodes) {
      const hasChildren = (n.children || []).length > 0;
      out.push({ node: n, depth, hasChildren });
      if (hasChildren && (searching || !collapsed[n.id])) walk(n.children, depth + 1);
    }
  };
  walk(filterTree(roots.value), 0);
  return out;
});

async function reload() { roots.value = await props.api.tree(); }
function select(node) { if (suppressClick) return; emit("select", { id: node.id, name: node.name, code: node.code }); }

function startAdd(parent) {
  adding.value = { parent_id: parent?.id ?? null, parent_name: parent?.name ?? "" };
  addName.value = "";
  editId.value = null;
  nextTick(() => addInput.value?.focus());
}
let busy = false; // 재진입 가드 (IME 엔터 중복 방지)
// IME 조합 중 엔터는 무시 (한글 입력 후 확정 엔터가 중복 실행되는 문제 방지)
function onEnter(e, fn) { if (e.isComposing || e.keyCode === 229) return; fn(); }

async function confirmAdd() {
  const name = addName.value.trim();
  if (!name || busy || !adding.value) return;
  busy = true;
  const parentId = adding.value.parent_id;
  try {
    await props.api.save({ name, parent_id: parentId });
    if (parentId) collapsed[parentId] = false;
    adding.value = null;
    await reload();
    emit("change");
    toast.success(`${props.label}가 등록되었습니다.`);
  } catch (e) { toast.error(e?.message || "등록 실패"); }
  finally { busy = false; }
}

function startEdit(node) {
  editId.value = node.id;
  editName.value = node.name;
  adding.value = null;
}
async function confirmEdit() {
  const name = editName.value.trim();
  if (!name || busy || !editId.value) return;
  busy = true;
  try {
    await props.api.save({ id: editId.value, name });
    editId.value = null;
    await reload();
    emit("change");
    toast.success("명칭이 수정되었습니다.");
  } catch (e) { toast.error(e?.message || "수정 실패"); }
  finally { busy = false; }
}

async function remove(node) {
  if (!await confirmDelete(`'${node.name}' ${props.label}를 삭제할까요?`)) return;
  try {
    await props.api.remove(node.id);
    await reload();
    emit("change");
    toast.success("삭제되었습니다.");
  } catch (e) { toast.error(e?.message || "삭제 실패"); }
}

// 드래그된 노드의 후손 id 집합 (자기 하위로 이동 방지)
function descendantsOf(id) {
  const set = new Set();
  const collect = (nodes) => { for (const n of nodes) { set.add(n.id); collect(n.children || []); } };
  const find = (nodes) => {
    for (const n of nodes) {
      if (n.id === id) { collect(n.children || []); return true; }
      if (find(n.children || [])) return true;
    }
    return false;
  };
  find(roots.value);
  return set;
}
// 포인터(마우스) 기반 드래그 — 네이티브 HTML5 DnD 대신 사용(웹뷰 호환 안정)
let pending = null;      // { id, x, y } — 임계값 넘기 전 대기 상태
let dragging = false;    // 실제 드래그 진행 중
let suppressClick = false; // 드래그 직후 click(select) 억제

function onGripDown(node, e) {
  if (e.button !== 0 || editId.value === node.id) return;
  e.preventDefault();
  pending = { id: node.id, x: e.clientX, y: e.clientY };
  document.addEventListener("mousemove", onDocMove, true);
  document.addEventListener("mouseup", onDocUp, true);
}
function onDocMove(e) {
  if (!pending) return;
  if (!dragging) {
    if (Math.abs(e.clientX - pending.x) + Math.abs(e.clientY - pending.y) < 5) return;
    dragging = true;
    dragId.value = pending.id;
    document.body.style.userSelect = "none";
  }
  e.preventDefault();
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (el && el.closest && el.closest(".rootdrop")) { dragOverRoot.value = true; dragOverId.value = null; return; }
  dragOverRoot.value = false;
  const rowEl = el && el.closest ? el.closest(".vt-row") : null;
  const idAttr = rowEl && rowEl.getAttribute("data-node-id");
  if (!idAttr) { dragOverId.value = null; return; }
  const tid = Number(idAttr);
  if (tid === dragId.value) { dragOverId.value = null; return; }
  dragOverId.value = tid;
  const rect = rowEl.getBoundingClientRect();
  const y = e.clientY - rect.top;
  dropPos.value = y < rect.height * 0.28 ? "before" : y > rect.height * 0.72 ? "after" : "inside";
}
function onDocUp() {
  document.removeEventListener("mousemove", onDocMove, true);
  document.removeEventListener("mouseup", onDocUp, true);
  document.body.style.userSelect = "";
  if (dragging) {
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    const id = dragId.value;
    if (dragOverRoot.value) { if (id) reorderMove(id, null, null, "최상위로 이동되었습니다."); else reset(); }
    else if (dragOverId.value) { performDrop(id, dragOverId.value, dropPos.value); }
    else reset();
  } else {
    reset();
  }
  pending = null;
  dragging = false;
}
function reset() { dragId.value = null; dragOverId.value = null; dragOverRoot.value = false; }

// 노드의 형제 목록·인덱스·부모 찾기
function findContext(id, nodes = roots.value, parent = null) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) return { siblings: nodes, index: i, parentId: parent?.id ?? null };
    const r = findContext(id, nodes[i].children || [], nodes[i]);
    if (r) return r;
  }
  return null;
}

async function reorderMove(id, parentId, beforeId, msg = "순서가 변경되었습니다.") {
  // 대상 부모를 펼쳐서 이동 결과가 보이도록
  if (parentId != null) collapsed[parentId] = false;
  try {
    await props.api.reorder({ id, parent_id: parentId, before_id: beforeId });
    await reload();
    emit("change");
    toast.success(msg);
  } catch (e) { toast.error(e?.message || "순서 변경 실패"); }
  finally { reset(); }
}
function performDrop(id, targetId, pos) {
  if (!id || id === targetId) return reset();
  if (descendantsOf(id).has(targetId)) { toast.error("자기 하위로는 이동할 수 없습니다."); return reset(); }
  // 안쪽 → 대상의 마지막 자식으로 (부모 변경 + 정렬 재부여)
  if (pos === "inside") return reorderMove(id, targetId, null, "하위로 이동되었습니다.");
  // 형제 순서 변경
  const ctx = findContext(targetId);
  const parentId = ctx?.parentId ?? null;
  const beforeId = pos === "before" ? targetId : (ctx?.siblings[ctx.index + 1]?.id ?? null);
  if (beforeId === id) return reset();
  reorderMove(id, parentId, beforeId);
}

defineExpose({ reload });
onMounted(reload);
onBeforeUnmount(() => {
  document.removeEventListener("mousemove", onDocMove, true);
  document.removeEventListener("mouseup", onDocUp, true);
  document.body.style.userSelect = "";
});
</script>

<style scoped>
.vtree { display: flex; flex-direction: column; height: 100%; }
.vt-head { min-height: 58px; box-sizing: border-box; display: flex; align-items: center; gap: 0.35rem; padding: 0.6rem 0.7rem; border-bottom: 2px solid var(--border); flex-wrap: nowrap; }
.vt-head .field { flex: 1; min-width: 120px; }
.vt-head .btn:disabled { opacity: 0.4; }
.vt-edit { display: flex; align-items: center; gap: 0.35rem; padding: 0.5rem 0.6rem; background: var(--surface-2); border-bottom: 2px solid var(--border); flex-wrap: wrap; }
.vt-under { font-size: 0.68rem; color: var(--accent-hover); font-family: var(--font-sans); width: 100%; }
.vt-body { flex: 1; overflow-y: auto; padding: 0.3rem; }

.vt-row { display: flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.4rem; border-radius: var(--radius); cursor: pointer; font-size: 0.86rem; }
.vt-row:hover { background: var(--surface-2); }
.grip { flex-shrink: 0; width: 12px; display: grid; place-items: center; color: var(--text-subtle); font-size: 0.72rem; cursor: grab; opacity: 0.35; }
.vt-row:hover .grip { opacity: 0.9; }
.grip:active { cursor: grabbing; }
.vt-row.on { background: color-mix(in srgb, var(--accent) 16%, transparent); box-shadow: inset 0 0 0 2px var(--accent); }
.vt-row.on .nm { color: var(--text); }
.vt-row.dim .nm { color: var(--text-subtle); text-decoration: line-through; }
.vt-row.dragging { opacity: 0.45; }
.vt-row.dz-inside { background: color-mix(in srgb, var(--accent) 24%, transparent); box-shadow: inset 0 0 0 2px var(--accent); }
.vt-row.dz-before { box-shadow: inset 0 3px 0 var(--accent); }
.vt-row.dz-after { box-shadow: inset 0 -3px 0 var(--accent); }
.rootdrop { margin: 0.2rem; padding: 0.5rem; text-align: center; font-family: var(--font-sans); font-size: 0.66rem; color: var(--accent-hover); background: var(--surface-2); border: 2px dashed var(--accent); border-radius: var(--radius); }
.rootdrop.over { background: color-mix(in srgb, var(--accent) 24%, transparent); }
.caret { width: 18px; height: 18px; flex-shrink: 0; display: grid; place-items: center; color: var(--text-muted); font-size: 0.75rem; }
.caret.ph { visibility: hidden; }
.nm { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; color: var(--text); }
.acts { display: none; gap: 0.1rem; flex-shrink: 0; }
.vt-row:hover .acts { display: flex; }
.ico { width: 24px; height: 22px; display: grid; place-items: center; border-radius: var(--radius); font-size: 0.72rem; color: var(--text-muted); }
.ico:hover { background: var(--surface); color: var(--accent); box-shadow: var(--shadow-sm); }
.ico.del:hover { color: var(--danger); }
.ico.ok { color: var(--positive); }
</style>
