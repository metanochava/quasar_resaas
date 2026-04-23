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

function save() {
  formRef.value?.save()
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="q-pa-lg page-container">

    <!-- 🔥 HEADER PREMIUM -->
    <div class="header-container q-mb-md">

      <!-- LEFT -->
      <div class="row items-center q-gutter-sm">

        <!-- BACK BUTTON -->
        <q-btn
          flat
          round
          icon="arrow_back"
          @click="goBack"
          class="back-btn"
        />

        <!-- TITLE + BREADCRUMB -->
        <div>
          <div class="text-h5 text-weight-bold">
            {{ isEdit
              ? tdc('Editar') + ' ' + tdc(model)
              : tdc('Novo') + ' ' + tdc(model)
            }}
          </div>

          <!-- BREADCRUMB -->
          <div class="text-caption text-grey-7">
            {{ tdc('Home') }} / {{ tdc(model) }} / 
            {{ isEdit ? tdc('Editar') : tdc('Novo') }}
          </div>
        </div>

      </div>

      <!-- RIGHT ACTIONS -->
      <div class="row items-center q-gutter-sm">

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
          unelevated
          @click="save"
        />

      </div>

    </div>

    <!-- 🔥 CARD FORM -->
    <q-card class="form-card shadow-2">

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

    </q-card>

  </div>
</template>

<style scoped>
.page-container {
  max-width: 1100px;
  margin: 0 auto;
}

/* HEADER */
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* BOTÃO VOLTAR */
.back-btn {
  background: rgba(0,0,0,0.04);
}

/* CARD */
.form-card {
  border-radius: 14px;
  background: #fff;
}
</style>