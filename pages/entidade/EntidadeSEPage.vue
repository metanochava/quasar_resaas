<template>
  <div class="q-pa-md">

    <!-- FORM -->
    <FormSE
      v-if="ready"
      :schema="store.campos"
      :module="store.app"
      :model="store.model"
      :config="store.config"
      :actions="store.actions"
      :can-do="canDo"
      :ignore-fields="ignoreFields"
      :data="store.form"
      @saved="onSaved"
    />

    <!-- LOADING -->
    <div v-else class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEntidadeStore } from './../../stores/EntidadeStore'
import FormSE from '../../components/auto/FormSaveEdit.vue'

// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const store = useEntidadeStore()

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
  // 🔥 evita chamadas duplicadas
  if (id && store.row?.id === id) return

  if (id) {
    await store.getById(id)
  } else {
    store.resetForm?.()
  }
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await store.init()

    const id = route.params.id
    await load(id)

    ready.value = true

  } catch (err) {
    console.error('Erro ao inicializar página:', err)
  }
}

// ---------------- WATCH ROUTE ----------------
watch(
  () => route.params.id,
  async (id) => {
    await load(id)
  }
)

// ---------------- EVENTS ----------------
function onSaved(res) {
  console.log('Salvo com sucesso', res)

  // opcional
  // store.getAll?.()
}

// ---------------- LIFECYCLE ----------------
onMounted(init)
</script>