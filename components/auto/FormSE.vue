<script setup>
import { ref } from 'vue'
import Form from '../engine/FormComponent.vue'

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
      v-bind="props"
      @saved="$router.back()"
    />

    <q-btn
      color="primary"
      label="Salvar"
      @click="save"
    />

  </div>
</template>