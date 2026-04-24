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
  <div class="q-pa-sm ">
    
    <!-- 🔥 CARD FORM -->
    <s-card class="">
      <q-card-actions align="left">
        <div class="text-h5 text-weight-bold  items-left">
          {{ isEdit
            ? tdc('Editar') + ' ' + tdc(model)
            : tdc('Novo') + ' ' + tdc(model)
          }}
        </div>

      </q-card-actions>

      <q-separator />


      <q-card-section class="q-pa-md">

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

      <!-- 🔥 FOOTER -->
      <q-card-actions align="right" class="q-pa-md">

        <q-btn
            flat
            color="grey-7"
            icon="close"
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

  </div>
</template>

<style scoped>


</style>