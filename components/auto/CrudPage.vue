<template>
  <q-page class="q-pa-lg page-container">

    <!-- 🔥 HEADER -->
    <div class="q-mb-md">
      <div class="text-h5 text-weight-bold">
        {{ tdc('Explorar Modelos') }}
      </div>
      <div class="text-subtitle2 text-grey-7">
        {{ tdc('Selecione o módulo e o modelo para visualizar os dados') }}
      </div>
    </div>

    <!-- 🔥 FILTROS -->
    <q-card
      v-if="!route.params.model"
      class="q-mb-md filter-card shadow-1"
    >
      <q-card-section class="row q-col-gutter-md">

        <!-- MÓDULO -->
        <div class="col-12 col-md-6">
          <s-select
            v-model="module"
            :options="modules"
            option-value="name"
            option-label="name"
            emit-value
            map-options
            :label="tdc('Módulo')"
            outlined
            dense
            @update:model-value="loadModelsRelation()"
          />
        </div>

        <!-- MODELO -->
        <div class="col-12 col-md-6">
          <s-select
            v-model="model"
            :options="models"
            :label="tdc('Modelo')"
            outlined
            dense
          />
        </div>

      </q-card-section>
    </q-card>

    <!-- 🔥 CONTEÚDO -->
    <q-card class="crud-card shadow-2">

      <q-card-section>

        <AutoCrud
          :module="module"
          :model="model"
          :can="User.can"
        />

      </q-card-section>

    </q-card>

  </q-page>
</template>

<script setup>
import { HTTPAuth, url } from '../../boot/api'
import AutoCrud from './AutoCrud.vue'
import { useUserStore } from '../../stores/UserStore'

import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { tdc } from '../../boot/base'

const User = useUserStore()
const route = useRoute()

// estado
const module = ref('')
const model = ref('')

const modules = ref([])
const models = ref([])

// carregar módulos
async function loadApps() {
  const { data } = await HTTPAuth.get(
    url({ type: 'u', url: 'api/django_resaas/resaas_modulos/', params: {} })
  )
  modules.value = data.apps
}

// carregar modelos
async function loadModelsRelation() {
  if (!module.value) return

  const { data } = await HTTPAuth.get(
    url({
      type: 'u',
      url: 'api/django_resaas/resaas_modulos/' + module.value,
      params: {}
    })
  )
  models.value = data.models
}

// init
onMounted(async () => {
  await loadApps()
})

// 🔥 WATCH ROTA
watch(
  () => route.params,
  (params) => {
    if (!params?.module || !params?.model) return

    module.value = params.module
    model.value = params.model
  },
  { immediate: true }
)
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* CARD FILTROS */
.filter-card {
  border-radius: 12px;
  background: #fafafa;
}

/* CARD CRUD */
.crud-card {
  border-radius: 14px;
  background: #fff;
}
</style>