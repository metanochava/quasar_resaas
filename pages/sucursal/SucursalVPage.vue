<template>
  <q-page class="full-height column">
    <!-- FORM -->
    <FormSE
      v-if="ready"
      :schema="Entidade.fields"
      :module="Entidade.app"
      :model="Entidade.model"
      :config="Entidade.config"
      :actions="Entidade.actions"
      :can-do="canDo"
      :ignore-fields="ignoreFields"
      :data="Entidade.form"
      @saved="onSaved"
    />


    <div v-if="!ready" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>
  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEntidadeStore } from '../../stores/EntidadeStore'
import FormSE from '../../components/auto/FormTwo.vue'

// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const Entidade = useEntidadeStore()

// ---------------- STATE ----------------
const ready = ref(false)

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

    Entidade.resetForm?.()
    return
  }


  // 🔥 evita chamadas duplicadas com comparação segura
  if (String(Entidade.row?.id) === String(id)) {
    Entidade.form = Entidade.row 
    return
  }

  Entidade.row =  await Entidade.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await Entidade.init()

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