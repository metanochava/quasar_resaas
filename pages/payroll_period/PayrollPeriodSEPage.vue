<template>
  <q-page class="q-pa-sm">
    <!-- FORM -->
    <div v-if="PayrollPeriod.loading" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>
    <FormTwo
      v-else
      :store="PayrollPeriod"
      :ignore-fields="ignoreFields"
      @saved="onSaved"
    />

  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePayrollPeriodStore } from '../../stores/PayrollPeriodStore'
import FormTwo from '../../components/auto/FormTwo.vue'

// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const PayrollPeriod = usePayrollPeriodStore()

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

    PayrollPeriod.resetForm?.()
    return
  }


  // avoids duplicate calls with a safe comparison
  if (String(PayrollPeriod.row?.id) === String(id)) {
    PayrollPeriod.form = PayrollPeriod.row
    return
  }

  PayrollPeriod.row = await PayrollPeriod.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await PayrollPeriod.init()

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