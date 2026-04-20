<script setup>
import { ref } from 'vue'
import Form from '../engine/FormComponent.vue'

const props = defineProps({
  schema: { type: Array, default: () => [] },
  module: { type: String, required: true },
  model: { type: String, required: true },
  data: { type: Object, default: null },

  canDo: { type: Function, default: null },
  ignoreFields: { type: Array, default: () => [] }
})

const formRef = ref(null)

function save() {
  formRef.value?.save()
}
</script>

<template>
  <div class="q-pa-md">

    <div class="text-h6 q-mb-md">
      {{ data?.id ? 'Editar' : 'Novo' }}
    </div>

    <Form
      ref="formRef"
      :schema="schema"
      :module="module"
      :model="model"
      :data="data"
      :can-do="canDo"
      :ignore-fields="ignoreFields"

      @saved="$router.back()"
    />

    <q-btn
      color="primary"
      label="Salvar"
      @click="save"
    />

  </div>
</template>