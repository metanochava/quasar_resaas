<template>
  <q-page class="q-pa-sm">
    <!-- FORM -->
    <div v-if="JobOpening.loading" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>
    <FormTwo
      v-else
      :store="JobOpening"
      :ignore-fields="ignoreFields"
      @saved="onSaved"
    />

  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useJobOpeningStore } from '../../../stores/JobOpeningStore.js'
import FormTwo from '../../../components/auto/FormTwo.vue'

// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const JobOpening = useJobOpeningStore()

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

    JobOpening.resetForm?.()
    return
  }


  if (String(JobOpening.row?.id) === String(id)) {
    JobOpening.form = JobOpening.row
    return
  }

  JobOpening.row = await JobOpening.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await JobOpening.init()

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

    const id = params.id
    await load(id)
  },
  { immediate: false }
)

// ---------------- EVENTS ----------------
function onSaved(res) {
}

// ---------------- LIFECYCLE ----------------
onMounted(init)
</script>
