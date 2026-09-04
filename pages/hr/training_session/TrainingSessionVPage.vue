<template>
  <q-page class="q-pa-sm">
    <!-- FORM -->
    <div v-if="TrainingSession.loading" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>
    <FormTwo
      v-else
      :store="TrainingSession"
      :ignore-fields="ignoreFields"
      @saved="onSaved"
    />

    <s-card v-if="TrainingSession.row?.id" class="q-mt-md">
      <q-card-section class="row items-center">
        <div class="col text-subtitle2">{{ tdc('Enrollments') }}</div>
        <div class="col-auto">
          <s-btn
            flat
            dense
            :label="tdc('Manage enrollments')"
            :to="{ name: 'list_trainingsession', query: { session: TrainingSession.row.id } }"
          />
        </div>
      </q-card-section>
    </s-card>

  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTrainingSessionStore } from '../../../stores/TrainingSessionStore.js'
import FormTwo from '../../../components/auto/FormTwo.vue'
import { tdc } from '../../../services/translation.js'

// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const TrainingSession = useTrainingSessionStore()

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

    TrainingSession.resetForm?.()
    return
  }

  if (String(TrainingSession.row?.id) === String(id)) {
    TrainingSession.form = TrainingSession.row
    return
  }

  TrainingSession.row = await TrainingSession.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await TrainingSession.init()

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
