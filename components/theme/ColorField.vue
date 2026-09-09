<script setup>
const props = defineProps({
  modelValue: { type: String, default: null },
  label: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

function apply(color) {
  emit('update:modelValue', color)
}
</script>

<template>
  <div class="color-field row items-center no-wrap q-gutter-sm">
    <div class="color-field-swatch cursor-pointer" :style="modelValue ? { backgroundColor: modelValue, backgroundImage: 'none' } : {}">
      <q-icon v-if="!modelValue" name="colorize" size="16px" class="text-grey-6" />

      <q-popup-proxy transition-show="scale" transition-hide="scale">
        <q-color :model-value="modelValue || '#1976D2'" format-model="hex" @update:model-value="apply" />
      </q-popup-proxy>
    </div>

    <s-input
      :model-value="modelValue"
      dense outlined clearable
      :label="label"
      class="col"
      @update:model-value="apply"
    />
  </div>
</template>

<style scoped>
.color-field-swatch {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(128, 128, 128, .35);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 10px 10px;
  background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
}
</style>
