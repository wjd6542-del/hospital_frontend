<template>
  <div>
    <div class="head">
      <h3 class="h">{{ $t("번역팩") }} <span class="c">{{ rows.length }}</span></h3>
      <div class="tools">
        <input v-model="q" class="field !w-48" :placeholder="$t('한국어 검색')" />
        <button class="btn" @click="addRow"><i class="fa-solid fa-plus"></i> {{ $t("행 추가") }}</button>
        <button class="btn btn-primary" :disabled="saving" @click="saveAll">{{ saving ? "저장 중…" : "전체 저장" }}</button>
      </div>
    </div>

    <p class="hint">{{ $t("한국어(ko)를") }} <b>{{ $t("키") }}</b>{{ $t("로 사용합니다. 화면의") }} <code>$t("한국어")</code> {{ $t("가 현재 언어의 번역으로 치환돼요. 🌍 버튼으로 자동 번역(설정 시).") }}</p>

    <div class="tablewrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("🇰🇷 한국어(키)") }}</th><th>🇺🇸 English</th><th>🇯🇵 日本語</th><th>🇨🇳 中文</th>
            <th class="c w-act">{{ $t("번역") }}</th><th class="c w-st">{{ $t("활성") }}</th><th class="c w-del">{{ $t("삭제") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filtered.length"><td colspan="7"><EmptyState icon="fa-language" :title="$t('번역팩이 없습니다')" :desc="$t('행을 추가해 다국어 문구를 등록하세요.')" compact /></td></tr>
          <tr v-for="(r, i) in filtered" :key="r._k">
            <td><input v-model="r.name.ko" class="cell" :placeholder="$t('한국어')" /></td>
            <td><input v-model="r.name.en" class="cell" placeholder="English" /></td>
            <td><input v-model="r.name.ja" class="cell" placeholder="日本語" /></td>
            <td><input v-model="r.name.zh" class="cell" placeholder="中文" /></td>
            <td class="c"><button class="btn btn-xs" :disabled="!r.name.ko || r._t" @click="translate(r)">{{ r._t ? "…" : "🌍" }}</button></td>
            <td class="c">
              <BaseToggle v-model="r.is_active" />
            </td>
            <td class="c"><button class="btn btn-xs btn-danger" @click="removeRow(r)">{{ $t("삭제") }}</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import BaseToggle from "@/components/base/BaseToggle.vue";
import { ref, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { confirmDelete } from "@/lib/ui";
import EmptyState from "@/components/base/EmptyState.vue";
import { langPackApi } from "@/api/settings";
import { useI18nStore } from "@/stores/i18n";

const toast = useToast();
const i18n = useI18nStore();
const rows = ref([]);
const q = ref("");
const saving = ref(false);
let keySeq = 0;

const filtered = computed(() => {
  const k = q.value.trim().toLowerCase();
  if (!k) return rows.value;
  return rows.value.filter((r) => (r.name.ko || "").toLowerCase().includes(k));
});

function blank() {
  return { _k: `n${keySeq++}`, id: null, name: { ko: "", en: "", ja: "", zh: "" }, is_active: true };
}
async function load() {
  const list = await langPackApi.list({});
  rows.value = (list || []).map((r) => ({
    _k: `r${r.id}`,
    id: r.id,
    name: { ko: r.name?.ko || "", en: r.name?.en || "", ja: r.name?.ja || "", zh: r.name?.zh || "" },
    is_active: !!r.is_active,
  }));
}
function addRow() { rows.value.unshift(blank()); }

async function translate(r) {
  if (!r.name.ko) { toast.error("한국어를 입력하세요"); return; }
  r._t = true;
  try {
    const res = await langPackApi.translateText(r.name.ko);
    r.name.en = res.en || r.name.en;
    r.name.ja = res.ja || r.name.ja;
    r.name.zh = res.zh || r.name.zh;
  } catch (e) { toast.error(e?.message || "자동 번역을 사용할 수 없습니다"); }
  finally { r._t = false; }
}

async function saveAll() {
  const payload = rows.value
    .filter((r) => r.name.ko.trim())
    .map((r) => ({ ...(r.id ? { id: r.id } : {}), name: r.name, is_active: r.is_active }));
  if (!payload.length) { toast.error("저장할 항목이 없습니다"); return; }
  saving.value = true;
  try {
    await langPackApi.batchSave(payload);
    toast.success("저장되었습니다.");
    await load();
    await i18n.loadLangPacks();
  } catch (e) { toast.error(e?.message || "저장 실패"); }
  finally { saving.value = false; }
}

async function removeRow(r) {
  if (!r.id) { rows.value = rows.value.filter((x) => x._k !== r._k); return; }
  if (!await confirmDelete(`'${r.name.ko}' 번역을 삭제할까요?`)) return;
  try {
    await langPackApi.remove(r.id);
    toast.success("삭제되었습니다.");
    await load();
    await i18n.loadLangPacks();
  } catch (e) { toast.error(e?.message || "삭제 실패"); }
}

onMounted(load);
</script>

<style scoped>
.head { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; margin-bottom: 0.6rem; flex-wrap: wrap; }
.h { font-weight: 700; color: var(--text); }
.c { color: var(--accent); }
.tools { display: flex; gap: 0.5rem; align-items: center; }
.hint { font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.8rem; }
.hint code { font-size: 0.72rem; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius); padding: 0.02rem 0.3rem; }
.tablewrap { border: 1px solid var(--border-strong); border-radius: var(--radius); overflow-x: auto; background: var(--surface); box-shadow: var(--shadow-sm); }
/* 편집 그리드 — 조밀하게, 좁으면 가로 스크롤 */
.tbl { min-width: 860px; }
.tbl th { padding: 0.55rem 0.7rem; font-size: 0.72rem; }
.tbl td { padding: 0.35rem 0.5rem; }
.c { text-align: center; } .w-act { width: 60px; } .w-st { width: 60px; } .w-del { width: 72px; }
.cell { width: 100%; height: 30px; padding: 0 0.5rem; font-size: 0.84rem; border: 1px solid var(--border); border-radius: var(--radius); outline: none; background: var(--surface); }
.cell:focus { border-color: var(--accent); box-shadow: var(--ring); }
.sw { display: inline-block; width: 40px; height: 22px; border-radius: var(--radius); background: var(--surface-2); border: 1px solid var(--border-strong); position: relative; cursor: pointer; transition: background 0.18s; }
.sw.on { background: var(--positive); }
.sw .knob { position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border-strong); transition: transform 0.18s; }
.sw.on .knob { transform: translateX(18px); }
</style>
