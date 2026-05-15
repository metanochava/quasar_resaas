<template>
  <div class="q-pa-sm">
    <!-- FORM -->
    <div v-if="Employee.loading" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>
    <FormTwo
      v-else
      :store="Employee"
      :ignore-fields="ignoreFields"
      @saved="onSaved"
    />
  </div>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEmployeeStore } from '../../stores/EmployeeStore'
import FormTwo from '../../components/auto/FormTwo.vue'

// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const Employee = useEmployeeStore()

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

    Employee.resetForm?.()
    return
  }


  // 🔥 evita chamadas duplicadas com comparação segura
  if (String(Employee.row?.id) === String(id)) {
    Employee.form = Employee.row 
    return
  }

  Employee.row =  await Employee.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await Employee.init()

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