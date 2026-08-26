<script setup>
import { ref, computed, watch } from 'vue'
import { tdc } from '../../services/translation'
import { useRouter } from 'vue-router'

import { useActionStore } from '../../stores/ActionStore'
import { useUserStore } from '../../stores/UserStore'


const User =useUserStore()

const actionStore = useActionStore()


function resolveValue(val) {
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val

    // 🔥 ARRAY (M2M)
    if (Array.isArray(parsed)) {
      return parsed.map(x => x?.label || x).join(', ')
    }

    // 🔥 OBJETO (FK)
    if (parsed && typeof parsed === 'object') {
      if ('label' in parsed) return parsed.label
      if ('url' in parsed) return parsed.url
    }

    return val
  } catch {
    return val
  }
}

function isBoolean(val) {
  return ['true','false', true, false].includes(val)
}

function toBoolean(val) {
  return ['true', true].includes(val)
}
const preview = ref({
  show: false,
  url: ''
})

// detectar imagem
function isImage(val) {
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val
    return parsed && parsed.url
  } catch {
    return false
  }
}

// obter URL
function getImageUrl(val) {
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val
    return parsed?.url || ''
  } catch {
    return ''
  }
}

// open preview
function openPreview(url) {
  preview.value.url = url
  preview.value.show = true
}

// ---------------- PROPS ----------------
const props = defineProps({
  app: { type: String, default:'' },
  model:  { type: String, default:'' },
  rows: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  fields: { type: Array, default: () => [] },

  loading: { type: Boolean, default: false },
  pagination: { type: Object, required: true },

  actions: { type: Array, default: () => [] },

  schema: { type: Object, default: () => ({}) },
  config: { type: Object, default: () => ({}) },

  ignoreFields: { type: Array, default: () =>  ['id', 'created_at','updated_at', 'created_by', 'updated_by'] } 
})

const router = useRouter()

const showConfirm = ref(false)
const actionType = ref(null) // 'delete' | 'hard_delete'
const selectedRow = ref(null)

const search = ref('')
const ignoreSet = computed(() => new Set(props.ignoreFields))

// ---------------- EMITS ----------------
const emit = defineEmits([
  'request',
  'create',
  'pdf',
  'pdfList',
  'edit',
  'delete',
  'filter',
  'refresh',
  'inline-patch',
  'run-action',
  'update:pagination',

  'objects', // criado por Metano
  'hard_delete',
  'restore',
  'search',
])

// ---------------- LOCAL STATE (FIX V-MODEL) ----------------
const localPagination = ref({ ...props.pagination })

watch(
  () => props.pagination,
  val => {

    localPagination.value = {
      ...val
    }

  },
  {
    deep: true
  }
)


const show_filter = ref(false)

// ---------------- UI STATE ----------------
const visibleColumns = ref([])

const permissions = computed(() => ({
  list: props.schema?.permissions?.list || `list_${props.model.toLowerCase()}`,
  view: props.schema?.permissions?.view || `view_${props.model.toLowerCase()}`,
  add: props.schema?.permissions?.add || `add_${props.model.toLowerCase()}`,
  change: props.schema?.permissions?.change || `change_${props.model.toLowerCase()}`,
  delete: props.schema?.permissions?.delete || `delete_${props.model.toLowerCase()}`,
  restore: props.schema?.permissions?.restore || `restore_${props.model.toLowerCase()}`,
  hard_delete: props.schema?.permissions?.hard_delete || `hard_delete_${props.model.toLowerCase()}`,
  pdf: props.schema?.permissions?.pdf || `pdf_${props.model.toLowerCase()}`,
  pdf_list: props.schema?.permissions?.pdf_list || `pdf_list_${props.model.toLowerCase()}`,
  custom: props.schema?.permissions?.custom || {}
}))

const schemaUi = computed(() => ({
  title: props.schema?.ui?.title || props.model,
  crud: props.schema?.ui?.crud ?? props.config?.crud ?? true,
  dense: props.schema?.ui?.dense ?? true,
  striped: props.schema?.ui?.striped ?? true,
  show_search: props.schema?.ui?.show_search ?? true,
  show_filters: props.schema?.ui?.show_filters ?? true,
  show_columns: props.schema?.ui?.show_columns ?? true,
  show_refresh: props.schema?.ui?.show_refresh ?? true,
  show_pdf: props.schema?.ui?.show_pdf ?? true,
  show_pdf_list: props.schema?.ui?.show_pdf_list ?? true
}))

const schemaPdf = computed(() => ({
  enabled: props.schema?.pdf?.enabled ?? true,
  detail: props.schema?.pdf?.detail ?? true,
  list: props.schema?.pdf?.list ?? true,
  detail_permission: props.schema?.pdf?.detail_permission || permissions.value.pdf,
  list_permission: props.schema?.pdf?.list_permission || permissions.value.pdf_list
}))

const rowsPerPageOptions = computed(() =>
  props.schema?.pagination?.page_size_options || [10, 20, 50, 100, 200, 500, 1000, 0]
)

function can(permission) {
  if (!permission) return false
  return User.can(String(permission).toLowerCase())
}

function canAction(action) {
  return Boolean(action?.visible) && can(action?.permission)
}

const singularActions = computed(() =>
  (props.actions || []).filter(
    action => action.details === true || action.details === 'true'
  )
)

const geralActions = computed(() =>
  (props.actions || []).filter(
    action => action.details === false || action.details === 'false'
  )
)

const topActions = computed(() =>
  geralActions.value.filter(
    action =>
      action.visible &&
      can(action.permission) &&
      ['t', 'T'].includes(action.position)
  )
)



const objects = ref('alive')

const objectsOptions = [
  {
    label: '',
    value: 'alive',
    icon: 'check_circle'
  },
  {
    label: '',
    value: 'deleted',
    icon: 'delete'
  },
  {
    label: '',
    value: 'all',
    icon: 'list'
  }
]

// ---------------- COMPUTED ----------------
const filteredColumns = computed(() =>
  props.columns.filter(c => !ignoreSet.value.has(c.name))
)


const allColumns = computed(() =>
  filteredColumns.value.map(column => column.name)
)

const effectiveColumns = computed(() =>
  visibleColumns.value.length
    ? visibleColumns.value
    : allColumns.value
)

const allSelected = computed(() =>
  allColumns.value.length > 0 &&
  allColumns.value.every(
    column => visibleColumns.value.includes(column)
  )
)

const toggleColumn = (column) => {

  if (visibleColumns.value.includes(column)) {

    visibleColumns.value =
      visibleColumns.value.filter(
        item => item !== column
      )

  } else {

    visibleColumns.value = [
      ...visibleColumns.value,
      column
    ]

  }
}

const toggleAllColumns = () => {

  if (allSelected.value) {
    visibleColumns.value = []
  } else {
    visibleColumns.value = [
      ...allColumns.value
    ]
  }
}

function isDeleted(x) {

  return Boolean(x && x.deleted_at)
}

function goToRoute(id) {
  if (!props.config?.routes?.view) return
  
  if (router.hasRoute(props.config?.routes?.view)) {
    router.push({
      name: props?.config.routes.view,
      params: { id }
    })
  } else {
    router.push({
      name: 'route_inexistente',
      params: { 'route': props?.config.routes?.view, 'id': id }
    })
  }

}


function rowClass(props) {
  return props.rowIndex % 2 === 0 ? 'row-even' : 'row-odd'
}

// ---------------- INLINE EDIT ----------------
function isEditable(name) {
  if (!can(permissions.value.change)) return false
  if (ignoreSet.value.has(name)) return false
  const f = props.fields.find(x => x.name === name)
  if (!f) return false
  if (f.ui?.isFile || f.ui?.isImage || f.ui?.isRelation) return false
  return true
}

// 🔥 TOGGLE STATE (NEW)
function toggleEstado(row) {
  if (!can(permissions.value.change)) return
  const newValue = row.state.value == 'Active' ? 'Inactive' : 'Active'

  emit('inline-patch', {
    id: row.id,
    field: 'state',
    value: newValue
  })
}

function toggleBoolean(row, name) {
  if (!can(permissions.value.change)) return
  const newValue = !row[name]

  emit('inline-patch', {
    id: row.id,
    field: name,
    value: newValue
  })
}

// ---------------- REQUEST HANDLER ----------------

function onRequest(e) {
  localPagination.value = { ...e.pagination }
  emit( 'update:pagination',  {  ...e.pagination  } )
  emit('request', e)
}


function onPageChange(page) {

  localPagination.value = {
    ...localPagination.value,
    page
  }

  const request = {
    pagination: {
      ...localPagination.value
    }
  }

  emit(
    'update:pagination',
    {
      ...localPagination.value
    }
  )

  emit(
    'request',
    request
  )
}



watch(
  () => props.columns,
  async (columns) => {
    if (!columns) return
    visibleColumns.value = []
  },
  { immediate: true }
)

function confirmAction(type, row) {
  actionType.value = type
  selectedRow.value = row
  showConfirm.value = true
}

function getMethodColor(method) {
  switch ((method || '').toLowerCase()) {
    case 'get': return 'green'
    case 'post': return 'blue'
    case 'put': return 'orange'
    case 'delete': return 'red'
    default: return 'grey'
  }
}

const paginationLabel = (start, end, total) => {
  if (!total || total === 0) return tdc('No data')
  return `${start}-${end} ${tdc('of')} ${total}`
}


function runAction(action, row) {
  emit('run-action',  action, row )
}



async function executeAction({ type, row }) {

  if (!row?.id) return

  if (type === 'delete') {
    emit('delete', row)
  }

  if (type === 'hard_delete') {
    emit('hard_delete', row)
  }

  showConfirm.value = false
  selectedRow.value = null
  actionType.value = null
}














////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////


const relationSearch = ref({})

function getField(name) {
  return props.fields.find(f => f.name === name)
}



function isRelationOrChoice(name, value = null) {
  const field = getField(name)

  let parsed = value

  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {}
  }

  return Boolean(
    field?.ui?.isRelation ||
    field?.relation ||
    field?.type === 'ManyToManyField' ||
    field?.type === 'ForeignKey' ||
    field?.type === 'OneToOneField' ||
    field?.choices?.length ||
    Array.isArray(parsed)
  )
}

function normalizeItems(value, fieldName) {
  const field = getField(fieldName)

  if (value === null || value === undefined || value === '') {
    return []
  }

  let parsed = value

  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      parsed = value
    }
  }

  if (!Array.isArray(parsed)) {
    parsed = [parsed]
  }

  return parsed.map(item => {
    if (item && typeof item === 'object') {
      return {
        label:
          item.label ??
          item.name ??
          item.title ??
          item.value ??
          item.id ??
          '',
        value:
          item.value ??
          item.id ??
          item.label
      }
    }

    const choice = field?.choices?.find(
      ([value]) => String(value) === String(item)
    )

    return {
      label: choice?.[1] ?? item,
      value: item
    }
  })
}

function allItems(row, field) {
  return normalizeItems(
    row?.[field],
    field
  )
}

function firstItem(row, field) {
  return allItems(row, field)[0]
}

function remainingCount(row, field) {
  return Math.max(
    allItems(row, field).length - 1,
    0
  )
}

function searchKey(row, field) {
  return `${row?.id || 'row'}_${field}`
}

function getRelationSearch(row, field) {
  return relationSearch.value[
    searchKey(row, field)
  ] || ''
}

function setRelationSearch(row, field, value) {
  relationSearch.value = {
    ...relationSearch.value,
    [searchKey(row, field)]: value || ''
  }
}

function filteredItems(row, field) {
  const search = getRelationSearch(
    row,
    field
  )
    .trim()
    .toLowerCase()

  const items = allItems(
    row,
    field
  )

  if (!search) {
    return items
  }

  return items.filter(item =>
    String(item.label || '')
      .toLowerCase()
      .includes(search)
  )
}

////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
</script>

<template>

  <s-confirm-delete
    v-model="showConfirm"
    :type="actionType"
    :row="selectedRow"
    id="nid"
    label="person"
    @confirm="executeAction"
  />


  <q-table
    square
    bordered
    :rows="rows"
    :columns="filteredColumns"
    :loading="loading"
    v-model:pagination="localPagination"
    :visible-columns="effectiveColumns"
    :dense="schemaUi.dense"
    row-key="id"
    :row-class="rowClass"

    @request="onRequest"

    :rows-per-page-options="rowsPerPageOptions" 

    :no-data-label="tdc('No data')"
    :rows-per-page-label="tdc('Records per page:')"
    :pagination-label="paginationLabel"
    :loading-label="tdc('Loading...')"
  >

    <!-- ==========================================
         TOP BAR
    =========================================== -->

    <template #top>

      <div class="row col-12">

        <div class="col-12 text-h4 text-primary">
          {{ tdc(schemaUi.title) }}
        </div>


        <div class="row col-12 items-center">

          <!-- =====================================
               LEFT
          ====================================== -->

          <div class="col-2 row justify-start q-gutter-sm">

            <!-- DEFAULT CREATE -->

            <s-btn
              
              icon="add"
              color="primary"
              @click="emit('create')"
              v-show="schemaUi.crud && can(permissions.add)"
            >
              <q-tooltip
                :class="$q.dark.isActive
                  ? 'bg-dark text-white'
                  : 'bg-primary text-white'"
              >
                {{ tdc('Default') }}
              </q-tooltip>
            </s-btn>


            <!-- CUSTOM CREATE -->

            <s-btn
              
              icon="open_in_new"
              color="secondary"
              :to="{ name: props.config?.routes?.add }"
              v-show="
                schemaUi.crud &&
                can(permissions.add) &&
                props.config?.routes?.add
              "
            >
              <q-tooltip
                :class="$q.dark.isActive
                  ? 'bg-dark text-white'
                  : 'bg-primary text-white'"
              >
                {{ tdc('Custom') }}
              </q-tooltip>
            </s-btn>


            <!-- DOWNLOAD PDF LIST -->

            <s-btn
              
              flat
              icon="download"
              @click="emit('pdfList')"
              v-show="
                schemaPdf.enabled &&
                schemaPdf.list &&
                schemaUi.show_pdf_list &&
                can(schemaPdf.list_permission)
              "
            >
              <q-tooltip
                :class="$q.dark.isActive
                  ? 'bg-dark text-white'
                  : 'bg-primary text-white'"
              >
                {{ tdc('Download data list as PDF') }}
              </q-tooltip>
            </s-btn>

          </div>


          <!-- =====================================
               RIGHT
          ====================================== -->

          <div
            class="col-10 row justify-end q-gutter-sm"
            style="margin-right:-25px;"
          >

            <!-- OBJECT FILTER -->

            <q-btn-toggle
              dense
              v-if="show_filter"
              v-model="objects"
              no-caps
              unelevated
              toggle-color="primary"
              color="grey-3"
              text-color="grey-8"
              :options="objectsOptions"
              @update:model-value="val => emit('objects', val)"
            >

              <!-- ACTIVE -->

              <template #alive>
                <q-tooltip
                  :class="$q.dark.isActive
                    ? 'bg-dark text-white'
                    : 'bg-primary text-white'"
                >
                  {{ tdc('Show active') }}
                </q-tooltip>
              </template>


              <!-- DELETED -->

              <template #deleted>
                <q-tooltip
                  :class="$q.dark.isActive
                    ? 'bg-dark text-white'
                    : 'bg-primary text-white'"
                >
                  {{ tdc('Show deleted') }}
                </q-tooltip>
              </template>


              <!-- ALL -->

              <template #all>
                <q-tooltip
                  :class="$q.dark.isActive
                    ? 'bg-dark text-white'
                    : 'bg-primary text-white'"
                >
                  {{ tdc('Show all') }}
                </q-tooltip>
              </template>

            </q-btn-toggle>


            
            <!-- =====================================
                 VISIBLE COLUMNS
            ====================================== -->

            <s-btn
              v-if="show_filter && schemaUi.show_columns"
              dense
              flat
              icon="view_column"
            >

              <q-tooltip
                :class="$q.dark.isActive
                  ? 'bg-dark text-white'
                  : 'bg-primary text-white'"
              >
                {{ tdc('Select visible columns') }}
              </q-tooltip>


              <q-menu>

                <q-list
                  dense
                  style="min-width: 200px"
                >

                  <!-- HEADER -->

                  <q-item-label header>
                    {{ tdc('Visible columns') }}
                  </q-item-label>

                  <q-separator />


                  <!-- ALL -->

                  <q-item
                    clickable
                    @click="toggleAllColumns"
                  >

                    <q-item-section avatar>

                      <q-checkbox
                        :model-value="allSelected"
                        @update:model-value="toggleAllColumns"
                      />

                    </q-item-section>

                    <q-item-section>
                      {{ tdc('All') }}
                    </q-item-section>

                  </q-item>

                  <q-separator />


                  <!-- COLUMNS -->

                  <q-item
                    v-for="column in filteredColumns"
                    :key="column.name"
                    clickable
                    @click="toggleColumn(column.name)"
                  >

                    <q-item-section avatar>

                      <q-checkbox
                        :model-value="visibleColumns.includes(column.name)"
                        @update:model-value="toggleColumn(column.name)"
                      />

                    </q-item-section>

                    <q-item-section>
                      {{ tdc(column.label || column.name) }}
                    </q-item-section>

                  </q-item>

                </q-list>

              </q-menu>

            </s-btn>


            <!-- RELOAD -->

            <s-btn
              v-if="show_filter && schemaUi.show_refresh"
              dense
              flat
              icon="refresh"
              @click="emit('refresh')"
            >

              <q-tooltip
                :class="$q.dark.isActive
                  ? 'bg-dark text-white'
                  : 'bg-primary text-white'"
              >
                {{ tdc('Reload data') }}
              </q-tooltip>

            </s-btn>


            <!-- MORE OPTIONS -->

            <s-btn
              flat
              dense
              :icon="show_filter ? 'arrow_forward' : 'arrow_back'"
              @click="show_filter = !show_filter"
            >

              <q-tooltip
                :class="$q.dark.isActive
                  ? 'bg-dark text-white'
                  : 'bg-primary text-white'"
              >
                {{ tdc('Show more options') }}
              </q-tooltip>

            </s-btn>
            <span>
              <q-btn-dropdown 
                hover aria-haspopup="menu"
                outline
                icon="more_vert"
                color="secondary"

                v-show="topActions.length > 0"
              >
                
                <q-list
                  role="menu"
                  dense
                  style="min-width: 100px"
                >
                  <!-- DYNAMIC ACTIONS TOP -->
                  <q-item
                    v-close-popup
                    v-for="a in topActions"
                    :key="a.action || a.endpoint || a.url"
                    clickable
                    @click="runAction(a, [])"
                  >

                    <q-item-section
                      avatar
                      v-if="a.icon"
                    >

                      <q-icon
                        :name="a.icon"
                        :color="getMethodColor(a.method)"
                      />

                    </q-item-section>

                    <q-item-section>
                      {{ tdc(a.label || a.action) }}
                    </q-item-section>

                    <q-tooltip
                      v-show="a.tooltip"
                      :class="$q.dark.isActive
                        ? 'bg-dark text-white'
                        : 'bg-primary text-white'"
                    >
                      {{ tdc(a.tooltip) || '.' }}
                    </q-tooltip>

                  </q-item> 
                </q-list>

              </q-btn-dropdown>
              <q-tooltip
                :class="$q.dark.isActive
                  ? 'bg-dark text-white'
                  : 'bg-primary text-white'"
              >
                {{ tdc('More actions') }}
              </q-tooltip>
            </span>
            



            <!-- SEARCH -->

            <q-input
              v-if="schemaUi.show_search"
              outlined
              v-model="search"
              style="min-width: 190px; margin-right:-10px;"
              :label="tdc('Search')"
              @keyup.enter="emit('search', search)"
              dense
            >

              <!-- SEARCH ICON -->

              <template #append>

                <q-icon
                  name="search"
                  @click="emit('search', search)"
                />

              </template>


              <!-- FILTER -->

              <template #prepend>

                <s-btn
                  v-if="schemaUi.show_filters"
                  dense
                  flat
                  round
                  icon="filter_list"
                  @click="emit('filter')"
                >

                  <q-tooltip
                    :class="$q.dark.isActive
                      ? 'bg-dark text-white'
                      : 'bg-primary text-white'"
                  >
                    {{ tdc('Show filters') }}
                  </q-tooltip>

                </s-btn>

              </template>

            </q-input>

          </div>

        </div>

      </div>

    </template>


    <!-- ==========================================
         HEADERS
    =========================================== -->

    <template #header-cell="props">

      <q-th
        :props="props"
        :class="{
          'text-left text-secondary':
            props.col.field === '__lactions',

          'text-right text-secondary':
            props.col.field === '__ractions'
        }"
      >
        {{ tdc(props.col.label) }}
      </q-th>

    </template>


    <!-- ==========================================
         ACTIONS
    =========================================== -->

    <template #body-cell-__actions="slotRow">

      <q-td :props="slotRow">
        <template v-if="slotRow.col.field === '__lactions'">
          <s-btn
            dense
            outline
            icon="more_vert"
            color="secondary"
            
          >

            <q-menu auto-close>

              <q-list
                dense
                style="min-width: 180px"
              >

                

                <!-- =====================================
                    PDF
                ====================================== -->

                <q-item
                  v-if="
                    schemaPdf.enabled &&
                    schemaPdf.detail &&
                    schemaUi.show_pdf &&
                    can(schemaPdf.detail_permission) &&
                    !isDeleted(slotRow.row)
                  "
                  clickable
                  @click="emit('pdf', slotRow.row)"
                >

                  <q-item-section avatar>

                    <q-icon
                      :name="actionStore.getAction('pdf').icon"
                      :color="actionStore.getAction('pdf').color"
                    />

                  </q-item-section>

                  <q-item-section>
                    {{ tdc(actionStore.getAction('pdf').label) }}
                  </q-item-section>

                  <q-tooltip
                    :class="$q.dark.isActive
                      ? 'bg-dark text-white'
                      : 'bg-primary text-white'"
                  >
                    {{ tdc(actionStore.getAction('pdf').label) }}
                  </q-tooltip>

                </q-item>


                <!-- =====================================
                    EDIT
                ====================================== -->

                <q-item
                  v-if="
                    can(permissions.change) &&
                    !isDeleted(slotRow.row)
                  "
                  clickable
                >

                  <q-item-section
                    avatar
                    @click="emit('edit', slotRow.row)"
                  >

                    <q-icon
                      :name="actionStore.getAction('edit').icon"
                      :color="actionStore.getAction('edit').color"
                    />

                  </q-item-section>

                  <q-item-section
                    @click="emit('edit', slotRow.row)"
                  >
                    {{ tdc(actionStore.getAction('edit').label) }}
                  </q-item-section>


                  <q-item-section
                    side
                    v-if="props.config?.routes?.change"
                  >

                    <s-btn
                      flat
                      size="sm"
                      icon="open_in_new"
                      :to="{
                        name: props.config.routes.change,
                        params: {
                          id: slotRow.row?.id
                        }
                      }"
                      @click.stop
                    />

                  </q-item-section>


                  <q-tooltip
                    :class="$q.dark.isActive
                      ? 'bg-dark text-white'
                      : 'bg-primary text-white'"
                  >
                    {{ tdc(actionStore.getAction('edit').label) }}
                  </q-tooltip>

                </q-item>


                <!-- =====================================
                    DELETE
                ====================================== -->

                <q-item
                  v-if="
                    can(permissions.delete) &&
                    !isDeleted(slotRow.row)
                  "
                  clickable
                  @click="confirmAction('delete', slotRow.row)"
                >

                  <q-item-section avatar>

                    <q-icon
                      :name="actionStore.getAction('delete').icon"
                      :color="actionStore.getAction('delete').color"
                    />

                  </q-item-section>

                  <q-item-section>
                    {{ tdc(actionStore.getAction('delete').label) }}
                  </q-item-section>

                  <q-tooltip
                    :class="$q.dark.isActive
                      ? 'bg-dark text-white'
                      : 'bg-primary text-white'"
                  >
                    {{ tdc(actionStore.getAction('delete').label) }}
                  </q-tooltip>

                </q-item>


                <!-- =====================================
                    HARD DELETE
                ====================================== -->

                <q-item
                  v-if="
                    can(permissions.hard_delete) &&
                    isDeleted(slotRow.row)
                  "
                  clickable
                  @click="confirmAction('hard_delete', slotRow.row)"
                >

                  <q-item-section avatar>
                    <q-icon
                      name="delete_forever"
                      color="red"
                    />
                  </q-item-section>

                  <q-item-section>
                    {{ tdc('Delete permanently') }}
                  </q-item-section>

                  <q-tooltip
                    :class="$q.dark.isActive
                      ? 'bg-dark text-white'
                      : 'bg-primary text-white'"
                  >
                    {{ tdc('Delete permanently') }}
                  </q-tooltip>

                </q-item>


                <!-- =====================================
                    RESTORE
                ====================================== -->

                <q-item
                  v-if="
                    can(permissions.restore) &&
                    isDeleted(slotRow.row)
                  "
                  clickable
                  @click="emit('restore', slotRow.row)"
                >

                  <q-item-section avatar>

                    <q-icon
                      name="restore"
                      color="green"
                    />

                  </q-item-section>

                  <q-item-section>
                    {{ tdc('Restore') }}
                  </q-item-section>

                  <q-tooltip
                    :class="$q.dark.isActive
                      ? 'bg-dark text-white'
                      : 'bg-primary text-white'"
                  >
                    {{ tdc('Restore') }}
                  </q-tooltip>

                </q-item>


                <q-separator
                  v-if="singularActions.length"
                />


                <q-item
                  v-for="a in singularActions"
                  :key="a.action || a.endpoint || a.url"
                  clickable
                  v-show="
                    canAction(a) &&
                    ['m', 'M'].includes(a.position) &&
                    !isDeleted(slotRow.row)
                  "
                  @click="runAction(a, slotRow.row)"
                >

                  <q-item-section
                    avatar
                    v-if="a.icon"
                  >

                    <q-icon
                      :name="a.icon"
                      :color="getMethodColor(a.method)"
                    />

                  </q-item-section>

                  <q-item-section>
                    {{ tdc(a.label || a.action) }}
                  </q-item-section>

                  <q-tooltip
                    :class="$q.dark.isActive
                      ? 'bg-dark text-white'
                      : 'bg-primary text-white'"
                  >
                    {{ tdc(a.tooltip || a.label || a.action) }}
                  </q-tooltip>

                </q-item>

              </q-list>

            </q-menu>


            <q-tooltip
              :class="$q.dark.isActive
                ? 'bg-dark text-white'
                : 'bg-primary text-white'"
            >
              {{ tdc('Click to see more options') }}
            </q-tooltip>

          </s-btn>

          
          <s-btn
            v-for="a in singularActions"
            :key="a.action || a.endpoint || a.url"
            v-show="
              canAction(a) &&
              ['l', 'L', 'b', 'B'].includes(a.position) &&
              !isDeleted(slotRow.row)
            "
            dense
            flat
            :color="getMethodColor(a.method)"
            :icon="a.icon"
            @click="runAction(a, slotRow.row)"
          >
            <q-tooltip
              v-show="a.tooltip"
              :class="$q.dark.isActive
                ? 'bg-dark text-white'
                : 'bg-primary text-white'"
            >
              {{ tdc(a.tooltip)+ " left" }}
            </q-tooltip>
          </s-btn>
        </template>


        <template v-if="slotRow.col.field === '__ractions'">
          <s-btn
            dense
            flat
            v-for="a in singularActions"
            :key="a.action || a.endpoint || a.url"
            v-show="
              canAction(a) &&
              ['r', 'R','b', 'B'].includes(a.position) &&
              !isDeleted(slotRow.row) &&
              slotRow.col.field == '__ractions'
            "
            @click="runAction(a, slotRow.row)"
            :color="getMethodColor(a.method)"
            :icon="a.icon"
          >

            <q-tooltip
              v-show="a.tooltip"
              :class="$q.dark.isActive
                ? 'bg-dark text-white'
                : 'bg-primary text-white'"
            >
              {{ tdc(a.tooltip) || '.' }}
            </q-tooltip>

          </s-btn>

          <s-btn
            dense
            outline
            icon="more_vert"
            color="secondary"
            
          >

            <q-menu auto-close>

              <q-list
                dense
                style="min-width: 180px"
              >

                

                <!-- =====================================
                    PDF
                ====================================== -->

                <q-item
                  v-if="
                    schemaPdf.enabled &&
                    schemaPdf.detail &&
                    schemaUi.show_pdf &&
                    can(schemaPdf.detail_permission) &&
                    !isDeleted(slotRow.row)
                  "
                  clickable
                  @click="emit('pdf', slotRow.row)"
                >

                  <q-item-section avatar>

                    <q-icon
                      :name="actionStore.getAction('pdf').icon"
                      :color="actionStore.getAction('pdf').color"
                    />

                  </q-item-section>

                  <q-item-section>
                    {{ tdc(actionStore.getAction('pdf').label) }}
                  </q-item-section>

                  <q-tooltip
                    :class="$q.dark.isActive
                      ? 'bg-dark text-white'
                      : 'bg-primary text-white'"
                  >
                    {{ tdc(actionStore.getAction('pdf').label) }}
                  </q-tooltip>

                </q-item>


                <!-- =====================================
                    EDIT
                ====================================== -->

                <q-item
                  v-if="
                    can(permissions.change) &&
                    !isDeleted(slotRow.row)
                  "
                  clickable
                >

                  <q-item-section
                    avatar
                    @click="emit('edit', slotRow.row)"
                  >

                    <q-icon
                      :name="actionStore.getAction('edit').icon"
                      :color="actionStore.getAction('edit').color"
                    />

                  </q-item-section>

                  <q-item-section
                    @click="emit('edit', slotRow.row)"
                  >
                    {{ tdc(actionStore.getAction('edit').label) }}
                  </q-item-section>


                  <q-item-section
                    side
                    v-if="props.config?.routes?.change"
                  >

                    <s-btn
                      flat
                      size="sm"
                      icon="open_in_new"
                      :to="{
                        name: props.config.routes.change,
                        params: {
                          id: slotRow.row?.id
                        }
                      }"
                      @click.stop
                    />

                  </q-item-section>


                  <q-tooltip
                    :class="$q.dark.isActive
                      ? 'bg-dark text-white'
                      : 'bg-primary text-white'"
                  >
                    {{ tdc(actionStore.getAction('edit').label) }}
                  </q-tooltip>

                </q-item>


                <!-- =====================================
                    DELETE
                ====================================== -->

                <q-item
                  v-if="
                    can(permissions.delete) &&
                    !isDeleted(slotRow.row)
                  "
                  clickable
                  @click="confirmAction('delete', slotRow.row)"
                >

                  <q-item-section avatar>

                    <q-icon
                      :name="actionStore.getAction('delete').icon"
                      :color="actionStore.getAction('delete').color"
                    />

                  </q-item-section>

                  <q-item-section>
                    {{ tdc(actionStore.getAction('delete').label) }}
                  </q-item-section>

                  <q-tooltip
                    :class="$q.dark.isActive
                      ? 'bg-dark text-white'
                      : 'bg-primary text-white'"
                  >
                    {{ tdc(actionStore.getAction('delete').label) }}
                  </q-tooltip>

                </q-item>


                <!-- =====================================
                    HARD DELETE
                ====================================== -->

                <q-item
                  v-if="
                    can(permissions.hard_delete) &&
                    isDeleted(slotRow.row)
                  "
                  clickable
                  @click="confirmAction('hard_delete', slotRow.row)"
                >

                  <q-item-section avatar>
                    <q-icon
                      name="delete_forever"
                      color="red"
                    />
                  </q-item-section>

                  <q-item-section>
                    {{ tdc('Delete permanently') }}
                  </q-item-section>

                  <q-tooltip
                    :class="$q.dark.isActive
                      ? 'bg-dark text-white'
                      : 'bg-primary text-white'"
                  >
                    {{ tdc('Delete permanently') }}
                  </q-tooltip>

                </q-item>


                <!-- =====================================
                    RESTORE
                ====================================== -->

                <q-item
                  v-if="
                    can(permissions.restore) &&
                    isDeleted(slotRow.row)
                  "
                  clickable
                  @click="emit('restore', slotRow.row)"
                >

                  <q-item-section avatar>

                    <q-icon
                      name="restore"
                      color="green"
                    />

                  </q-item-section>

                  <q-item-section>
                    {{ tdc('Restore') }}
                  </q-item-section>

                  <q-tooltip
                    :class="$q.dark.isActive
                      ? 'bg-dark text-white'
                      : 'bg-primary text-white'"
                  >
                    {{ tdc('Restore') }}
                  </q-tooltip>

                </q-item>


                <q-separator
                  v-if="singularActions.length"
                />


                <q-item
                  v-for="a in singularActions"
                  :key="a.action || a.endpoint || a.url"
                  clickable
                  v-show="
                    canAction(a) &&
                    ['m', 'M'].includes(a.position) &&
                    !isDeleted(slotRow.row)
                  "
                  @click="runAction(a, slotRow.row)"
                >

                  <q-item-section
                    avatar
                    v-if="a.icon"
                  >

                    <q-icon
                      :name="a.icon"
                      :color="getMethodColor(a.method)"
                    />

                  </q-item-section>

                  <q-item-section>
                    {{ tdc(a.label || a.action) }}
                  </q-item-section>

                  <q-tooltip
                    :class="$q.dark.isActive
                      ? 'bg-dark text-white'
                      : 'bg-primary text-white'"
                  >
                    {{ tdc(a.tooltip || a.label || a.action) }}
                  </q-tooltip>

                </q-item>

              </q-list>

            </q-menu>


            <q-tooltip
              :class="$q.dark.isActive
                ? 'bg-dark text-white'
                : 'bg-primary text-white'"
            >
              {{ tdc('Click to see more options') }}
            </q-tooltip>

          </s-btn>
        </template>
      </q-td>

    </template>


    <!-- ==========================================
         INLINE EDIT
    =========================================== -->

    <template #body-cell="props">

      <q-td :props="props">


        <!-- ID -->

        <template v-if="props.col.name === 'id'">

          <s-btn
            dense
            flat
            color="primary"
            icon="visibility"
            @click="() => goToRoute(props.row.id)"
          >

            <q-tooltip
              :class="$q.dark.isActive
                ? 'bg-dark text-white'
                : 'bg-primary text-white'"
            >
              {{ props.row.id }}
            </q-tooltip>

          </s-btn>

        </template>

        <!-- RELATION / CHOICE / MANY TO MANY -->
        <template
          v-else-if="
            isRelationOrChoice(
              props.col.name,
              props.value
            ) &&
            allItems(
              props.row,
              props.col.name
            ).length
          "
        >
          <div class="row items-center no-wrap q-gutter-xs">

            <span
              class="ellipsis"
              style="max-width:180px"
            >
              {{
                tdc(
                  String(
                    firstItem(
                      props.row,
                      props.col.name
                    )?.label ?? ''
                  )
                )
              }}
            </span>

            <s-btn
              v-if="
                remainingCount(
                  props.row,
                  props.col.name
                ) > 0
              "
              dense
              flat
              size="sm"
              color="primary"
              :label="
                `+${
                  remainingCount(
                    props.row,
                    props.col.name
                  )
                }`
              "
            >
              <q-menu>
                <q-card style="min-width:300px;max-width:420px">

                  <q-card-section class="q-pa-sm">
                    <q-input
                      dense
                      outlined
                      clearable
                      autofocus
                      debounce="200"
                      :model-value="
                        getRelationSearch(
                          props.row,
                          props.col.name
                        )
                      "
                      :label="tdc('Search')"
                      @update:model-value="
                        value =>
                          setRelationSearch(
                            props.row,
                            props.col.name,
                            value
                          )
                      "
                    >
                      <template #prepend>
                        <q-icon name="search" />
                      </template>
                    </q-input>
                  </q-card-section>

                  <q-separator />

                  <q-list
                    dense
                    style="max-height:300px;overflow-y:auto"
                  >
                    <q-item
                      v-for="(item, index) in filteredItems(
                        props.row,
                        props.col.name
                      )"
                      :key="item.value ?? index"
                    >
                      <q-item-section>
                        {{ tdc(String(item.label)) }}
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-if="
                        !filteredItems(
                          props.row,
                          props.col.name
                        ).length
                      "
                    >
                      <q-item-section class="text-grey text-center">
                        {{ tdc('No results') }}
                      </q-item-section>
                    </q-item>
                  </q-list>

                </q-card>
              </q-menu>
            </s-btn>

          </div>
        </template>


        <!-- IMAGE -->

        <template v-else-if="isImage(props.value)">

          <img
            :src="getImageUrl(props.value)"
            style="
              width:40px;
              height:40px;
              object-fit:cover;
              border-radius:2px;
              cursor:pointer
            "
            @click="openPreview(getImageUrl(props.value))"
          />


          <q-dialog v-model="preview.show">

            <q-card>

              <img
                :src="preview.url"
                style="
                  max-width:100%;
                  max-height:80vh
                "
              />

            </q-card>

          </q-dialog>

        </template>


        <!-- BOOLEAN -->

        <template v-else-if="isBoolean(props.value)">

          <s-btn
            dense
            size="sm"
            :color="
              toBoolean(props.value)
                ? 'positive'
                : 'negative'
            "
            :label="
              toBoolean(props.value)
                ? tdc('Yes')
                : tdc('No')
            "
            @click="
              () => toggleBoolean(
                props.row,
                props.col.name
              )
            "
          />

        </template>


        <!-- STATE -->

        <template v-else-if="props.col.name === 'state'">

          <s-btn
            dense
            size="sm"
            :color="
              props.row.state.value == 'Active'
                ? 'positive'
                : 'negative'
            "
            :label="
              props.row.state.value == 'Active'
                ? tdc('Active')
                : tdc('Inactive')
            "
            @click="() => toggleEstado(props.row)"
          >

            <q-tooltip
              :class="$q.dark.isActive
                ? 'bg-dark text-white'
                : 'bg-primary text-white'"
            >
              {{
                tdc(
                  props.row.state.value == 'Active'
                    ? 'Deactivate'
                    : 'Activate'
                )
              }}
            </q-tooltip>

          </s-btn>

        </template>


        <!-- EDITABLE FIELD -->

        <template
          v-else-if="
            props.col.name !== '__actions' &&
            isEditable(props.col.name)
          "
        >

          <q-popup-edit
            :model-value="props.value"
            auto-save
            v-slot="scope"
            @save="
              val => emit(
                'inline-patch',
                {
                  id: props.row.id,
                  field: props.col.field,
                  value: val
                }
              )
            "
          >

            <s-input
              v-model="scope.value"
              dense
              autofocus
            />

          </q-popup-edit>

          <span class="cursor-pointer">
            {{ props.value }}
          </span>

        </template>


        <!-- DEFAULT -->

        <template v-else>

          <label class="insize">
            {{ resolveValue(props.value) }}
          </label>

        </template>

      </q-td>

    </template>


    <!-- ==========================================
         PAGINATION
    =========================================== -->

    <template #pagination="scope">

      <q-pagination
        v-model="scope.pagination.page"
        :max="scope.pagesNumber"
        :max-pages="5"

        color="primary"
        active-color="primary"
        active-text-color="white"

        direction-links
        boundary-links

        @update:model-value="onPageChange"
      />

    </template>

  </q-table>

</template>

<style>

.row-even1 {
  background-color: var(--q-primary);
  opacity: 0.2;
}

.row-even {
  background-color: color-mix(in srgb, var(--q-primary) 10%, white);
}

.row-odd {
  background-color: #cdcdcd;
}

.row-even:hover,
.row-odd:hover {
  background-color: var(--q-primary);
  opacity: 0.1;
}

</style>
