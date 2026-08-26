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

  config: { type: [Object], default: {} },
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
const singularActions = computed(() =>
  (props.actions || []).filter(c => c.details === true || c.details === 'true'  || c.action)
)
const geralActions = computed(() =>
  (props.actions || []).filter(c => c.details === false || c.details === 'false')
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
  if (ignoreSet.value.has(name)) return false
  const f = props.fields.find(x => x.name === name)
  if (!f) return false
  if (f.ui?.isFile || f.ui?.isImage || f.ui?.isRelation) return false
  return true
}

// 🔥 TOGGLE STATE (NEW)
function toggleEstado(row) {
  const newValue = row.state.value == 'Active' ? 'Inactive' : 'Active'

  emit('inline-patch', {
    id: row.id,
    field: 'state',
    value: newValue
  })
}

function toggleBoolean(row, name) {
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
    dense
    row-key="id"
    :row-class="rowClass"

    @request="onRequest"

    :rows-per-page-options="[
      2,
      5,
      10,
      20,
      50,
      100,
      200,
      500,
      0
    ]"

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
          {{ model }}
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
              v-show="User.can('add_' + model.toLowerCase())"
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
                User.can('add_' + model.toLowerCase()) &&
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
                User.can('pdf_list_' + model.toLowerCase()) &&
                props.config?.routes?.add
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
              v-if="show_filter"
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
              v-if="show_filter"
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

            <q-btn-dropdown 
              hover aria-haspopup="menu"
              dense
              outline
              label="  Actions"
              color="secondary"

              v-show="singularActions.some( action =>  action.position === 't' && action.visible ) "
            >
              <q-list
                role="menu"
                dense
                style="min-width: 100px"
              >

                <!-- DYNAMIC ACTIONS -->

                <q-item
                  v-close-popup
                  v-for="a in singularActions"
                  :key="a"
                  clickable
                  v-show="  User.can(a.permission.toLowerCase()) && !a.details  && a.visible && ['t','T'].includes(a.position)"
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
                    {{ tdc(a.action) }}
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



            <!-- SEARCH -->

            <q-input
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


        <!-- LEFT/DYNAMIC ACTIONS -->

        <s-btn
          dense
          flat
          v-for="a in singularActions"
          :key="a"
          v-show="
            User.can(a.permission.toLowerCase()) && a.visible &&
            ['l', 'b', 'L', 'B'].includes(a.position) &&
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


        <!-- =====================================
             MORE MENU
        ====================================== -->

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

              <!-- DYNAMIC ACTIONS -->

              <q-item
                v-for="a in singularActions"
                :key="a"
                clickable
                v-show="
                  User.can(a.permission.toLowerCase()) && a.visible &&
                  !a.position &&
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
                  {{ tdc(a.action) }}
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


              <!-- =====================================
                   PDF
              ====================================== -->

              <q-item
                v-if="
                  User.can('pdf_' + model.toLowerCase()) &&
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
                  User.can('change_' + model.toLowerCase()) &&
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
                  User.can('delete_' + model.toLowerCase()) &&
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
                  User.can('hard_delete_' + model.toLowerCase()) &&
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
                  User.can('restore_' + model.toLowerCase()) &&
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


              <!-- =====================================
                   DYNAMIC ACTIONS
              ====================================== -->

              <q-item
                v-for="a in singularActions"
                :key="a.url"
                clickable
                v-show="
                  a.permission &&
                  !User.can( a.permission.toLowerCase()  )&& a.visible &&
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
                  {{ a.permission }}
                </q-item-section>

                <q-tooltip
                  :class="$q.dark.isActive
                    ? 'bg-dark text-white'
                    : 'bg-primary text-white'"
                >
                  {{ tdc(a.permission) }}
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


        <!-- RIGHT/DYNAMIC ACTIONS -->

        <s-btn
          dense
          flat
          v-for="a in singularActions"
          :key="a"
          v-show="
            User.can(a.permission.toLowerCase()) && a.visible &&
            ['r', 'b', 'R', 'B'].includes(a.position) &&
            !isDeleted(slotRow.row) &&
            slotRow.col.field == '__lactions'
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
