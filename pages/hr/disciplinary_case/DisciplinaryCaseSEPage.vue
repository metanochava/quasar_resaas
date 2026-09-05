<template>
  <q-page class="q-pa-sm">
    <!-- FORM -->
    <div v-if="DisciplinaryCase.loading" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>
    <FormTwo
      v-else
      :store="DisciplinaryCase"
      :ignore-fields="ignoreFields"
      @saved="onSaved"
    />

  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDisciplinaryCaseStore } from '../../../stores/DisciplinaryCaseStore.js'
import FormTwo from '../../../components/auto/FormTwo.vue'

// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const DisciplinaryCase = useDisciplinaryCaseStore()

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

    DisciplinaryCase.resetForm?.()
    return
  }


  // avoids duplicate calls with a safe comparison
  if (String(DisciplinaryCase.row?.id) === String(id)) {
    DisciplinaryCase.form = DisciplinaryCase.row
    return
  }

  DisciplinaryCase.row = await DisciplinaryCase.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await DisciplinaryCase.init()

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
