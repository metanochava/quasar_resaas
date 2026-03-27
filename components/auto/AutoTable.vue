<script setup>
import { ref, computed, watch } from 'vue'
import { exportFile } from 'quasar'
import { useRouter } from 'vue-router'
import { tdc } from '../../boot/base'

// ---------------- ROUTER ----------------
const router = useRouter()

// ---------------- PROPS ----------------
const props = defineProps({
  module: { type: String, default:'' },
  model:  { type: String, default:'' },
  rows: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  schema: { type: Array, default: () => [] },

  loading: { type: Boolean, default: false },
  pagination: { type: Object, required: true },

  actions: { type: Array, default: () => [] },
  canDo: { type: Function, default: () => true },

  // 🔥 NOVO
  route: { type: [String, Object], default: null },

  ignoreFields: { type: Array, default: () => ['id','created_at','updated_at','created_by','updated_by'] } 
})

const showConfirm = ref(false)
const actionType = ref(null)
const selectedRow = ref(null)

const search = ref('')
const ignoreSet = computed(() => new Set(props.ignoreFields))

// ---------------- EMITS ----------------
const emit = defineEmits([
  'request',
  'create',
  'edit',
  'delete',
  'filter',
  'refresh',
  'inline-patch',
  'run-action',
  'update:pagination',

  'objects',
  'hard_delete',
  'restore',
  'search',
])

// ---------------- LOCAL STATE ----------------
const localPagination = ref({ ...props.pagination })

watch(() => props.pagination, (val) => {
  localPagination.value = { ...val }
})

const show_filter = ref(false)

// ---------------- UI STATE ----------------
const visibleColumns = ref([])

const singularActions = computed(() =>
  (props.actions || []).filter(c => c.details === true || c.details === 'true')
)

const geralActions = computed(() =>
  (props.actions || []).filter(c => c.details === false || c.details === 'false')
)

const density = ref('normal')

const objects = ref('Activos')
const objectsOptions = [
  { label: 'Activos', value: 'alive' },
  { label: 'Eliminados', value: 'deleted' },
  { label: 'Todos', value: 'all' }
]

// ---------------- COMPUTED ----------------
const filteredColumns = computed(() =>
  props.columns.filter(c => !ignoreSet.value.has(c.name))
)

const allColumns = computed(() => filteredColumns.value.map(c => c.name))

const effectiveColumns = computed(() =>
  visibleColumns.value.length ? visibleColumns.value : allColumns.value
)

// ---------------- ZEBRA ROWS ----------------
function rowClass(props) {
  return props.rowIndex % 2 === 0 ? 'row-even' : 'row-odd'
}

// ---------------- ROUTE FUNCTION ----------------
function goToRoute(id) {
  if (!props.route) return

  if (typeof props.route === 'string') {
    router.push({ name: props.route, params: { id } })
  } else {
    router.push({
      ...props.route,
      params: {
        ...(props.route.params || {}),
        id
      }
    })
  }
}

// ---------------- HELPERS ----------------
function isDeleted(x) {
  return Boolean(x && x.deleted_at)
}

// ---------------- INLINE EDIT ----------------
function isEditable(name) {
  if (ignoreSet.value.has(name)) return false
  const f = props.schema.find(x => x.name === name)
  if (!f) return false
  if (f.ui?.isFile || f.ui?.isImage || f.ui?.isRelation) return false
  return true
}

// ---------------- REQUEST ----------------
function onRequest(e) {
  localPagination.value = e.pagination
  emit('update:pagination', e.pagination)
  emit('request', e)
}

// ---------------- EXPORT CSV ----------------
function exportCSV() {
  const cols = filteredColumns.value.filter(c => c.name !== '__actions')

  const header = cols.map(c => `"${c.label}"`).join(',')

  const body = props.rows.map(r =>
    cols.map(c => `"${String(r[c.field] ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n')

  exportFile('export.csv', `${header}\n${body}`)
}

watch(() => props.columns, () => {
  visibleColumns.value = []
}, { immediate: true })

// ---------------- ACTIONS ----------------
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
  if (!total || total === 0) return tdc('Sem dados')
  return `${start}-${end} ${tdc('de')} ${total}`
}

function runAction(action, row) {
  emit('run-action', { action, row })
}

async function executeAction() {
  if (!selectedRow.value?.id) return

  if (actionType.value === 'delete') emit('delete', selectedRow.value)
  if (actionType.value === 'hard_delete') emit('hard_delete', selectedRow.value)

  showConfirm.value = false
  selectedRow.value = null
  actionType.value = null
}
</script>

<template>

  <q-dialog v-model="showConfirm">
    <s-card style="min-width: 400px">

      <q-card-section class="row items-center q-gutter-sm">
        <q-icon
          :name="actionType === 'hard_delete' ? 'warning' : 'help'"
          :color="actionType === 'hard_delete' ? 'red' : 'orange'"
          size="md"
        />
        <div class="text-h6">
          {{ actionType === 'hard_delete' ? 'Eliminar permanentemente?' : 'Confirmar eliminação?' }}
        </div>
      </q-card-section>

      <q-card-section>
        <div>
          {{tdc('Tens certeza que queres eliminar:')}}
        </div>

        <b>
          {{ selectedRow?.nome || selectedRow?.name || selectedRow?.id }}
        </b>

        <div v-if="actionType === 'hard_delete'" class="text-red q-mt-sm">
          ⚠️ {{ tdc('Esta ação é irreversível') }}
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <s-btn flat label="Cancelar" v-close-popup />

        <s-btn
          :color="actionType === 'hard_delete' ? 'red' : 'orange'"
          :label="actionType === 'hard_delete' ? 'Eliminar Permanentemente' : 'Eliminar'"
          @click="executeAction"
        />
      </q-card-actions>

    </s-card>
  </q-dialog>

  <q-table
    square
    flat
    bordered
    :rows="rows"
    :columns="filteredColumns"
    :loading="loading"
    :pagination="localPagination"
    :visible-columns="effectiveColumns"
    :dense="density === 'dense'"
    row-key="id"
    @request="onRequest"
    :row-class="rowClass"
    :no-data-label="tdc('Sem dados')"
    :rows-per-page-label="tdc('Registos por página')"
    :pagination-label="paginationLabel"
  >

    <!-- 🔥 TOP BAR -->
    <template #top>
      <div class="row col-12 items-center justify-between q-mb-md">

        <div class="text-h4 text-primary">{{ model }}</div>

        <div class="row q-gutter-sm">

          <s-select v-if="show_filter" v-model="objects" :options="objectsOptions" dense outlined
            @update:model-value="val => emit('objects', val)" />

          <s-select v-if="show_filter" v-model="density" :options="['dense','normal']" dense outlined />

          <s-select v-if="show_filter" v-model="visibleColumns" :options="allColumns" multiple dense outlined />

          <s-btn v-if="show_filter" dense flat icon="filter_list" @click="emit('filter')" />
          <s-btn v-if="show_filter" dense flat icon="refresh" @click="emit('refresh')" />
          <s-btn v-if="show_filter" dense flat icon="download" @click="exportCSV" />

          <s-btn flat dense @click="show_filter = !show_filter" />

          <s-input v-model="search" @keyup.enter="emit('search', search)" />

          <s-btn dense icon="add" color="primary" @click="emit('create')" />
        </div>
      </div>
    </template>

    <!-- 🔥 BODY -->
    <template #body-cell="props">
      <q-td :props="props">

        <!-- ID botão -->
        <template v-if="props.col.name === 'id'">
          <s-btn dense flat icon="visibility" color="primary"
            @click="() => goToRoute(props.row.id)" />
        </template>

        <template v-else-if="props.col.name !== '__actions' && isEditable(props.col.name)">
          <q-popup-edit :model-value="props.value" auto-save v-slot="scope"
            @save="val => emit('inline-patch', {
              id: props.row.id,
              field: props.col.field,
              value: val
            })"
          >
            <s-input v-model="scope.value" dense autofocus />
          </q-popup-edit>

          <span class="cursor-pointer">{{ props.value }}</span>
        </template>

        <template v-else>
          {{ props.value }}
        </template>

      </q-td>
    </template>

  </q-table>
</template>

<style>
.row-even { background: #fafafa; }
.row-odd { background: #ffffff; }
</style>