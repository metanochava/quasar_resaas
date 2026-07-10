
<template>

    <PdfRender
      v-model="showPdf"
      :src="pdfUrl"
      title="Document"
    />

    

    <AutoTable
      :app="app"
      :model="model"
      :rows="rows"
      :columns="columns"
      :schema="schema"
      :actions="actions"
      :loading="loading"
      :pagination="pagination"
      :ignoreFields="ignoreFields"
      :config = "config"

      @request="onRequest"
      @create="openCreate"
      @pdf="openPdf"
      @edit="openEdit"
      @delete="onDelete"
      @filter="showFilter = true"
      @inline-patch="onInlinePatch"
      @run-action="onRunAction"
      @refresh="loadData"

      @objects="onChangeObjects"
      @hard_delete="onHardDelete"
      @restore="onRestore"
      @search="onSearch"
    />


    <FormModal
      v-model="showForm"
      :store="store"
      :ignoreFields="ignoreFields"
      @saved="onSaved"
    />



    <AutoFilter
      v-model="showFilter"
      :schema="schema"
      :ignoreFields="ignoreFields"

      @apply="onApplyFilter"
    />

</template>
<script setup>
import { ref, computed, watch, defineEmits } from 'vue'
import { debounce } from 'quasar'
import AutoTable from './AutoTable.vue'
import FormModal from './FormModal.vue'
import AutoFilter from './AutoFilter.vue'
import PdfRender from './../PdfRender.vue'
import { HTTPAuth, HTTPAuthBlob, url } from '../../boot/api'
import { buildFormFromSchema } from '../../utils/autoForm'
import { useUserStore } from 'quasar_resaas'

const User =useUserStore()

const emit = defineEmits([
  'runaction'
])
// --- props ---
const props = defineProps({
  app: { type: String, required: true },
  model: { type: String, required: true },
  route: { type: [String, Object], default: null },
  ignoreFields: { type: Array, default: () =>  ['created_at','updated_at', 'created_by', 'updated_by'] },
  actions: { type: Array, default: () =>  ['created_at','updated_at', 'created_by', 'updated_by'] },
})

// --- state ---
const schema = ref([])
const actions = ref([])
const config = ref({})
const rows = ref([])
const loading = ref(false)

const showForm = ref(false)
const showFilter = ref(false)
const selectedRow = ref(null)

const showPdf = ref(false)
const pdfUrl = ref(null)

import { reactive } from 'vue'

const store = reactive({
  fields: [],
  saving: false,
  app: null,
  model: null,
  data: null
})


const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: 'id',
  descending: true,
})

const filters = ref({})

// --- computed columns ---
const columns = computed(() => {

  const base = schema.value.map(f => ({
    name: f.name,
    label: f.label,
    field: f.name,
    sortable: true,
    align: 'left',
  }))

  base.push({ name: '__actions', label: 'Ações', field: '__actions', sortable: false })

  const columns = [ {  name: '__actions',label: 'Ações', field: '__actions', sortable: false  }, ...base ]
    
  return columns
})



// --- INIT ---
async function init() {
  if (!props.app || !props.model) return

  const data = await buildFormFromSchema({
    app: props.app,
    model: props.model,
    schemaPath: 'fields',
  })

  schema.value = data.fields
  actions.value = [...data.actions, ...props.actions]
  config.value = data.config

  store.fields = data.fields
  store.app= props.app
  store.model= props.model


  await loadData()
}

// --- LOAD DATA (SOURCE OF TRUTH) ---
let lastToken = 0

async function loadData(token = null) {
  loading.value = true

  try {
    const params = {
      page: pagination.value.page,
      page_size: pagination.value.rowsPerPage,
      ordering: pagination.value.sortBy
        ? `${pagination.value.descending ? '-' : ''}${pagination.value.sortBy}`
        : undefined,
      ...filters.value,
    }

    const { data } = await HTTPAuth.get(
      url({
        type: 'u',
        url: `${props.app}/${props.model.toLowerCase()}s/`,
        params
      })
    )

    // 🔥 IGNORA resposta antiga
    if (token && token !== lastToken) return

    rows.value = data?.results || data || []
    pagination.value.rowsNumber = data?.count ?? rows.value.length

  } finally {
    if (!token || token === lastToken) {
      loading.value = false
    }
  }
}

// --- EVENTS ---
function onRequest(req) {
  pagination.value = req.pagination
  loadData()
}

function openCreate() {
  selectedRow.value = null
  store.form = null
  showForm.value = true
}

function openEdit(row) {
  selectedRow.value = row
  store.form =row
  showForm.value = true
}

 
async function openPdf(row) {
  const res = await HTTPAuthBlob.get(url({
    type: 'u',
    url: `${props.app}/${props.model.toLowerCase()}s/${row.id}/pdf/`
  }))

  const blob = new Blob([res.data], { type: 'application/pdf' })
  pdfUrl.value = URL.createObjectURL(blob)

  showPdf.value = true
}


async function onDelete(row) {
  await HTTPAuth.delete(url({
    type: 'u',
    url: `${props.app}/${props.model.toLowerCase()}s/${row.id}/`
  }))
  await loadData()
}

async function onHardDelete(row) {
  await HTTPAuth.delete(url({
    type: 'u',
    url: `${props.app}/${props.model.toLowerCase()}s/${row.id}/hard_delete/`
  }))
  await loadData()
}

async function onRestore(row) {
  await HTTPAuth.post(url({
    type: 'u',
    url: `${props.app}/${props.model.toLowerCase()}s/${row.id}/restore/`
  }), {})
  await loadData()
}

async function onSaved() {
  showForm.value = false
  await loadData()
}

// --- FILTER ---
function clean(obj) {
  const out = {}
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') {
      out[k] = v
    }
  })
  return out
}

function onApplyFilter(payload) {
  filters.value = clean({
    ...filters.value,
    ...(payload || {})
  })

  pagination.value.page = 1
  showFilter.value = false
  loadData()
}

// --- INLINE PATCH ---
async function onInlinePatch({ id, field, value }) {
  await HTTPAuth.patch(
    url({ type: 'u', url: `${props.app}/${props.model.toLowerCase()}s/${id}/` }),
    { [field]: value }
  )
  await loadData()
}

// --- ACTION ---
async function onRunAction({ action, row }) {
  console.log({ action, row })
  if (action.action){
    emit('runaction', action, row)
  }
  if (action?.permission && !User.can(action.permission)) return

  const actionUrl = action.url?.startsWith('http')
    ? action.url
    : `${action.url?.replace(/^\//, '')}`

  const method = (action.method || 'POST').toUpperCase()

  if (method === 'GET') {
    await HTTPAuth.get(url({ type: 'u', url: actionUrl, params: { id: row?.id } }))
  } else {
    await HTTPAuth.request({
      method,
      url: url({ type: 'u', url: actionUrl }),
      data: row?.id ? { id: row.id } : {},
    })
  }

  await loadData()
}

// --- OBJECT FILTER ---
async function onChangeObjects(val) {
  filters.value.objects = val
  pagination.value.page = 1
  await loadData()
}

// --- SEARCH (FINAL VERSION 🔥) ---
const onSearch = debounce(async (val) => {
  const clean = (val || '').trim()

  // evita chamadas iguais
  if (filters.value.search === clean) return

  const token = ++lastToken

  filters.value = {
    ...filters.value,
    search: clean || undefined
  }

  pagination.value.page = 1

  await loadData(token)

}, 400)

// --- WATCH ---
watch(
  () => props.model,
  async (model) => {
    if (!model) return
    await init()
  },
  { immediate: true }
)
</script>
