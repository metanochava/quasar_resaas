<template>
  <q-page class="q-pa-lg page-container">

    <div class="q-mb-md">
      <div class="text-h5 text-weight-bold">
        {{ tdc('Explore Models') }}
      </div>

      <div class="text-subtitle2 text-grey-7">
        {{ tdc('Select the module and model to view the data') }}
      </div>
    </div>

    <q-card
      v-if="!hasRouteModel"
      class="q-mb-md filter-card shadow-1"
    >
      <q-card-section class="row q-col-gutter-md">

        <div class="col-12 col-md-6">
          <s-select
            v-model="app"
            :options="apps"
            option-value="name"
            option-label="name"
            emit-value
            map-options
            :label="tdc('Module')"
            outlined
            dense
            clearable
          />
        </div>

        <div class="col-12 col-md-6">
          <s-select
            v-model="model"
            :options="models"
            option-value="name"
            option-label="name"
            emit-value
            map-options
            :label="tdc('Model')"
            outlined
            dense
            clearable
            :disable="!app"
          />
        </div>

      </q-card-section>
    </q-card>

    <q-card
      v-if="app && model"
      class="crud-card shadow-2"
    >
      <q-card-section>
        <AutoCrud
          :key="`${app}:${model}`"
          :app="app"
          :model="model"
        />
      </q-card-section>
    </q-card>

    <div
      v-else-if="!hasRouteModel"
      class="flex flex-center q-pa-xl text-grey-7"
    >
      {{ tdc('Select a module and model') }}
    </div>

  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import { HTTPAuth, url } from '../services/api'
import { tdc } from '../services/translation'

import AutoCrud from '../components/auto/AutoCrud.vue'

const route = useRoute()

const app = ref('')
const model = ref('')

const apps = ref([])
const models = ref([])

const hasRouteModel = computed(() =>
  Boolean(
    route.params?.app &&
    route.params?.model
  )
)

async function loadApps() {
  const { data } = await HTTPAuth.get(
    url({
      type: 'u',
      url: 'django_resaas/resaasapps/',
      params: {}
    })
  )

  apps.value = data?.apps || []
}

async function loadModels() {
  models.value = []
  model.value = ''

  if (!app.value) return

  const { data } = await HTTPAuth.get(
    url({
      type: 'u',
      url: `django_resaas/resaasapps/${app.value}/`,
      params: {}
    })
  )

  models.value = data?.models || []
}

async function applyRoute() {
  const routeApp = route.params?.app
  const routeModel = route.params?.model

  if (!routeApp || !routeModel) return

  app.value = String(routeApp)

  await loadModels()

  model.value = String(routeModel)
}

watch(
  app,
  async (value, oldValue) => {
    if (!value) {
      models.value = []
      model.value = ''
      return
    }

    if (
      hasRouteModel.value &&
      value === route.params?.app
    ) {
      return
    }

    if (value !== oldValue) {
      await loadModels()
    }
  }
)

watch(
  () => [
    route.params?.app,
    route.params?.model
  ],
  async () => {
    await applyRoute()
  }
)

onMounted(async () => {
  await loadApps()

  if (hasRouteModel.value) {
    await applyRoute()
  }
})
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

.filter-card,
.crud-card {
  border-radius: 12px;
}
</style>