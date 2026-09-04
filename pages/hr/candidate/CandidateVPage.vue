<template>
  <q-page class="q-pa-sm">
    <div v-if="Candidate.loading" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>
    <FormTwo
      v-else
      :store="Candidate"
      :ignore-fields="ignoreFields"
      @saved="onSaved"
    />
  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCandidateStore } from '../../../stores/CandidateStore.js'
import FormTwo from '../../../components/auto/FormTwo.vue'

const route = useRoute()
const Candidate = useCandidateStore()
const ready = ref(false)

const ignoreFields = [
  'id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
]

async function load(id) {
  if (!id) {
    Candidate.resetForm?.()
    return
  }
  if (String(Candidate.row?.id) === String(id)) {
    Candidate.form = Candidate.row
    return
  }
  Candidate.row = await Candidate.getById(id)
}

async function init() {
  try {
    ready.value = false
    await Candidate.init()
    await load(route.params.id)
    ready.value = true
  } catch (err) {
    console.error('Error initializing page:', err)
  }
}

watch(
  () => route.params,
  async (params) => {
    if (!params) return
    await load(params.id)
  },
  { immediate: false }
)

function onSaved(res) {
}

onMounted(init)
</script>
