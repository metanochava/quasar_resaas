<template>
  <q-page class="q-pa-sm">
    <div v-if="Application.loading" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>
    <!-- status/employee are read_only (workflow-controlled - see
    RecruitmentPipelinePage.vue) so FormTwo only ever shows job_opening/
    candidate/notes here, whether creating or editing. -->
    <FormTwo
      v-else
      :store="Application"
      :ignore-fields="ignoreFields"
      @saved="onSaved"
    />
  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useApplicationStore } from '../../../stores/ApplicationStore.js'
import FormTwo from '../../../components/auto/FormTwo.vue'

const route = useRoute()
const Application = useApplicationStore()
const ready = ref(false)

const ignoreFields = [
  'id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
]

async function load(id) {
  if (!id) {
    Application.resetForm?.()
    return
  }
  if (String(Application.row?.id) === String(id)) {
    Application.form = Application.row
    return
  }
  Application.row = await Application.getById(id)
}

async function init() {
  try {
    ready.value = false
    await Application.init()
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
