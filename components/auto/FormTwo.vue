<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { tdc } from '../../boot/base'
import Form from '../engine/FormComponent.vue'

const router = useRouter()

const props = defineProps({
  schema: { type: Array, default: () => [] },
  module: { type: String, required: true },
  model: { type: String, required: true },
  data: { type: Object, default: null },

  canDo: { type: Function, default: null },
  ignoreFields: { type: Array, default: () => [] }
})

const formRef = ref(null)

const isEdit = computed(() => !!props.data?.id)
const saving = ref(false)
function save() {
  formRef.value?.save()
}

function goBack() {
  router.back()
}
</script>

<template>
    <s-card class="full-height column">

      <!-- 🔥 HEADER -->
      <q-card-actions class="q-px-lg q-py-md">
        <div class="text-h5 text-weight-bold">
          {{ isEdit
            ? tdc('Editar') + ' ' + tdc(model)
            : tdc('Novo') + ' ' + tdc(model)
          }}
        </div>
      </q-card-actions>

      <q-separator />

      <!-- 🔥 BODY (cresce + scroll) -->
      <q-card-section class="col scroll q-pa-md">

        <Form
          ref="formRef"
          :schema="schema"
          :module="module"
          :model="model"
          :data="data"
          :can-do="canDo"
          :ignore-fields="ignoreFields"
          @saved="goBack"
        />
        <Form
          ref="formRef"
          :schema="schema"
          :module="module"
          :model="model"
          :data="data"
          :can-do="canDo"
          :ignore-fields="ignoreFields"
          @saved="goBack"
        />
        <Form
          ref="formRef"
          :schema="schema"
          :module="module"
          :model="model"
          :data="data"
          :can-do="canDo"
          :ignore-fields="ignoreFields"
          @saved="goBack"
        />

      </q-card-section>

      <q-separator />

      <!-- 🔥 FOOTER FIXO -->
      <q-card-actions align="right" class="q-pa-md">

        <q-btn
          outelined
          color="grey-7"
          :label="tdc('Cancelar')"
          @click="goBack"
        />

        <q-btn
          color="primary"
          icon="save"
          :label="tdc('Salvar')"
          :loading="saving"
          unelevated
          @click="save"
        />

      </q-card-actions>

    </s-card>
</template>

<style scoped>


</style>