<script setup>
import { useDashboardStore } from '../../stores/DashboardStore'
import FilterField from './FilterField.vue'

const props = defineProps({
  widget: { type: Object, required: true },
})

const Dashboard = useDashboardStore()

let debounceTimer = null

function onChange(name, value) {
  Dashboard.setWidgetFilter(props.widget.name, name, value)

  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => Dashboard.reloadWidget(props.widget.name), 400)
}
</script>

<template>
  <div v-if="widget.filters?.length" class="row q-col-gutter-xs q-mb-sm">
    <div v-for="filterDef in widget.filters" :key="filterDef.name" class="col-auto" style="min-width: 160px">
      <FilterField
        :filter-def="filterDef"
        :widget-name="widget.name"
        :model-value="Dashboard.widgetFilters[widget.name]?.[filterDef.name]"
        @update:model-value="onChange(filterDef.name, $event)"
      />
    </div>
  </div>
</template>
