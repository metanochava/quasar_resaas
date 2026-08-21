<script setup>
import { ref, computed, watch } from 'vue'
import { exportFile } from 'quasar'
import { tdc } from '../../boot/base'
import { useRouter } from 'vue-router'

import { useActionStore } from '../../stores/ActionStore'
import { useUserStore } from 'quasar_resaas'

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

// abrir preview
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
  // isDeleted({ deleted_at: '2026-01-01' }) // true
  // isDeleted({ deleted_at: null })         // false
  // isDeleted(null)                         // false
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

// 🔥 TOGGLE ESTADO (NOVO)
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
  emit('run-action',  action, row )
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
          {{ selectedRow?.name || selectedRow?.name || selectedRow?.id }}
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

    :no-data-label="tdc('Sem dados')"
    :rows-per-page-label="tdc('Registos por página')"
    :pagination-label="paginationLabel"
  >

    <!-- 🔥 TOP BAR -->
    <template #top>
      <div class="row col-12 ">

        <div class="col-12 text-h4   text-primary " >
          {{ model }}
        </div>

        <!-- LEFT -->
        <div class="row col-md-12 q-gutter-sm">
          <s-btn
 
            dense icon="add" color="primary" @click="emit('create')"
            v-show="User.can('add_' + model.toLowerCase())"
          >
            <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white ' : 'bg-primary text-white '">
              {{ tdc('Padrao') }}
            </q-tooltip>
          </s-btn>

          <s-btn 
            dense icon="open_in_new"  color="secondary" :to="{ name: props.config?.routes?.add }"
            v-show="User.can('add_' + model.toLowerCase()) && props.config?.routes?.add"
          > 
            <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white ' : 'bg-primary text-white '">
              {{ tdc('Personalizado') }}
            </q-tooltip>
          </s-btn>

          <s-btn 
            dense flat icon="download" @click="emit('pdfList')" 
            v-show="User.can('pdf_list_' + model.toLowerCase()) && props.config?.routes?.add"
          >
            <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white ' : 'bg-primary text-white '">
              {{ tdc('Baixar lista de dados em pdf') }}
            </q-tooltip>
          </s-btn>


          <q-space />
          <!-- RIGHT -->
      
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
            <!-- ACTIVOS -->
            <template #alive>
              <q-tooltip
                :class="$q.dark.isActive
                  ? 'bg-dark text-white'
                  : 'bg-primary text-white'"
              >
                {{ tdc('Mostrar activos') }}
              </q-tooltip>
            </template>

            <!-- ELIMINADOS -->
            <template #deleted>
              <q-tooltip
                :class="$q.dark.isActive
                  ? 'bg-dark text-white'
                  : 'bg-primary text-white'"
              >
                {{ tdc('Mostrar eliminados') }}
              </q-tooltip>
            </template>

            <!-- TODOS -->
            <template #all>
              <q-tooltip
                :class="$q.dark.isActive
                  ? 'bg-dark text-white'
                  : 'bg-primary text-white'"
              >
                {{ tdc('Mostrar todos') }}
              </q-tooltip>
            </template>
          </q-btn-toggle>

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
              {{ tdc('Seleccionar colunas visíveis') }}
            </q-tooltip>

            <q-menu>
              <q-list
                dense
                style="min-width: 200px"
              >
                <!-- HEADER -->
                <q-item-label header>
                  {{ tdc('Colunas visíveis') }}
                </q-item-label>

                <q-separator />

                <!-- TODAS -->
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
                    {{ tdc('Todas') }}
                  </q-item-section>
                </q-item>

                <q-separator />

                <!-- COLUNAS -->
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

          <s-btn v-if="show_filter" dense flat icon="refresh" @click="emit('refresh')" >
            <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white ' : 'bg-primary text-white '">
              {{ tdc('Reload data') }}
            </q-tooltip>
          </s-btn>
          
          <s-btn  flat dense :icon="show_filter? 'arrow_forward' : 'arrow_back'"  @click=" show_filter = !show_filter" >
            <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white ' : 'bg-primary text-white '">
              {{ tdc('Mostrar mais opcoes') }}
            </q-tooltip>
          </s-btn>

          <q-input
            outlined
            v-model="search"
            style="min-width: 190px; margin-right:-10px;"
            :label="tdc('Search')"
            @keyup.enter="emit('search', search)"
            dense
          >
            <!-- Ícone de pesquisa -->
            <template #append>
              <q-icon name="search"  @click="emit('search', search)"/>
            </template>

            <!-- Filtro -->
            <template #prepend>
              <s-btn
                dense
                flat
                round
                icon="filter_list"
                @click="emit('filter')"
              >
                <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white ' : 'bg-primary text-white '">
                  {{ tdc('Mostrar Filtros') }}
                </q-tooltip>
              </s-btn>
            </template>
          </q-input>
        </div>
      </div>
    </template>




    <!-- CABEÇALHOS -->
    <template #header-cell="props">
      <q-th
        :props="props"
        :class="{
          'text-left text-secondary': props.col.field === '__lactions',
          'text-right text-secondary': props.col.field === '__ractions'
        }"
      >
        {{ tdc(props.col.label) }}
      </q-th>
    </template>



    <!-- 🔥 ACTIONS -->
    <template #body-cell-__actions="slotRow">
      <q-td :props="slotRow">
        
        
        <s-btn
          dense
          flat
          v-for="a in singularActions"
          :key="a"
          v-show="User.can(a.role.toLowerCase()) && ['l', 'b'].includes(a.position) && !isDeleted(slotRow.row) && slotRow.col.field =='__ractions'"
          @click="runAction(a, slotRow.row)"
          :color="getMethodColor(a.method)"
          :icon="a.icon"

        >
          <q-tooltip  v-show="a.tooltip" :class="$q.dark.isActive ? 'bg-dark text-white ' : 'bg-primary text-white '">
            {{ tdc(a.tooltip) || '.' }}
          </q-tooltip>
        </s-btn>
        

        <!-- BOTÃO 3 PONTOS -->
        <s-btn
          dense
          outline
          icon="more_vert"
          color="secondary"
        >
          <q-menu auto-close>

            <q-list dense style="min-width: 180px">

              <q-item
                v-for="a in singularActions"
                :key="a"
                clickable
                v-show="User.can(a.role.toLowerCase()) && !a.position && !isDeleted(slotRow.row)"
                @click="runAction(a, slotRow.row)"
              >
                <q-item-section avatar v-if="a.icon">
                  <q-icon :name="a.icon" :color="getMethodColor(a.method)" />
                </q-item-section>

                <q-item-section>
                  {{ a.action }}
                </q-item-section>
                <q-tooltip v-show="a.tooltip" :class="$q.dark.isActive ? 'bg-dark text-white ' : 'bg-primary text-white '">
                  {{ tdc( a.tooltip) || '.' }}
                </q-tooltip>
              </q-item>

              <!-- PDF -->
              <q-item
                v-if="User.can('pdf_'+model.toLowerCase()) && !isDeleted(slotRow.row)"
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

                <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white ' : 'bg-primary text-white '">
                  {{ tdc(actionStore.getAction('pdf').label) }}
                </q-tooltip>
              </q-item>

              <!-- EDIT -->
              <q-item
                v-if="User.can('change_'+model.toLowerCase()) && !isDeleted(slotRow.row)"
                clickable
                
              >
                <q-item-section avatar @click="emit('edit', slotRow.row)">
                  <q-icon 
                    :name="actionStore.getAction('edit').icon"
                    :color="actionStore.getAction('edit').color"
                  />
                </q-item-section>

                <q-item-section @click="emit('edit', slotRow.row)">
                  {{ tdc(actionStore.getAction('edit').label) }}
                </q-item-section>

                <q-item-section side v-if="props.config?.routes?.change">
                  <s-btn
                    flat
                    size="sm"
                    icon="open_in_new"
                    :to="{
                      name: props.config.routes.change,
                      params: { id: slotRow.row?.id }
                    }"
                    @click.stop
                  />
                </q-item-section>

                <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white ' : 'bg-primary text-white '">
                  {{ tdc(actionStore.getAction('edit').label) }}
                </q-tooltip>
              </q-item>
              

              <!-- DELETE -->
              <q-item v-if="User.can('delete_'+model.toLowerCase()) && !isDeleted(slotRow.row)" clickable @click="confirmAction('delete', slotRow.row)">
                <q-item-section avatar>
                  <q-icon 
                    :name="actionStore.getAction('delete').icon"
                    :color="actionStore.getAction('delete').color"
                  />
                </q-item-section>

                <q-item-section>
                  {{ tdc(actionStore.getAction('delete').label) }}
                </q-item-section>

                <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white ' : 'bg-primary text-white '">
                  {{ tdc(actionStore.getAction('delete').label) }}
                </q-tooltip>
              </q-item>

              <!-- HARD DELETE -->
              <q-item  v-if="User.can('hard_delete_'+model.toLowerCase()) && isDeleted(slotRow.row)" clickable @click="confirmAction('hard_delete', slotRow.row)">
                <q-item-section avatar>
                  <q-icon name="delete_forever" color="red" />
                </q-item-section>
                <q-item-section>{{ tdc('Eliminar Permanentemente') }}</q-item-section>
                <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white ' : 'bg-primary text-white '">
                  {{ tdc('Eliminar Permanentemente') }}
                </q-tooltip>
              </q-item>

              <!-- RESTORE -->
              <q-item
                v-if="User.can('restore_'+model.toLowerCase()) && isDeleted(slotRow.row)"
                clickable
                 @click="emit('restore', slotRow.row)"
              >
                <q-item-section avatar>
                  <q-icon name="restore" color="green" />
                </q-item-section>
                <q-item-section>{{ tdc('Restaurar') }}</q-item-section>
                <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white ' : 'bg-primary text-white '">
                  {{ tdc('Restaurar') }}
                </q-tooltip>
              </q-item>

              <q-separator v-if="singularActions.length" />
              

              <!-- ACTIONS DINÂMICAS -->
              <q-item
                v-for="a in singularActions"
                :key="a.url"
                clickable
                v-show="a.permission && !User.can(a.method + '_' + a.permission + '_' + a.model.toLowerCase()) && !isDeleted(slotRow.row)"
                @click="runAction(a, slotRow.row)"
              >
                <q-item-section avatar v-if="a.icon">
                  <q-icon :name="a.icon" :color="getMethodColor(a.method)" />
                </q-item-section>

                <q-item-section>
                  {{ a.method + '_' + a.permission }}
                </q-item-section>

                <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white ' : 'bg-primary text-white '">
                  {{ tdc( a.method + '_' + a.permission ) }}
                </q-tooltip>

              </q-item>
            </q-list>
          </q-menu>

          <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white ' : 'bg-primary text-white '">
            {{ tdc('Clica para ver pais opções') }}
          </q-tooltip>

        </s-btn>

        <s-btn
          dense
          flat
          v-for="a in singularActions"
          :key="a"
          v-show="User.can(a.role.toLowerCase()) && ['r', 'b'].includes(a.position) && !isDeleted(slotRow.row) && slotRow.col.field =='__lactions'"
          @click="runAction(a, slotRow.row)"
          :color="getMethodColor(a.method)"
          :icon="a.icon"

        >
          <q-tooltip v-show="a.tooltip" :class="$q.dark.isActive ? 'bg-dark text-white ' : 'bg-primary text-white '">
            {{ tdc( a.tooltip) || '.' }}
          </q-tooltip>
        </s-btn>


      </q-td>
    </template>

    <!-- 🔥 INLINE EDIT -->
    <template #body-cell="props">
      <q-td :props="props" >

        <template v-if="props.col.name === 'id'">
          <s-btn
            dense
            flat
            color="primary"
            icon="visibility"
            @click="() => goToRoute(props.row.id)"
          >
            <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">{{ props.row.id }}</q-tooltip>
          </s-btn>
          
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
            size="sm"
            :color="toBoolean(props.value) ? 'positive' : 'negative'"
            :label="toBoolean(props.value) ? tdc('Sim') : tdc('Não')"
            @click="() => toggleBoolean(props.row, props.col.name)"
          /> 
        </template>

        <!-- 🔥 ESTADO -->
        <template v-else-if="props.col.name === 'state'">
          <s-btn
            dense
            size="sm"
            :color="props.row.state.value == 'Active' ? 'positive' : 'negative'"
            :label="props.row.state.value == 'Active' ? tdc('Activo') : tdc('Inactivo')"
            @click="() => toggleEstado(props.row)"
          >
            <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">{{ tdc(props.row.state == 'Active' ? 'Desactivar' : 'Activar') }}</q-tooltip>
          </s-btn>
        </template>

        <template v-else-if="(props.col.name !== '__actions' || props.col.name !== '__actions') && isEditable(props.col.name)">
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


        <!-- 🔤 DEFAULT -->
        <template v-else >
          <label class="insize">
            {{ resolveValue(props.value) }} 
          </label>
        </template>
      </q-td>
    </template>


    <!-- <template #pagination="scope">

      <q-pagination
        v-model="scope.pagination.page"
        :max="scope.pagesNumber"

        color="primary"
        active-color="primary"
        active-text-color="white"

        direction-links
        boundary-links
      />

    </template> -->

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
