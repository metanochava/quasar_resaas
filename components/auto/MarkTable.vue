<script setup>
import { ref, computed, watch } from 'vue'
import { QBtn, QSelect, QCheckbox, QPagination, QSpinner } from 'quasar'

const props = defineProps({
  rows: { type: Array, default: () => [] },

  // columns: [{ name, label, field, align?, sortable? }]
  columns: { type: Array, default: () => [] },

  loading: { type: Boolean, default: false },

  // pagination: { page, rowsPerPage, rowsNumber, sortBy, descending }
  pagination: { type: Object, required: true },

  // visible columns by name: ['id','name',...]
  visibleColumns: { type: Array, default: () => [] },

  dense: { type: Boolean, default: false },

  rowKey: { type: String, default: 'id' },

  // enable selection checkboxes
  selectable: { type: Boolean, default: true }
})

const emit = defineEmits([
  'request',
  'update:pagination',
  'update:visibleColumns',
  'update:dense',
  'selection'
])

// ---------------- local pagination ----------------
const localPagination = ref({ ...props.pagination })

watch(
  () => props.pagination,
  (v) => { localPagination.value = { ...v } },
  { deep: true }
)

// ---------------- local visible columns ----------------
const localVisibleCols = ref(Array.isArray(props.visibleColumns) ? [...props.visibleColumns] : [])

watch(
  () => props.visibleColumns,
  (v) => { localVisibleCols.value = Array.isArray(v) ? [...v] : [] },
  { deep: true, immediate: true }
)

// ---------------- density ----------------
const localDense = ref(!!props.dense)
watch(() => props.dense, v => { localDense.value = !!v })

function toggleDense() {
  localDense.value = !localDense.value
  emit('update:dense', localDense.value)
}

// ---------------- helpers ----------------
const allColNames = computed(() => props.columns.map(c => c.name))

const effectiveVisibleCols = computed(() => {
  // if the user has not selected anything, show everything
  if (!localVisibleCols.value?.length) return allColNames.value
  // keep only existing columns
  const set = new Set(allColNames.value)
  return localVisibleCols.value.filter(n => set.has(n))
})

const effectiveColumns = computed(() => {
  const vis = new Set(effectiveVisibleCols.value)
  return props.columns.filter(c => vis.has(c.name))
})

function getCellValue(row, col) {
  const f = col.field
  if (typeof f === 'function') return f(row)
  if (typeof f === 'string' && f.length) return row?.[f]
  // fallback: pelo name
  return row?.[col.name]
}

function isSortable(col) {
  return col?.sortable !== false // default true
}

function alignClass(col) {
  const a = (col?.align || 'left').toLowerCase()
  if (a === 'right') return 'text-right'
  if (a === 'center') return 'text-center'
  return 'text-left'
}

// ---------------- selection ----------------
const selectedKeys = ref(new Set())

watch(
  () => props.rows,
  () => {
    // remove selections that no longer exist
    const keys = new Set(props.rows.map(r => String(r?.[props.rowKey])))
    selectedKeys.value = new Set([...selectedKeys.value].filter(k => keys.has(k)))
    emitSelection()
  },
  { deep: true }
)

function rowKeyOf(row) {
  return String(row?.[props.rowKey])
}

function isSelected(row) {
  return selectedKeys.value.has(rowKeyOf(row))
}

function toggleRow(row, val) {
  const key = rowKeyOf(row)
  if (val) selectedKeys.value.add(key)
  else selectedKeys.value.delete(key)
  emitSelection()
}

function allSelectedOnPage() {
  if (!props.rows?.length) return false
  return props.rows.every(r => selectedKeys.value.has(rowKeyOf(r)))
}

function someSelectedOnPage() {
  if (!props.rows?.length) return false
  const n = props.rows.filter(r => selectedKeys.value.has(rowKeyOf(r))).length
  return n > 0 && n < props.rows.length
}

function toggleAllOnPage(val) {
  if (!props.rows?.length) return
  if (val) props.rows.forEach(r => selectedKeys.value.add(rowKeyOf(r)))
  else props.rows.forEach(r => selectedKeys.value.delete(rowKeyOf(r)))
  emitSelection()
}

function emitSelection() {
  // send selected rows from this page + global keys
  const keys = [...selectedKeys.value]
  const selectedRows = props.rows.filter(r => selectedKeys.value.has(rowKeyOf(r)))
  emit('selection', { keys, rows: selectedRows })
}

// ---------------- request (server-side) ----------------
function request(extra = {}) {
  const payload = {
    pagination: { ...localPagination.value },
    ...extra
  }
  emit('update:pagination', payload.pagination)
  emit('request', payload)
}

// sorting
function toggleSort(col) {
  if (!isSortable(col)) return

  const sortBy = col.name
  const cur = localPagination.value.sortBy

  if (cur !== sortBy) {
    localPagination.value.sortBy = sortBy
    localPagination.value.descending = false
  } else {
    localPagination.value.descending = !localPagination.value.descending
  }

  localPagination.value.page = 1
  request()
}

// pagination
function setPage(p) {
  localPagination.value.page = p
  request()
}

function setRowsPerPage(v) {
  localPagination.value.rowsPerPage = Number(v) || 10
  localPagination.value.page = 1
  request()
}

// visible columns update
function updateVisibleColumns(v) {
  localVisibleCols.value = Array.isArray(v) ? v : []
  emit('update:visibleColumns', localVisibleCols.value)
}

// derived totals
const totalPages = computed(() => {
  const total = Number(localPagination.value.rowsNumber || 0)
  const rpp = Number(localPagination.value.rowsPerPage || 10)
  return Math.max(1, Math.ceil(total / rpp))
})

const rangeText = computed(() => {
  const total = Number(localPagination.value.rowsNumber || 0)
  const page = Number(localPagination.value.page || 1)
  const rpp = Number(localPagination.value.rowsPerPage || 10)

  if (!total) return '0'
  const start = (page - 1) * rpp + 1
  const end = Math.min(page * rpp, total)
  return `${start}-${end} / ${total}`
})
</script>

<template>
  <div class="mark-table-wrap">
    <!-- TOP TOOLBAR -->
    <div class="row items-center justify-between q-gutter-sm q-mb-sm">
      <div class="row items-center q-gutter-sm">
        <slot name="top" />

        <s-btn
          dense
          flat
          :icon="localDense ? 'density_small' : 'density_medium'"
          @click="toggleDense"
          :title="localDense ? 'Compacto' : 'Normal'"
        />

        <s-select
          dense
          outlined
          :model-value="localVisibleCols"
          @update:model-value="updateVisibleColumns"
          :options="allColNames"
          multiple
          style="min-width:220px"
          label="Colunas"
        />
      </div>

      <div class="row items-center q-gutter-sm">
        <s-select
          dense
          outlined
          :model-value="localPagination.rowsPerPage"
          @update:model-value="setRowsPerPage"
          :options="[5,10,20,50,100]"
          style="width:120px"
          label="Linhas"
        />
        <div class="text-caption text-grey-7">{{ rangeText }}</div>
      </div>
    </div>

    <!-- TABLE CONTAINER -->
    <div class="mark-table-container" :class="{ dense: localDense }">
      <!-- Loading overlay -->
      <div v-if="loading" class="mark-loading">
        <q-spinner size="32px" />
      </div>

      <table class="mark-table">
        <thead>
          <tr>
            <th v-if="selectable" class="mark-th mark-th--select">
              <s-checkbox
                :model-value="allSelectedOnPage()"
                :indeterminate="someSelectedOnPage()"
                @update:model-value="toggleAllOnPage"
                dense
              />
            </th>

            <th
              v-for="col in effectiveColumns"
              :key="col.name"
              class="mark-th"
              :class="[alignClass(col), isSortable(col) ? 'sortable' : '']"
              @click="toggleSort(col)"
            >
              <div class="row items-center no-wrap">
                <span>{{ col.label }}</span>

                <span v-if="localPagination.sortBy === col.name" class="q-ml-xs">
                  {{ localPagination.descending ? '▼' : '▲' }}
                </span>
              </div>
            </th>

            <th class="mark-th mark-th--actions">
              <slot name="actions-head">Actions</slot>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="!rows || rows.length === 0">
            <td :colspan="(selectable ? 1 : 0) + effectiveColumns.length + 1" class="mark-empty">
              <slot name="empty">
                <div class="text-grey-7">Sem dados</div>
              </slot>
            </td>
          </tr>

          <tr v-for="row in rows" :key="rowKeyOf(row)">
            <td v-if="selectable" class="mark-td mark-td--select">
              <s-checkbox
                :model-value="isSelected(row)"
                @update:model-value="val => toggleRow(row, val)"
                dense
              />
            </td>

            <td
              v-for="col in effectiveColumns"
              :key="col.name"
              class="mark-td"
              :class="alignClass(col)"
            >
              <!-- Cell slot (enterprise) -->
              <slot
                name="cell"
                :row="row"
                :col="col"
                :value="getCellValue(row, col)"
              >
                {{ getCellValue(row, col) }}
              </slot>
            </td>

            <td class="mark-td mark-td--actions">
              <slot name="actions" :row="row" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PAGINATION -->
    <div class="row items-center justify-end q-mt-sm">
      <q-pagination
        :model-value="localPagination.page"
        @update:model-value="setPage"
        :max="totalPages"
        boundary-numbers
        direction-links
        dense
      />
    </div>
  </div>
</template>

<style scoped>
.mark-table-wrap {
  width: 100%;
}

.mark-table-container {
  position: relative;
  overflow: auto;
  border: 1px solid rgba(0,0,0,.12);
  border-radius: 10px;
}

.mark-loading {
  position: absolute;
  inset: 0;
  backdrop-filter: blur(2px);
  background: rgba(255,255,255,.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.mark-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.mark-th,
.mark-td {
  padding: 12px 10px;
  border-bottom: 1px solid rgba(0,0,0,.08);
  vertical-align: middle;
}

.mark-th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fafafa;
  font-weight: 600;
  user-select: none;
}

.mark-th.sortable {
  cursor: pointer;
}

.mark-th--select,
.mark-td--select {
  width: 44px;
}

.mark-th--actions,
.mark-td--actions {
  width: 1%;
  white-space: nowrap;
  text-align: right;
}

.mark-empty {
  padding: 20px;
  text-align: center;
}

.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

/* density */
.mark-table-container.dense .mark-th,
.mark-table-container.dense .mark-td {
  padding: 6px 8px;
  font-size: 12px;
}
</style>