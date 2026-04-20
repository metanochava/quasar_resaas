<template>
  <div class="q-pa-md">

    <FormSE
      :schema="schema"
      :module="module"
      :model="model"
      :can-do="canDo"
      :ignore-fields="ignoreFields"
      :data="selectedRow"
      @saved="onSaved"
    />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import FormSE from '../../components/auto/FormSaveEdit.vue'
import { buildFormFromSchema } from '../../utils/autoForm'

// ---------------- STATE ----------------
const module = "django_resaas"
const model = "entidade"
const schemaPath = "fields"

const schema = ref([])
const actions = ref([])
const config = ref({})
const selectedRow = ref(null)

const ignoreFields = ref([
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by'
])

// ---------------- PERMISSIONS ----------------
function canDo(perm) {
  if (!perm) return true
  return true
}

// ---------------- INIT ----------------
async function init() {
  try {
    const data = await buildFormFromSchema({
      module,
      model,
      schemaPath
    })

    schema.value = data.schema || []
    actions.value = data.actions || []
    config.value = data.config || {}

  } catch (err) {
    console.error('Erro ao carregar schema:', err)
  }
}

// ---------------- EVENTS ----------------
function onSaved() {
  console.log('Salvo com sucesso')
}

// ---------------- LIFECYCLE ----------------
onMounted(async () => {
  await init()
})
</script>