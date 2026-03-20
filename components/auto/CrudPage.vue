<template>
  <q-page class="q-pa-sm">
    <div class="row q-col-gutter-sm q-pa-0" v-if="!route.params.model ">
      <div class="col">
        <s-select
          v-model="module"
          :options="modules"
          option-value="name"
          option-label="name"
          emit-value
          map-options
          @update:model-value="loadModelsRelation()"
        />
      </div>
      <div class="col">
        <s-select
          v-model="model"
          :options="models"
          :label="tdc('model')"
          outlined
          dense 
        />
      </div>
    </div>

    <AutoCrud :module="module" :model="model" :can="User.can"/>

  </q-page>
</template>

<script setup>

import { HTTPAuth, url } from '../../boot/api'
import AutoCrud from './AutoCrud.vue'
import { UserStore } from '../../stores/AuthStore'

import { ref, watch, onMounted} from 'vue'
import { useRoute } from 'vue-router'
import { tdc } from '../../boot/base'

const User = UserStore()
const route = useRoute()

// estado
const module = ref('')
const model = ref('')

const modules = ref([])
const models = ref([])

async function loadApps() {
  const {data} = await HTTPAuth.get(url({type:'u', url:'/api/django_resaas/modulos/', params:{}}))
  modules.value = data.apps
}

async function loadModelsRelation(){
  const {data} = await HTTPAuth.get(url({type:'u', url:'/api/django_resaas/modulos/'+ module.value, params:{}}))
  models.value = data.models
}
onMounted(async () => {
  await loadApps()
})

// 🔥 WATCH REATIVO DA ROTA
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
