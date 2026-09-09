<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'
import { useDashboardStore } from '../../stores/DashboardStore'
import FilterField from './FilterField.vue'

const Dashboard = useDashboardStore()

const filters = computed(() => Dashboard.dashboard?.filters || [])

let debounceTimer = null

function onChange(name, value) {
  Dashboard.setGlobalFilter(name, value)

  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => Dashboard.applyFilters(), 400)
}

function clear() {
  clearTimeout(debounceTimer)
  Dashboard.clearFilters()
  Dashboard.applyFilters()
}
</script>

<template>
  <div v-if="filters.length" class="row items-end q-col-gutter-sm q-mb-md">
    <div v-for="filterDef in filters" :key="filterDef.name" class="col-auto" style="min-width: 180px">
      <FilterField
        :filter-def="filterDef"
        :model-value="Dashboard.globalFilters[filterDef.name]"
        @update:model-value="onChange(filterDef.name, $event)"
      />
    </div>

    <div class="col-auto row q-gutter-xs">
      <q-btn dense flat icon="filter_alt" color="primary" :label="tdc('Apply')" @click="Dashboard.applyFilters()" />
      <q-btn dense flat icon="close" :label="tdc('Clear')" @click="clear" />
    </div>
  </div>
</template>
