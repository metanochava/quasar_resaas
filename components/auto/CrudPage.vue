<template>
  <q-page class="q-pa-lg page-container">

    <!-- 🔥 HEADER -->
    <div class="q-mb-md">
      <div class="text-h5 text-weight-bold">
        {{ tdc('Explorar Modelos') }}
      </div>
      <div class="text-subtitle2 text-grey-7">
        {{ tdc('Selecione o módulo e o model para visualizar os dados') }}
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
            v-model="app"
            :options="apps"
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
          :app="app"
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
const app = ref('')
const model = ref('')

const apps = ref([])
const models = ref([])

// carregar módulos
async function loadApps() {
  const { data } = await HTTPAuth.get(
    url({ type: 'u', url: 'django_resaas/resaasapps/', params: {} })
  )
  apps.value = data.apps
}

// carregar models
async function loadModelsRelation() {
  if (!app.value) return

  const { data } = await HTTPAuth.get(
    url({
      type: 'u',
      url: 'django_resaas/resaasapps/' + app.value,
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
    if (!params?.app || !params?.model) return

    app.value = params.app
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