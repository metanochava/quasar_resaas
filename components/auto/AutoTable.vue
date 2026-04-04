<script setup>
import { ref, computed, watch } from 'vue'
import { exportFile } from 'quasar'
import { tdc } from '../../boot/base'
import { useRouter } from 'vue-router'



function isBoolean(val) {
  return ['true','false', true, false, 1, 0, '1', '0'].includes(val)
}

function toBoolean(val) {
  return ['true', true, 1, '1'].includes(val)
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

// abrir preview
function openPreview(url) {
  preview.value.url = url
  preview.value.show = true
}

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

  route: { type: [String, Object], default: null },
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
const density = ref('')
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

function isDeleted(x) {
  // isDeleted({ deleted_at: '2026-01-01' }) // true
  // isDeleted({ deleted_at: null })         // false
  // isDeleted(null)                         // false
  return Boolean(x && x.deleted_at)
}

function goToRoute(id) {
  if (!props.route) return

  // caso 1: string
  if (typeof props.route === 'string') {
    router.push({
      name: props.route,
      params: { id }
    })
  }

  // caso 2: object (mais flexível)
  else if (typeof props.route === 'object') {
    router.push({
      ...props.route,
      params: {
        ...(props.route.params || {}),
        id
      }
    })
  }
}


function rowClass(props) {
  return props.rowIndex % 2 === 0 ? 'row-even' : 'row-odd'
}

// ---------------- INLINE EDIT ----------------
function isEditable(name) {
  if (ignoreSet.value.has(name)) return false
  const f = props.schema.find(x => x.name === name)
  if (!f) return false
  if (f.ui?.isFile || f.ui?.isImage || f.ui?.isRelation) return false
  return true
}

// 🔥 TOGGLE ESTADO (NOVO)
function toggleEstado(row) {
  const newValue = row.estado == 1 ? 0 : 1

  emit('inline-patch', {
    id: row.id,
    field: 'estado',
    value: newValue
  })
}

// ---------------- REQUEST HANDLER ----------------
function onRequest(e) {
  localPagination.value = e.pagination
  emit('update:pagination', e.pagination) // 🔥 FIX
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
  if (!total || total === 0) return tdc('Sem dados')
  return `${start}-${end} ${tdc('de')} ${total}`
}


function runAction(action, row) {
  emit('run-action', { action, row })
}

async function executeAction() {
  if (!selectedRow.value?.id) return

  if (actionType.value === 'delete') {
    emit('delete', selectedRow.value)
  }

  if (actionType.value === 'hard_delete') {
    emit('hard_delete', selectedRow.value)
  }

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
        <s-btn flat dense label="Cancelar" v-close-popup />

        <s-btn 
          dense
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
    :dense="density === 'normal'"
    row-key="id"
    @request="onRequest"

    :no-data-label="tdc('Sem dados')"
    :rows-per-page-label="tdc('Registos por página')"
    :pagination-label="paginationLabel"
  >

    <!-- 🔥 TOP BAR -->
    <template #top>
      <div class="row col-12 items-center justify-between q-mb-md">

        <!-- LEFT -->
        <div class="text-h4 text-primary">{{ model }}</div>

        <!-- RIGHT -->
        <div class="row q-gutter-sm">

          <s-select
            v-if="show_filter"
            v-model="objects"
            :options="objectsOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            dense
            outlined
            @update:model-value="val => emit('objects', val)"
          />
          

          <s-select v-if="show_filter"
            v-model="density"
            :options="['dense','normal']"
            dense
            outlined
            :label=density
            style="width:120px"
          />

          <s-select
            v-if="show_filter"
            v-model="visibleColumns"
            :options="allColumns"
            multiple
            dense
            outlined
            style="min-width:200px"
            label="Colunas"
          />

          <s-btn v-if="show_filter" dense flat icon="filter_list" @click="emit('filter')" />
          <s-btn v-if="show_filter" dense flat icon="refresh" @click="emit('refresh')" />
          <s-btn v-if="show_filter" dense flat icon="download" @click="exportCSV" />

          <s-btn  flat dense :icon="show_filter? 'arrow_forward' : 'arrow_back'"  @click=" show_filter = !show_filter" >
            <q-tooltip>{{tdc('Mostar Filtros')}} </q-tooltip>
          </s-btn>

          <s-input
            icon="search"
            v-model="search"
            style="min-width:200px"
            :label="tdc('Search')"
            @keyup.enter="emit('search', search)"
          />
          <s-btn
            dense
            icon="add"
            color="primary"
            @click="emit('create')"
            v-show="canDo('add_' + model.toLowerCase())"
          />
        </div>
      </div>
    </template>


    <!-- 🔥 ACTIONS -->
    <template #body-cell-__actions="props">
      <q-td :props="props">

        <!-- BOTÃO 3 PONTOS -->
        <s-btn
          dense
          flat
          round
          icon="more_vert"
        >
          <q-menu auto-close>

            <q-list dense style="min-width: 180px">


              <!-- EDIT -->
              <q-item
                v-if="canDo('change_'+model.toLowerCase()) && !isDeleted(props.row)"
                clickable
                @click="emit('edit', props.row)"
              >
                <q-item-section avatar>
                  <q-icon name="edit" />
                </q-item-section>
                <q-item-section>Editar</q-item-section>
              </q-item>

              <!-- DELETE -->
              <q-item v-if="canDo('delete_'+model.toLowerCase()) && !isDeleted(props.row)" clickable @click="confirmAction('delete', props.row)">
                <q-item-section avatar>
                  <q-icon name="delete" color="orange" />
                </q-item-section>
                <q-item-section>{{tdc('Eliminar')}}</q-item-section>
              </q-item>

              <!-- HARD DELETE -->
              <q-item  v-if="canDo('hard_delete_'+model.toLowerCase()) && isDeleted(props.row)" clickable @click="confirmAction('hard_delete', props.row)">
                <q-item-section avatar>
                  <q-icon name="delete_forever" color="red" />
                </q-item-section>
                <q-item-section>{{ tdc('Eliminar Permanentemente') }}</q-item-section>
              </q-item>

              <!-- RESTORE -->
              <q-item
                v-if="canDo('restore_'+model.toLowerCase()) && isDeleted(props.row)"
                clickable
                 @click="emit('restore', props.row)"
              >
                <q-item-section avatar>
                  <q-icon name="restore" color="green" />
                </q-item-section>
                <q-item-section>{{ tdc('Restaurar') }}</q-item-section>
              </q-item>

              <q-separator v-if="singularActions.length" />
              

              <!-- ACTIONS DINÂMICAS -->
              <q-item
                v-for="a in singularActions"
                :key="a.url"
                clickable
                :disable="a.permission && !canDo(a.method + '_' + a.permission + '_' + a.modelo.toLowerCase())"
                @click="runAction(a, props.row)"
              >
                <q-item-section avatar v-if="a.icon">
                  <q-icon :name="a.icon" :color="getMethodColor(a.method)" />
                </q-item-section>

                <q-item-section>
                  {{ a.method + '_' + a.permission }}
                </q-item-section>
              </q-item>

            </q-list>

          </q-menu>
        </s-btn>

      </q-td>
    </template>

    <!-- 🔥 INLINE EDIT -->
    <template #body-cell="props">
      <q-td :props="props">

        <template v-if="props.col.name === 'id'">
          <s-btn
            dense
            flat
            color="primary"
            icon="visibility"
            @click="() => goToRoute(props.row.id)"
          >
            <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">{{ tdc(props.row.id) }}</q-tooltip>
          </s-btn>
          
        </template>

        <!-- 🔥 ESTADO -->
        <template v-else-if="props.col.name === 'estado'">
          <s-btn
            dense
            size="sm"
            :color="props.row.estado == 1 ? 'positive' : 'negative'"
            :label="props.row.estado == 1 ? 'Activo' : 'Inactivo'"
            @click="() => toggleEstado(props.row)"
          >
            <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">{{ tdc(props.row.estado == 1 ? 'Desativar' : 'Activar') }}</q-tooltip>
          </s-btn>
        </template>

        <template v-else-if="props.col.name !== '__actions' && isEditable(props.col.name)">
          <q-popup-edit
            :model-value="props.value"
            auto-save
            v-slot="scope"
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

          <template v-else-if="isImage(props.value)">
            <img
              :src="getImageUrl(props.value)"
              style="width:40px;height:40px;object-fit:cover;border-radius:2px; cursor:pointer"
              @click="openPreview(getImageUrl(props.value))"
            />

            <q-dialog v-model="preview.show">
              <q-card>
                <img :src="preview.url" style="max-width:100%;max-height:80vh" />
              </q-card>
            </q-dialog>
          </template>

          <template v-else-if="isBoolean(props.value)">
            <s-btn
              dense
              size="md"
              :color="toBoolean(props.value) ? 'positive' : 'negative'"
              :label="toBoolean(props.value) ? 'Sim' : 'Não'"
            /> 
            {{ props.value }} | 
            {{typeof props.value}} | {{isBoolean(props.value)}}
          </template>

          <!-- 🔤 DEFAULT -->
          <template v-else>
            {{ props.value }} | 
            {{typeof props.value}} | {{isBoolean(props.value)}}
          </template>


      </q-td>
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

</style>
