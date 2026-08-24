<template>
  <s-pdf-render
    v-model="showPdf"
    :src="pdfUrl"
    title="Document"
    :top="false"
  />

  <s-auto-table
    v-model:pagination="pagination"
    :app="app"
    :model="model"
    :schema="schema"
    :rows="rows"
    :columns="columns"
    :fields="fields"
    :actions="actions"
    :loading="loading"
    :ignoreFields="ignoreFields"
    :config="config"
    @request="onRequest"
    @create="openCreate"
    @PDF="openPdf"
    @pdfList="openPdfList"
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

  <s-form-modal
    v-model="showForm"
    :store="store"
    :ignoreFields="ignoreFields"
    @saved="onSaved"
    :schema="schema"
    @delete="onDelete"
  />

  <s-auto-filter
    v-model="showFilter"
    :fields="fields"
    :ignoreFields="ignoreFieldsFilter"
    @apply="onApplyFilter"
    :schema="schema"
  />
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { debounce } from 'quasar'
import { tdc } from '../../services/translation'
import { HTTPAuth, HTTPAuthBlob, url } from '../../services/api'
import { buildFormFromSchema } from '../../utils/autoForm'
import {
  resolveActionEndpoint,
  resolvePdfDetailEndpoint
} from '../../utils/schema'
import { useUserStore } from '../../stores/UserStore'

const User = useUserStore()
const emit = defineEmits(['runaction'])



const props = defineProps({
  app: { type: String, required: true },
  model: { type: String, required: true },
  route: {
    type: [String, Object],  default: null
  },
  ignoreFields: {
    type: Array,
    default: () => [  'created_at', 'updated_at', 'created_by', 'updated_by'  ]
  },
  ignoreFieldsFilter: {
    type: Array,
    default: () => [  'created_at', 'updated_at', 'created_by', 'updated_by'  ]
  },

  extraActions: {
    type: Array,
    default: () => []
  }
})

const schema = ref(null)
const fields = ref([])
const actions = ref([])
const config = ref({})
const rows = ref([])
const filters = ref({})
const loading = ref(false)
const showForm = ref(false)
const showFilter = ref(false)
const selectedRow = ref(null)
const showPdf = ref(false)
const pdfUrl = ref(null)

const store = reactive({
  fields: [],
  saving: false,
  app: null,
  model: null,
  data: null,
  form: null
})

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: 'id',
  descending: true
})

const modelEndpoint = computed(
  () =>
    schema.value?.model?.endpoint ||
    `${props.app}/${props.model.toLowerCase()}s/`
)


const columns = computed(() => [
  {
    name: '__actions',
    label: tdc('Actions'),
    field: '__lactions',
    sortable: false,
    align: 'left',
    headerClasses: 'text-left'
  },

  ...fields.value.map(field => ({
    name: field.name,
    label: field.label,
    field: field.name,
    sortable: true,
    align: 'left'
  })),

  {
    name: '__actions',
    label: tdc('Actions'),
    field: '__ractions',
    sortable: false,
    align: 'right',
    headerClasses: 'text-right'
  }
])

const requestParams = computed(() => ({
  page: pagination.value.page,
  page_size: pagination.value.rowsPerPage,
  ordering: pagination.value.sortBy
    ? `${pagination.value.descending ? '-' : ''}${pagination.value.sortBy}`
    : undefined,
  ...filters.value
}))

function endpoint(value, params) {
  return url({ type: 'u', url: value, params })
}

function hasPermission(permission) {
  return !permission || User.can(permission)
}

function showPdfBlob(data) {
  if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value)

  pdfUrl.value = URL.createObjectURL(
    new Blob([data], { type: 'application/pdf' })
  )

  showPdf.value = true
}

async function init() {
  if (!props.app || !props.model) return

  const data = await buildFormFromSchema({
    app: props.app,
    model: props.model
  })

  schema.value = data.schema
  fields.value = data.fields
  actions.value = [...data.actions, ...props.extraActions]
  config.value = data.config

  const ordering = data.schema?.pagination?.default_ordering || '-id'

  Object.assign(pagination.value, {
    rowsPerPage: data.schema?.pagination?.page_size || 10,
    descending: ordering.startsWith('-'),
    sortBy: ordering.replace(/^-/, '')
  })

  Object.assign(store, {
    fields: data.fields,
    app: props.app,
    model: props.model
  })

  await loadData()
}

let lastToken = 0

async function loadData(token = null) {
  if (!schema.value) return

  loading.value = true

  try {
    const { data } = await HTTPAuth.get(
      endpoint(modelEndpoint.value, requestParams.value)
    )

    if (token && token !== lastToken) return

    rows.value = data?.results || data || []
    pagination.value.rowsNumber = data?.count ?? rows.value.length
  } finally {
    if (!token || token === lastToken) loading.value = false
  }
}

function onRequest({ pagination: value }) {
  Object.assign(pagination.value, value)
  loadData()
}

function openCreate() {
  selectedRow.value = null
  store.form = null
  showForm.value = true
}

function openEdit(row) {
  selectedRow.value = row
  store.form = row
  showForm.value = true
}

async function openPdf(row) {
  const pdf = schema.value?.pdf

  if (
    !pdf?.detail ||
    !hasPermission(pdf.detail_permission)
  ) return

  const pdfEndpoint = resolvePdfDetailEndpoint(schema.value, row)
  if (!pdfEndpoint) return

  const { data } = await HTTPAuthBlob.get(endpoint(pdfEndpoint))
  showPdfBlob(data)
}

async function openPdfList() {
  const pdf = schema.value?.pdf

  if (
    !pdf?.list ||
    !hasPermission(pdf.list_permission) ||
    !pdf.list_endpoint
  ) return

  const { data } = await HTTPAuthBlob.get(
    endpoint(pdf.list_endpoint, requestParams.value)
  )

  showPdfBlob(data)
}

async function onDelete(row) {
  if (!hasPermission(schema.value?.permissions?.delete)) return

  await HTTPAuth.delete(
    endpoint(`${modelEndpoint.value}${row.id}/`)
  )

  await loadData()
}

async function onHardDelete(row) {
  if (!hasPermission(schema.value?.permissions?.hard_delete)) return

  await HTTPAuth.delete(
    endpoint(`${modelEndpoint.value}${row.id}/hard_delete/`)
  )

  await loadData()
}

async function onRestore(row) {
  if (!hasPermission(schema.value?.permissions?.restore)) return

  await HTTPAuth.post(
    endpoint(`${modelEndpoint.value}${row.id}/restore/`),
    {}
  )

  await loadData()
}

async function onSaved() {
  showForm.value = false
  await loadData()
}

function clean(object) {
  return Object.fromEntries(
    Object.entries(object || {}).filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        value !== ''
    )
  )
}

function onApplyFilter(payload = {}) {
  const { __resetPage, ...realFilters } = payload

  filters.value = clean({
    ...filters.value,
    ...realFilters
  })

  if (__resetPage) pagination.value.page = 1

  showFilter.value = false
  loadData()
}

async function onInlinePatch({ id, field, value }) {
  if (!hasPermission(schema.value?.permissions?.change)) return

  await HTTPAuth.patch(
    endpoint(`${modelEndpoint.value}${id}/`),
    { [field]: value }
  )

  await loadData()
}

async function onRunAction(action, row) {
  if (!action || !hasPermission(action.permission)) return

  if (action.action) emit('runaction', action, row)

  const actionUrl = resolveActionEndpoint(action, row)
  if (!actionUrl) return

  const method = (action.method || 'POST')
    .split(',')[0]
    .trim()
    .toUpperCase()

  if (method === 'GET') {
    await HTTPAuth.get(endpoint(actionUrl))
  } else {
    await HTTPAuth.request({
      method,
      url: endpoint(actionUrl),
      data: {}
    })
  }

  await loadData()
}

async function onChangeObjects(value) {
  filters.value.objects = value
  pagination.value.page = 1
  await loadData()
}

const onSearch = debounce(async value => {
  const search = (value || '').trim()
  if (filters.value.search === search) return

  const token = ++lastToken

  filters.value = {
    ...filters.value,
    search
  }

  pagination.value.page = 1
  await loadData(token)
}, 400)

watch(
  () => [props.app, props.model],
  ([app, model]) => {
    if (app && model) init()
  },
  { immediate: true }
)
</script>