<script setup>
import { ref, watch } from 'vue'
import Form from '../engine/FormComponent.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },

  schema: { type: Array, default: () => [] },
  module: { type: String, required: true },
  model: { type: String, required: true },
  data: { type: Object, default: null },

  canDo: { type: Function, default: null },
  ignoreFields: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const open = ref(props.modelValue)

watch(() => props.modelValue, v => open.value = v)
watch(open, v => emit('update:modelValue', v))

function close() {
  open.value = false
}
</script>

<template>
  <q-dialog v-model="open">
    <Form
      :schema="schema"
      :module="module"
      :model="model"
      :data="data"
      :can-do="canDo"
      :ignore-fields="ignoreFields"

      @saved="() => { emit('saved'); close() }"
    />
  </q-dialog>
</template>