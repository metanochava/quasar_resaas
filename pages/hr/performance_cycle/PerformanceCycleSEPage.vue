<template>
  <q-page class="q-pa-sm">
    <!-- FORM -->
    <div v-if="PerformanceCycle.loading" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>
    <FormTwo
      v-else
      :store="PerformanceCycle"
      :ignore-fields="ignoreFields"
      @saved="onSaved"
    />

  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePerformanceCycleStore } from '../../../stores/PerformanceCycleStore.js'
import FormTwo from '../../../components/auto/FormTwo.vue'

// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const PerformanceCycle = usePerformanceCycleStore()

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

// ---------------- LOAD DATA ----------------
async function load(id) {

  if (!id) {

    PerformanceCycle.resetForm?.()
    return
  }

  if (String(PerformanceCycle.row?.id) === String(id)) {
    PerformanceCycle.form = PerformanceCycle.row
    return
  }

  PerformanceCycle.row = await PerformanceCycle.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await PerformanceCycle.init()

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
