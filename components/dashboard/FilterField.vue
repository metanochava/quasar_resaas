<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'
import { useDashboardStore } from '../../stores/DashboardStore'

// Um único filtro (global ou de widget). Usa q-* directamente em vez
// de s-select/s-input: os wrappers s-* (boot/components.js) são
// pensados para campos de modelo RESAAS (relação/schema de um Model);
// aqui o "modelo" é a definição de filtro do dashboard.py
// (options/options_endpoint próprios), um contrato diferente - ver
// docs/architecture/dashboards.md.

const props = defineProps({
  filterDef: { type: Object, required: true },
  modelValue: { default: undefined },
  // widgetName presente = filtro de âmbito 'widget'; ausente = global.
  widgetName: { type: String, default: null },
})

const emit = defineEmits(['update:modelValue'])

const Dashboard = useDashboardStore()

const value = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const dynamicOptions = computed(() => {
  if (!props.widgetName) return []
  return Dashboard.getFilterOptions(props.widgetName, props.filterDef.name)
})

const options = computed(() => {
  if (props.filterDef.options?.length) return props.filterDef.options
  return dynamicOptions.value
})

// Opções dinâmicas só existem para filtros de âmbito widget (o
// endpoint genérico de opções é sempre .../widget/<name>/filters/
// <filter>/options/ - não há um endpoint de opções ao nível do
// dashboard). Um filtro global sem 'options' estático fica
// simplesmente sem opções - ver saude/dashboard.py's filtro 'status'
// para o caso comum (lista pequena e estável: opções estáticas
// resolvem-se em dashboard.py, sem precisar de provider nenhum).
const OPTION_BASED_TYPES = ['select', 'multi_select', 'autocomplete', 'status']

function loadOptionsIfNeeded() {
  if (
    props.widgetName
    && OPTION_BASED_TYPES.includes(props.filterDef.type)
    && !props.filterDef.options?.length
    && !options.value.length
  ) {
    Dashboard.loadFilterOptions(props.widgetName, props.filterDef.name)
  }
}

loadOptionsIfNeeded()
</script>

<template>
  <!-- entity/branch: sem UI, sempre resolvidos ao contexto no backend -->
  <template v-if="['entity', 'branch'].includes(filterDef.type)" />

  <q-input
    v-else-if="['text', 'search'].includes(filterDef.type)"
    v-model="value" dense outlined clearable
    :label="tdc(filterDef.label)"
    :debounce="filterDef.debounce ?? 300"
  />

  <q-input
    v-else-if="filterDef.type === 'number'"
    v-model.number="value" type="number" dense outlined clearable
    :label="tdc(filterDef.label)"
  />

  <div v-else-if="filterDef.type === 'number_range'" class="row q-gutter-xs">
    <q-input
      :model-value="value?.min" @update:model-value="value = { ...value, min: $event }"
      type="number" dense outlined clearable class="col"
      :label="tdc(filterDef.label) + ' (min)'"
    />
    <q-input
      :model-value="value?.max" @update:model-value="value = { ...value, max: $event }"
      type="number" dense outlined clearable class="col"
      :label="tdc(filterDef.label) + ' (max)'"
    />
  </div>

  <q-input
    v-else-if="filterDef.type === 'date'"
    v-model="value" type="date" dense outlined clearable
    :label="tdc(filterDef.label)"
  />

  <div v-else-if="filterDef.type === 'date_range'" class="row q-gutter-xs">
    <q-input
      :model-value="value?.from" @update:model-value="value = { ...value, from: $event }"
      type="date" dense outlined clearable class="col"
      :label="tdc(filterDef.label) + ' (' + tdc('from') + ')'"
    />
    <q-input
      :model-value="value?.to" @update:model-value="value = { ...value, to: $event }"
      type="date" dense outlined clearable class="col"
      :label="tdc(filterDef.label) + ' (' + tdc('to') + ')'"
    />
  </div>

  <q-input
    v-else-if="filterDef.type === 'month'"
    v-model="value" type="month" dense outlined clearable
    :label="tdc(filterDef.label)"
  />

  <q-input
    v-else-if="filterDef.type === 'year'"
    v-model.number="value" type="number" dense outlined clearable
    :label="tdc(filterDef.label)"
  />

  <q-toggle
    v-else-if="filterDef.type === 'boolean'"
    v-model="value" :label="tdc(filterDef.label)"
  />

  <q-select
    v-else-if="['select', 'status'].includes(filterDef.type)"
    v-model="value" dense outlined clearable emit-value map-options
    :options="options"
    option-value="value" option-label="label"
    :label="tdc(filterDef.label)"
    @popup-show="loadOptionsIfNeeded"
  />

  <q-select
    v-else-if="['multi_select', 'autocomplete'].includes(filterDef.type)"
    v-model="value" dense outlined clearable emit-value map-options
    use-input use-chips
    :multiple="filterDef.type === 'multi_select' || filterDef.multiple"
    :options="options"
    option-value="value" option-label="label"
    :label="tdc(filterDef.label)"
    :loading="widgetName ? Dashboard.isFilterOptionsLoading(widgetName, filterDef.name) : false"
    @popup-show="loadOptionsIfNeeded"
  />
</template>
