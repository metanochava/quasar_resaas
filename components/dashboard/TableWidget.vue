<script setup>
import { computed, ref } from 'vue'
import { tdc } from '../../services/translation'
import { useDashboardStore } from '../../stores/DashboardStore'

const props = defineProps({
  widget: { type: Object, required: true },
  data: { type: Object, required: true },
  loading: { type: Boolean, default: false },
})

const Dashboard = useDashboardStore()

const columns = computed(() =>
  (props.data.columns || []).map((c) => ({
    name: c.name,
    label: tdc(c.label || c.name),
    field: c.name,
    align: c.align || 'left',
    sortable: !!c.sortable,
  }))
)

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
  </q-table>
</template>
