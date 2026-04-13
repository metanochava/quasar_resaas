<script setup>
import { ref, watch } from 'vue'
import Form from '../engine/FormComponent.vue'

const props = defineProps({
  modelValue: Boolean,
  ...Object
})

const emit = defineEmits(['update:modelValue','saved'])

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
      v-bind="props"
      @saved="() => { emit('saved'); close() }"
    />
  </q-dialog>
</template>