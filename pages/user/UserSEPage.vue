<template>
  <q-page class="q-pa-sm">
    <!-- FORM -->
    <FormTwo
      v-if="ready"
      :schema="User.fields"
      :app="User.app"
      :model="User.model"
      :config="User.config"
      :actions="User.actions"
      :can-do="canDo"
      :ignore-fields="ignoreFields"
      :data="User.form"
      @saved="onSaved"
    />
    
    <div v-if="!ready" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>
  </q-page >
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../../stores/UserStore'
import FormTwo from '../../components/auto/FormTwo.vue'

// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const User = useUserStore()

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

    User.resetForm?.()
    return
  }


  // 🔥 evita chamadas duplicadas com comparação segura
  if (String(User.row?.id) === String(id)) {
    User.form = User.row 
    return
  }

  User.row =  await User.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await User.init()

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