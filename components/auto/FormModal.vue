<script setup>
import { ref, computed } from 'vue'
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

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const formRef = ref(null)
const saving = ref(false)
const uploadProgress = ref(0)

function close() {
  open.value = false
}

function save() {
  formRef.value?.save()
}
</script>

<template>
  <q-dialog v-model="open">
    <s-card style="min-width: 760px; max-width: 92vw;">
      {{ formRef.form }}
      
      <q-bar class="row items-center justify-between bg-primary text-white">
        <div class="text-h6">
          {{ data?.id ? 'Editar' : 'Novo' }}
        </div>
        <s-btn dense flat icon="close" @click="close">
          <q-tooltip>Fechar</q-tooltip>
        </s-btn>
      </q-bar>

      <q-separator />

      <q-card-section v-if="!schema || !schema.length">
        <q-spinner />
      </q-card-section>

      <q-card-section v-else class="row q-col-gutter-sm">
        <Form
          ref="formRef"
          :schema="schema"
          :module="module"
          :model="model"
          :data="data"
          :can-do="canDo"
          :ignore-fields="ignoreFields"
          @saved="() => { emit('saved'); close() }"
        />

        <q-linear-progress v-if="uploadProgress > 0" :value="uploadProgress/100" />
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <s-btn flat label="Cancelar" @click="close" />
        <s-btn color="primary" :loading="saving" label="Salvar" @click="save" />
      </q-card-actions>

    </s-card>
  </q-dialog>
</template>