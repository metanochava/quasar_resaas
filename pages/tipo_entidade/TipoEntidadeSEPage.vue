<template>
  <q-page class="column q-pa-sm full-height overflow-hidden">

    <q-dialog v-model="openApps" persistent full-height full-width>
      <AppManager :tipoEntidadeId="TipoEntidade.form?.id" />
    </q-dialog>

    <q-dialog v-model="openPermissions" persistent full-height full-width>
      <PermissionManager :tipoEntidadeId="TipoEntidade.form?.id" />
    </q-dialog>

    <q-dialog v-model="openGroups" persistent full-height full-width>
      <GroupManager :tipoEntidadeId="TipoEntidade.form?.id" />
    </q-dialog>

     <q-dialog v-model="openModels" persistent full-height full-width>
      <ModelManager :tipoEntidadeId="TipoEntidade.form?.id" />
    </q-dialog>

    <div class="col overflow-hidden">

      <FormTwo
        v-if="ready"
        class="full-height"
        :schema="TipoEntidade.fields"
        :module="TipoEntidade.app"
        :model="TipoEntidade.model"
        :config="TipoEntidade.config"
        :actions="TipoEntidade.actions"
        :can-do="canDo"
        :ignore-fields="ignoreFields"
        :data="TipoEntidade.form"
        @saved="onSaved"
        centerCol="col-8"
        rightCol="col-4"
      >

        <template #right v-if="TipoEntidade.form?.id">
          <s-card class="q-pa-0 q-gutter-sm " flat>
            <s-btn @click="openApps = !openApps" label="Apps" class="full-width primary outelined" />
            <s-btn @click="openModels = !openModels" label="Models" class="full-width" />
            <s-btn @click="openGroups = !openGroups" label="Groups" class="full-width" />
            <s-btn @click="openPermissionss = !openPermissions" label="Permissions" class="full-width" />
          </s-card>
        </template>

        <template #footer v-if="TipoEntidade.form?.id">
          <div class="col-6">
            <MudarApp :tipoEntidadeId="TipoEntidade.form?.id"/>
          </div>
          <div class="col-6">
            <MudarApp :tipoEntidadeId="TipoEntidade.form?.id"/>
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
import { useTipoEntidadeStore } from './../../stores/TipoEntidadeStore'
import FormTwo from '../../components/auto/FormTwo.vue'

import ModelManager from './ModelManager.vue'
import AppManager from './AppManager.vue'
import GroupManager from '../group/GroupManagerTipoEntidade.vue'
import PermissionManager from '../permission/PermissionManager.vue'
import { tdc } from '../../boot/base'


// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const TipoEntidade = useTipoEntidadeStore()

// ---------------- STATE ----------------
const ready = ref(false)
const openApps = ref(false)
const openPermissions = ref(false)
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

    TipoEntidade.resetForm?.()
    return
  }


  // 🔥 evita chamadas duplicadas com comparação segura
  if (String(TipoEntidade.row?.id) === String(id)) {
    TipoEntidade.form = TipoEntidade.row 
    return
  }

  TipoEntidade.row =  await TipoEntidade.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await TipoEntidade.init()

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

    // 🔥 sempre carrega quando muda rota
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