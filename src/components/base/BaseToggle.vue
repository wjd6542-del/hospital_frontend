<template>
  <button
    type="button"
    class="tgl"
    :class="[size, { on: modelValue, dis: disabled }]"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    @click.stop="onClick"
  >
    <span class="knob"></span>
  </button>
</template>

<script setup lang="ts">
// @ts-nocheck
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  size: { type: String, default: "md" }, // md | sm
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);
function onClick() { if (!props.disabled) emit("update:modelValue", !props.modelValue); }
</script>

<style scoped>
.tgl {
  flex-shrink: 0; display: inline-block; position: relative; padding: 0;
  border: 1px solid var(--border-strong); border-radius: var(--radius); background: var(--surface-2);
  box-shadow: var(--shadow-sm);
  cursor: pointer; transition: background 0.18s, box-shadow 0.08s, transform 0.08s; vertical-align: middle;
}
.tgl:hover {  box-shadow: var(--shadow-md); }
.tgl:active {  box-shadow: var(--shadow-sm); }
.tgl.md { width: 56px; height: 34px; }
.tgl.sm { width: 44px; height: 28px; }
.tgl.on { background: var(--positive); }
.knob {
  position: absolute; top: 2px; left: 2px; border-radius: var(--radius);
  background: var(--surface); border: 1px solid var(--border-strong); transition: transform 0.18s;
}
.tgl.md .knob { width: 26px; height: 26px; }
.tgl.sm .knob { width: 20px; height: 20px; }
.tgl.md.on .knob { transform: translateX(22px); }
.tgl.sm.on .knob { transform: translateX(16px); }
.tgl.dis { opacity: 0.5; cursor: not-allowed; }
.tgl.dis:hover, .tgl.dis:active { transform: none; box-shadow: var(--shadow-sm); }
</style>
