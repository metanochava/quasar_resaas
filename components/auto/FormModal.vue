<script setup>
import { ref, computed } from 'vue'
import { tdc } from '../../boot/base'
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

const isEdit = computed(() => !!props.data?.id)

function close() {
  open.value = false
}

function save() {
  formRef.value?.save()
}
</script>

<template>
  <q-dialog v-model="open" persistent >
    <s-card class="dialog-card column no-wrap">

      <!-- 🔥 HEADER PREMIUM -->
      <div class="dialog-header">

        <!-- LEFT -->
        <div>
          <div class="text-h6 text-weight-bold">
            {{ isEdit
              ? tdc('Editar') + ' ' + tdc(model)
              : tdc('Novo') + ' ' + tdc(model)
            }}
          </div>

        </div>

        <q-space />

        <!-- CLOSE -->
        <q-btn
          flat
          round
          dense
          icon="close"
          @click="close"
        >
          <q-tooltip>{{ tdc('Fechar') }}</q-tooltip>
        </q-btn>

      </div>

      <q-separator />

      <!-- 🔥 BODY -->
      <q-card-section class="scroll col dialog-body">

        <div v-if="!schema || !schema.length" class="flex flex-center q-pa-lg">
          <q-spinner size="30px" color="primary" />
        </div>

        <div v-else>
          <Form
            ref="formRef"
            :schema="schema"
            :module="module"
            :model="model"
            :data="data"
            :can-do="canDo"
            :ignore-fields="ignoreFields"
            @saved="() => { emit('saved'); close() }"
          /><Form
            ref="formRef"
            :schema="schema"
            :module="module"
            :model="model"
            :data="data"
            :can-do="canDo"
            :ignore-fields="ignoreFields"
            @saved="() => { emit('saved'); close() }"
          /><Form
            ref="formRef"
            :schema="schema"
            :module="module"
            :model="model"
            :data="data"
            :can-do="canDo"
            :ignore-fields="ignoreFields"
            @saved="() => { emit('saved'); close() }"
          />
          <Form
            ref="formRef"
            :schema="schema"
            :module="module"
            :model="model"
            :data="data"
            :can-do="canDo"
            :ignore-fields="ignoreFields"
            @saved="() => { emit('saved'); close() }"
          /><Form
            ref="formRef"
            :schema="schema"
            :module="module"
            :model="model"
            :data="data"
            :can-do="canDo"
            :ignore-fields="ignoreFields"
            @saved="() => { emit('saved'); close() }"
          />

          <!-- 🔥 PROGRESS -->
          <q-linear-progress
            v-if="uploadProgress > 0"
            :value="uploadProgress / 100"
            color="primary"
            class="q-mt-md"
          />
        </div>

      </q-card-section>

      <q-separator />

      <!-- 🔥 FOOTER -->
      <q-card-actions align="right" class="q-pa-md">

        <q-btn
          outeline
          color="grey-7"
          :label="tdc('Cancelar')"
          @click="close"
        />

        <q-btn
          color="primary"
          unelevated
          icon="save"
          :loading="saving"
          :label="tdc('Salvar')"
          @click="save"
        />

      </q-card-actions>

    </s-card>
  </q-dialog>
</template>

<style scoped>
.dialog-card {
  min-width: 760px;
  max-width: 92vw;
  max-height: 90vh;
  border-radius: 14px;
}

/* HEADER */
.dialog-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
}

/* BODY */
.dialog-body {
  padding: 16px 20px;
}
</style>