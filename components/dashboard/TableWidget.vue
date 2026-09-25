<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { tdc } from '../../services/translation'
import { useDashboardStore } from '../../stores/DashboardStore'
import { resolveDashboardAction, actionApplies } from '../../services/dashboardActions'

const props = defineProps({
  widget: { type: Object, required: true },
  data: { type: Object, required: true },
  loading: { type: Boolean, default: false },
})

const Dashboard = useDashboardStore()
const router = useRouter()

const rowActions = computed(() => props.widget.row_actions || [])

const columns = computed(() => {
  const cols = (props.data.columns || []).map((c) => ({
    name: c.name,
    label: tdc(c.label || c.name),
    field: c.name,
    align: c.align || 'left',
    sortable: !!c.sortable,
  }))

  if (rowActions.value.length) {
    cols.push({ name: '__actions', label: '', field: '__actions', align: 'right', sortable: false })
  }

  return cols
})

function runRowAction(action, row) {
  resolveDashboardAction(action, {
    router,
    context: row,
    onRefresh: () => Dashboard.reloadWidget(props.widget.name),
    onChanged: () => Dashboard.loadAllWidgets()
  })
}

const actionsFor = (row) => rowActions.value.filter((action) => actionApplies(action, row))

// Paginação sempre no servidor - nunca carregar a tabela inteira só
// para paginar no browser (o backend já devolve páginas de
// ResaasPagination). O servidor não ecoa 'page' de volta no contrato
// normalizado, por isso o estado local de page/rowsPerPage é a fonte
// de verdade do lado do cliente.
const localPagination = ref({
  page: 1,
  rowsPerPage: props.widget.page_size || 10,
  rowsNumber: props.data.pagination?.count ?? (props.data.rows || []).length,
})

function onRequest(evt) {
  const { page, rowsPerPage } = evt.pagination
  localPagination.value = { ...localPagination.value, page, rowsPerPage }
  Dashboard.loadWidget(props.widget.name, { page, page_size: rowsPerPage })
}
</script>

<template>
  <q-table
    flat dense
    :rows="data.rows || []"
    :columns="columns"
    row-key="id"
    :loading="loading"
    v-model:pagination="localPagination"
    :rows-number="data.pagination?.count"
    @request="onRequest"
  >
    <template #no-data>
      <div class="full-width text-center text-grey-6 q-pa-md">
        {{ tdc('No data') }}
      </div>
    </template>

    <template v-if="rowActions.length" #body-cell-__actions="cellProps">
      <q-td :props="cellProps">
        <div class="row no-wrap justify-end q-gutter-x-xs">
          <s-btn
            v-for="action in actionsFor(cellProps.row)" :key="action.name"
            flat round size="md"
            :color="action.color || 'primary'"
            :icon="action.icon || 'chevron_right'"
            :data-test="`row-action-${action.name}`"
            @click="runRowAction(action, cellProps.row)"
          >
            <s-tooltip v-if="action.tooltip">{{ tdc(action.tooltip) }}</s-tooltip>
          </s-btn>
        </div>
      </q-td>
    </template>
  </q-table>
</template>
