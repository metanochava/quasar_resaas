<script setup>
import { ref, computed } from 'vue'
import { tdc } from '../../boot/base'
import Form from '../engine/FormComponent.vue'
import { useUserStore }  from '../../stores/UserStore'



const User =useUserStore()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  store: { default: () => [] },
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

const isEdit = computed(() => !!props.store.form?.id)

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
        <div class="text-h5 text-weight-bold ">
          {{ isEdit
            ? tdc('Editar') + ' ' + tdc(store.model)
            : tdc('Novo') + ' ' + tdc(store.model )
          }}
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

        <div v-if="!store?.fields || !store?.fields?.length" class="flex flex-center q-pa-lg">
          <q-spinner size="30px" color="primary" />
        </div>

        <div v-else>
          <Form
            ref="formRef"
            :store="store"
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

        <s-btn v-if="User.can('change_' + (store.model || '').toLowerCase()) && isEdit"
          color="secondary"
          unelevated
          icon="save"
          :loading="store.saving"
          :label="tdc('Edit')"
          @click="save"
        />
        <s-btn v-if="User.can('add_' + (store.model || '').toLowerCase()) && isEdit"
          color="primary"
          unelevated
          icon="save"
          :loading="store.saving"
          :label="tdc('Save')"
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