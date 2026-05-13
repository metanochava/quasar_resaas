<template>
  
  <q-page class="q-pa-sm">


      <q-dialog v-model="openGroups" persistent full-height full-width>
        <GroupManager  :entityId="Entity.form?.id" />
      </q-dialog>

    <!-- FORM -->
    <FormTwo
      v-if="ready"
      :schema="Entity.fields"
      :app="Entity.app"
      :model="Entity.model"
      :config="Entity.config"
      :actions="Entity.actions"
      :can-do="canDo"
      :ignore-fields="ignoreFields"
      :data="Entity.form"
      @saved="onSaved"
    >

      <template #right v-if="Entity.form?.id">
          <s-card class="q-pa-0 q-gutter-sm " flat>
            <s-btn @click="openGroups = !openGroups" label="Groups" color="primary" class="full-width" />
          </s-card>
        </template>

        <template #footer v-if="Entity.form?.id">
          
        </template>

    </FormTwo>
 

    <div v-if="!ready" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>
  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEntityStore } from '../../stores/EntityStore'
import FormTwo from '../../components/auto/FormTwo.vue'



import GroupManager from '../group/GroupManagerEntity.vue'


// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const Entity = useEntityStore()

// ---------------- STATE ----------------
const ready = ref(false)
const openGroups = ref(false)
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

    Entity.resetForm?.()
    return
  }

  // 🔥 evita chamadas duplicadas com comparação segura
  if (String(Entity.row?.id) === String(id)) {
    Entity.form = Entity.row 
    return
  }

  Entity.row =  await Entity.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await Entity.init()

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