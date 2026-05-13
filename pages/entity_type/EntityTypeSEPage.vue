<template>
  <q-page class="column q-pa-sm full-height overflow-hidden">

    <q-dialog v-model="openApps" persistent full-height full-width>
      <AppManager :entityTypeId="EntityType.form?.id" />
    </q-dialog>



    <q-dialog v-model="openGroups" persistent full-height full-width>
      <GroupManager :entityTypeId="EntityType.form?.id" />
    </q-dialog>

     <q-dialog v-model="openModels" persistent full-height full-width>
      <ModelManager :entityTypeId="EntityType.form?.id" />
    </q-dialog>

    <div class="col overflow-hidden">

      <FormTwo
        v-if="ready"
        class="full-height"
        :schema="EntityType.fields"
        :app="EntityType.app"
        :model="EntityType.model"
        :config="EntityType.config"
        :actions="EntityType.actions"
        :can-do="canDo"
        :ignore-fields="ignoreFields"
        :data="EntityType.form"
        @saved="onSaved"
        centerCol="col-8"
        rightCol="col-4"
      >

        <template #right v-if="EntityType.form?.id">
          <s-card class="q-pa-0 q-gutter-sm " flat>
            <s-btn @click="openApps = !openApps" label="Apps" class="full-width primary outelined" />
            <s-btn @click="openModels = !openModels" label="Models" class="full-width" />
            <s-btn @click="openGroups = !openGroups" label="Groups" class="full-width" />
          </s-card>
        </template>

        <template #footer v-if="EntityType.form?.id">
          <div class="col-6">
            <MudarApp :entityTypeId="EntityType.form?.id"/>
          </div>
          <div class="col-6">
            <MudarApp :entityTypeId="EntityType.form?.id"/>
          </div>
        </template>

      </FormTwo>

    </div>

    <div v-if="!ready" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>

  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEntityTypeStore } from '../../stores/EntityTypeStore'
import FormTwo from '../../components/auto/FormTwo.vue'

import ModelManager from './ModelManager.vue'
import AppManager from './AppManager.vue'
import GroupManager from '../group/GroupManagerEntityType.vue'
import { tdc } from '../../boot/base'


// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const EntityType = useEntityTypeStore()

// ---------------- STATE ----------------
const ready = ref(false)
const openApps = ref(false)
const openGroups = ref(false)
const openModels = ref(false)


const ignoreFields = [
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'deleted_at'
]

// ---------------- PERMISSIONS ----------------
function canDo(perm) {
  if (!perm) return true
  return true
}

// ---------------- LOAD DATA ----------------
async function load(id) {

  if (!id) {

    EntityType.resetForm?.()
    return
  }


  // 🔥 evita chamadas duplicadas com comparação segura
  if (String(EntityType.row?.id) === String(id)) {
    EntityType.form = EntityType.row 
    return
  }

  EntityType.row =  await EntityType.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await EntityType.init()

    const id = route.params.id
    await load(id)

    ready.value = true

  } catch (err) {
    console.error('Erro ao inicializar página:', err)
  }
}

// ---------------- WATCH ROTA (CORRIGIDO) ----------------
watch(
  () => route.params,
  async (params) => {
    if (!params) return

    const id = params.id

    // 🔥 sempre carrega quando muda route
    await load(id)
  },
  { immediate: false } // init já trata o primeiro carregamento
)

// ---------------- EVENTS ----------------
function onSaved(res) {
  // console.log('Salvo com sucesso', res)
}

// ---------------- LIFECYCLE ----------------
onMounted(init)
</script>