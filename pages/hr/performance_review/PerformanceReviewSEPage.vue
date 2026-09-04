<template>
  <q-page class="q-pa-sm">
    <!-- FORM -->
    <div v-if="PerformanceReview.loading" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>
    <FormTwo
      v-else
      :store="PerformanceReview"
      :ignore-fields="ignoreFields"
      @saved="onSaved"
    />

  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePerformanceReviewStore } from '../../../stores/PerformanceReviewStore.js'
import FormTwo from '../../../components/auto/FormTwo.vue'

// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const PerformanceReview = usePerformanceReviewStore()

// ---------------- STATE ----------------
const ready = ref(false)

const ignoreFields = [
  'id',
  'status',
  'submitted_at',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'deleted_at'
]

// ---------------- LOAD DATA ----------------
async function load(id) {

  if (!id) {

    PerformanceReview.resetForm?.()
    return
  }

  if (String(PerformanceReview.row?.id) === String(id)) {
    PerformanceReview.form = PerformanceReview.row
    return
  }

  PerformanceReview.row = await PerformanceReview.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await PerformanceReview.init()

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
