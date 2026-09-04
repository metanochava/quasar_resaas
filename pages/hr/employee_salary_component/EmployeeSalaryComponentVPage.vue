<template>
  <q-page class="q-pa-sm">
    <!-- FORM -->
    <div v-if="EmployeeSalaryComponent.loading" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>
    <FormTwo
      v-else
      :store="EmployeeSalaryComponent"
      :ignore-fields="ignoreFields"
      @saved="onSaved"
    />

  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEmployeeSalaryComponentStore } from '../../../stores/EmployeeSalaryComponentStore.js'
import FormTwo from '../../../components/auto/FormTwo.vue'

// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const EmployeeSalaryComponent = useEmployeeSalaryComponentStore()

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

    EmployeeSalaryComponent.resetForm?.()
    return
  }


  // avoids duplicate calls with a safe comparison
  if (String(EmployeeSalaryComponent.row?.id) === String(id)) {
    EmployeeSalaryComponent.form = EmployeeSalaryComponent.row
    return
  }

  EmployeeSalaryComponent.row = await EmployeeSalaryComponent.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await EmployeeSalaryComponent.init()

    const id = route.params.id
    await load(id)

    ready.value = true

  } catch (err) {
    console.error('Error initializing page:', err)
  }
}

// ---------------- WATCH ROUTE (FIXED) ----------------
watch(
  () => route.params,
  async (params) => {
    if (!params) return

    const id = params.id

    // always reloads when the route changes
    await load(id)
  },
  { immediate: false } // init already handles the first load
)

// ---------------- EVENTS ----------------
function onSaved(res) {
  // console.log('Saved successfully', res)
}

// ---------------- LIFECYCLE ----------------
onMounted(init)
</script>
