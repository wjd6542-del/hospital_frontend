<template>
  <div class="dept">
    <header class="phead">
      <h1 class="ttl">{{ $t("부서 관리") }}</h1>
      <p class="sub">{{ $t("조직도를 만들고 부서장·유형을 지정합니다. 드래그로 계층과 순서를 바꿀 수 있습니다.") }}</p>
    </header>

    <div class="split">
      <section class="pcard treepane">
        <EntityTree
          ref="treeRef"
          :api="departmentApi"
          label="부서"
          :selected-id="selectedId"
          @select="onSelect"
        />
      </section>

      <section class="pcard detail">
        <template v-if="form.id">
          <h2 class="dttl">{{ $t("부서 정보") }}</h2>

          <label class="fld">
            <span class="form-label">{{ $t("부서명") }}</span>
            <input v-model="form.name" class="field" :placeholder="$t('부서명')" />
          </label>

          <label class="fld">
            <span class="form-label">{{ $t("부서 코드") }}</span>
            <input v-model="form.code" class="field" placeholder="DEPT-CARD" />
          </label>

          <label class="fld">
            <span class="form-label">{{ $t("부서 유형") }}</span>
            <SearchSelect v-model="form.type_id" :options="typeOptions" :placeholder="$t('유형 선택')" />
          </label>

          <label class="fld">
            <span class="form-label">{{ $t("부서장") }}</span>
            <SearchSelect v-model="form.head_employee_id" :options="empOptions" :placeholder="$t('부서장 선택 (선택)')" />
          </label>

          <label class="fld row">
            <span class="form-label">{{ $t("활성화") }}</span>
            <BaseToggle v-model="form.is_active" />
          </label>

          <div class="actions">
            <button class="btn btn-primary" :disabled="saving" @click="save">
              {{ saving ? $t("저장 중…") : $t("저장") }}
            </button>
          </div>
        </template>

        <EmptyState v-else variant="select" :title="$t('부서를 선택하세요')" :desc="$t('좌측 트리에서 부서를 고르면 상세가 표시됩니다.')" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from "vue";
import EntityTree from "@/components/base/EntityTree.vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import BaseToggle from "@/components/base/BaseToggle.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import { departmentApi, employeeApi, categoryApi } from "@/api/hr";
import { useToast } from "vue-toastification";

const toast = useToast();

const treeRef = ref(null);
const selectedId = ref(null);
const saving = ref(false);

const typeOptions = ref([]);
const empOptions = ref([]);

const form = reactive({
  id: null,
  name: "",
  code: "",
  type_id: null,
  head_employee_id: null,
  is_active: true,
  sort: 0,
});

async function onSelect(node) {
  if (!node?.id) {
    form.id = null;
    selectedId.value = null;
    return;
  }
  selectedId.value = node.id;
  const d = await departmentApi.get(node.id);
  form.id = d.id;
  form.name = d.name;
  form.code = d.code;
  form.type_id = d.type_id ?? null;
  form.head_employee_id = d.head_employee_id ?? null;
  form.is_active = d.is_active;
  // 백엔드 sort 스키마(z.coerce.number().int().default(0))는 값이 없으면 0을 채워 넣고
  // 그대로 UPDATE한다. 드래그 정렬로 옮긴 위치가 저장 시 날아가지 않도록 그대로 보존한다.
  form.sort = d.sort;
}

async function save() {
  if (!form.name.trim()) {
    toast.warning("부서명을 입력하세요.");
    return;
  }
  saving.value = true;
  try {
    // SearchSelect의 '지우기' 버튼은 빈 문자열을 emit 하므로, 서버 검증(z.coerce.number().nullish())이
    // 통과하도록 저장 시점에 null로 정규화한다. 실제 id는 항상 양의 정수라 falsy 값(""·0·null)은 안전하게 null로 취급 가능하다.
    await departmentApi.save({
      ...form,
      type_id: form.type_id || null,
      head_employee_id: form.head_employee_id || null,
    });
    toast.success("부서가 저장되었습니다.");
    await treeRef.value?.reload?.();
  } catch (e) {
    toast.error(e?.message || "저장에 실패했습니다.");
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  typeOptions.value = (await categoryApi.list({ group: "department_type", only_active: true }))
    .map((c) => ({ value: c.id, label: c.text }));
  empOptions.value = (await employeeApi.options())
    .map((e) => ({ value: e.id, label: `${e.name} (${e.emp_no})` }));
});
</script>

<style scoped>
.dept { max-width: 1100px; margin: 0 auto; }
.phead { margin-bottom: 1.1rem; }
.ttl { font-size: 1.5rem; font-weight: 700; color: var(--text); }
.sub { margin-top: 0.3rem; font-size: 0.85rem; color: var(--text-muted); }

.split { display: grid; grid-template-columns: 320px 1fr; gap: 1rem; align-items: start; }
.treepane { padding: 0.9rem; min-height: 420px; }
.detail { padding: 1.2rem 1.4rem; min-height: 420px; }
.dttl { font-size: 1rem; font-weight: 600; color: var(--text); margin-bottom: 1rem; }

.fld { display: block; margin-bottom: 0.9rem; }
.fld.row { display: flex; align-items: center; justify-content: space-between; }
.fld.row .form-label { margin-bottom: 0; }

.actions { margin-top: 1.4rem; display: flex; justify-content: flex-end; }

@media (max-width: 900px) {
  .split { grid-template-columns: 1fr; }
}
</style>
