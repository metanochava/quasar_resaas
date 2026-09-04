<template>
  <q-page class="q-pa-sm">
    <!-- FORM -->
    <div v-if="EmployeeGoal.loading" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>
    <FormTwo
      v-else
      :store="EmployeeGoal"
      :ignore-fields="ignoreFields"
      @saved="onSaved"
    />

  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEmployeeGoalStore } from '../../../stores/EmployeeGoalStore.js'
import FormTwo from '../../../components/auto/FormTwo.vue'

// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const EmployeeGoal = useEmployeeGoalStore()

// ---------------- STATE ----------------
const ready = ref(false)

const ignoreFields = [
  'id',
  'progress',
  'status',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'deleted_at'
]

// ---------------- LOAD DATA ----------------
async function load(id) {

  if (!id) {

    EmployeeGoal.resetForm?.()
    return
  }

  if (String(EmployeeGoal.row?.id) === String(id)) {
    EmployeeGoal.form = EmployeeGoal.row
    return
  }

  EmployeeGoal.row = await EmployeeGoal.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await EmployeeGoal.init()

    const id = route.params.id
    await load(id)

    ready.value = true

  } catch (err) {
    console.error('Error initializing page:', err)
  }
}

// ---------------- WATCH ROUTE ----------------
watch(
  () => route.params,
  async (params) => {
    if (!params) return
    await load(params.id)
  },
  { immediate: false }
)

// ---------------- EVENTS ----------------
function onSaved(res) {
}

// ---------------- LIFECYCLE ----------------
onMounted(init)
</script>
