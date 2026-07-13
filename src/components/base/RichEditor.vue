<template>
  <div class="reditor">
    <div class="rtoolbar">
      <button type="button" @mousedown.prevent="cmd('bold')" :title="$t('굵게')"><b>B</b></button>
      <button type="button" @mousedown.prevent="cmd('italic')" :title="$t('기울임')"><i>I</i></button>
      <button type="button" @mousedown.prevent="cmd('underline')" :title="$t('밑줄')"><u>U</u></button>
      <button type="button" @mousedown.prevent="cmd('strikeThrough')" :title="$t('취소선')"><s>S</s></button>
      <span class="sep"></span>
      <button type="button" @mousedown.prevent="cmd('formatBlock', 'H2')" :title="$t('제목')">{{ $t("제목") }}</button>
      <button type="button" @mousedown.prevent="cmd('formatBlock', 'P')" :title="$t('본문')">{{ $t("본문") }}</button>
      <button type="button" @mousedown.prevent="cmd('insertUnorderedList')" :title="$t('글머리 목록')">{{ $t("• 목록") }}</button>
      <button type="button" @mousedown.prevent="cmd('insertOrderedList')" :title="$t('번호 목록')">{{ $t("1. 목록") }}</button>
      <button type="button" @mousedown.prevent="cmd('formatBlock', 'BLOCKQUOTE')" :title="$t('인용')">{{ $t("❝ 인용") }}</button>
      <span class="sep"></span>
      <button type="button" @mousedown.prevent="addLink" :title="$t('링크')"><i class="fa-solid fa-link"></i></button>
      <button v-if="upload" type="button" @mousedown.prevent="pickImage" :title="$t('이미지')"><i class="fa-solid fa-image"></i></button>
      <div class="tblwrap" ref="tblWrap">
        <button type="button" :class="{ act: tableMenu }" @mousedown.prevent="tableMenu = !tableMenu" :title="$t('표 삽입')"><i class="fa-solid fa-table-cells"></i></button>
        <div v-if="tableMenu" class="tablepick" @mousedown.prevent>
          <div class="tpgrid" @mouseleave="hoverR = 0; hoverC = 0">
            <div v-for="r in 8" :key="r" class="tprow">
              <span v-for="c in 8" :key="c" class="tpcell" :class="{ hot: r <= hoverR && c <= hoverC }"
                @mouseover="hoverR = r; hoverC = c" @mousedown.prevent="insertTable(r, c)"></span>
            </div>
          </div>
          <div class="tplabel">{{ hoverR ? hoverR + " × " + hoverC : "표 크기 선택" }}</div>
        </div>
      </div>
      <span v-if="uploading" class="uprog">{{ $t("업로드 중…") }}</span>
      <input ref="fileInput" type="file" accept="image/*" hidden @change="onImage" />
    </div>
    <div
      ref="editable"
      class="rcontent"
      contenteditable="true"
      :data-ph="placeholder"
      @input="onInput"
      @focus="focused = true"
      @blur="onBlur"
    ></div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useToast } from "vue-toastification";
import { boardApi, mediaUrl } from "@/api/board";

const props = defineProps({
  modelValue: { type: String, default: "" },
  upload: { type: Boolean, default: true },
  placeholder: { type: String, default: "내용을 입력하세요" },
});
const emit = defineEmits(["update:modelValue"]);
const toast = useToast();

const editable = ref(null);
const fileInput = ref(null);
const uploading = ref(false);
const focused = ref(false);

/* 표 삽입 그리드 피커 */
const tblWrap = ref(null);
const tableMenu = ref(false);
const hoverR = ref(0);
const hoverC = ref(0);
function insertTable(rows, cols) {
  let html = '<table class="re-table" style="border-collapse:collapse;width:100%;margin:8px 0;">';
  for (let r = 0; r < rows; r++) {
    html += "<tr>";
    for (let c = 0; c < cols; c++) {
      html += '<td style="border:1px solid var(--border-strong);padding:6px 8px;min-width:40px;">&nbsp;</td>';
    }
    html += "</tr>";
  }
  html += "</table><p><br></p>";
  cmd("insertHTML", html);
  tableMenu.value = false;
  hoverR.value = hoverC.value = 0;
}
function onOutside(e) { if (tblWrap.value && !tblWrap.value.contains(e.target)) tableMenu.value = false; }
onMounted(() => document.addEventListener("mousedown", onOutside, true));
onBeforeUnmount(() => document.removeEventListener("mousedown", onOutside, true));

onMounted(() => { if (editable.value) editable.value.innerHTML = props.modelValue || ""; });
watch(() => props.modelValue, (v) => {
  // 편집 중(포커스)에는 절대 innerHTML 을 덮어쓰지 않는다 (커서 튐 방지)
  if (editable.value && !focused.value && v !== editable.value.innerHTML) editable.value.innerHTML = v || "";
});

function onInput() { emit("update:modelValue", editable.value?.innerHTML || ""); }
function onBlur() { focused.value = false; onInput(); }
function cmd(command, val = null) {
  editable.value?.focus();
  document.execCommand(command, false, val);
  onInput();
}
function addLink() {
  const url = window.prompt("링크 주소(URL)");
  if (url) cmd("createLink", url);
}
function pickImage() { fileInput.value?.click(); }
async function onImage(e) {
  const files = [...e.target.files];
  if (!files.length) return;
  uploading.value = true;
  try {
    const saved = await boardApi.upload(files);
    for (const a of saved) {
      cmd("insertHTML", `<img src="${mediaUrl(a.path)}" style="max-width:100%;border-radius:8px;margin:6px 0;" />`);
    }
  } catch (err) { toast.error(err?.message || "이미지 업로드 실패"); }
  finally { uploading.value = false; e.target.value = ""; }
}
</script>

<style scoped>
.reditor { border: 1px solid var(--border-strong); border-radius: 10px; overflow: hidden; background: var(--surface); }
.rtoolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--border); background: var(--surface-2); }
.rtoolbar button { min-width: 30px; height: 28px; padding: 0 0.5rem; border-radius: 6px; font-size: 0.8rem; color: var(--text-muted); background: transparent; transition: background 0.12s; }
.rtoolbar button:hover { background: var(--canvas); }
.sep { width: 1px; height: 18px; background: var(--border-strong); margin: 0 4px; }
.rtoolbar button.act { background: var(--accent-soft); color: var(--accent-hover); }
.uprog { font-size: 0.72rem; color: var(--accent); margin-left: 0.3rem; }

/* 표 삽입 그리드 피커 */
.tblwrap { position: relative; display: inline-flex; }
.tablepick { position: absolute; top: calc(100% + 6px); left: 0; z-index: 60; background: var(--surface); border: 2px solid var(--border-strong); border-radius: 4px; box-shadow: 4px 4px 0 var(--border-strong); padding: 0.5rem; }
.tpgrid { display: flex; flex-direction: column; gap: 3px; }
.tprow { display: flex; gap: 3px; }
.tpcell { width: 16px; height: 16px; border: 1px solid var(--border-strong); border-radius: 2px; background: var(--surface); cursor: pointer; }
.tpcell.hot { background: var(--accent); border-color: var(--accent-hover); }
.tplabel { margin-top: 0.4rem; text-align: center; font-family: var(--font-sans); font-size: 0.64rem; color: var(--text-muted); }
.rcontent {
  min-height: 240px; max-height: 60vh; overflow-y: auto;
  padding: 0.9rem 1rem; font-size: 0.95rem; line-height: 1.7; color: var(--text); outline: none;
}
.rcontent:empty::before { content: attr(data-ph); color: var(--text-subtle); }
.rcontent :deep(h2) { font-family: "Noto Serif KR", serif; font-size: 1.25rem; font-weight: 700; margin: 0.6rem 0 0.3rem; }
.rcontent :deep(blockquote) { border-left: 3px solid var(--accent); margin: 0.5rem 0; padding: 0.2rem 0.9rem; color: var(--text-muted); background: var(--surface-2); border-radius: 0 8px 8px 0; }
.rcontent :deep(ul), .rcontent :deep(ol) { padding-left: 1.4rem; margin: 0.4rem 0; }
.rcontent :deep(a) { color: var(--accent); text-decoration: underline; }
.rcontent :deep(img) { max-width: 100%; border-radius: 8px; }
.rcontent :deep(table) { border-collapse: collapse; width: 100%; margin: 8px 0; }
.rcontent :deep(td), .rcontent :deep(th) { border: 1px solid var(--border-strong); padding: 6px 8px; min-width: 40px; }
</style>
