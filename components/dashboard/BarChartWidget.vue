<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { resolveDashboardAction } from '../../services/dashboardActions'

// bar_chart widget - contract {labels, series: [{name, data, color?}], codes?}
// rendered by s-chart (ApexCharts). Horizontal by default (long labels stay
// readable); widget.horizontal === false draws columns. 'codes' is optional
// and parallel to 'labels' - only used for the {code} placeholder of
// item_action.
const props = defineProps({
  widget: { type: Object, default: () => ({}) },
  data: { type: Object, required: true },
})

const router = useRouter()

const labels = computed(() => props.data.labels || [])
const horizontal = computed(() => props.widget.horizontal !== false)
const height = computed(() => horizontal.value
  ? Math.max(180, labels.value.length * (props.widget.stacked ? 34 : 26 * Math.max(1, (props.data.series || []).length)) + 70)
  : props.widget.height || 280)

function onSelect({ index, label }) {
  if (!props.widget.item_action) return
  const code = props.data.codes?.[index] ?? label
  resolveDashboardAction(props.widget.item_action, { router, context: { code, label } })
}
</script>

<template>
  <s-chart
    type="bar"
    :labels="labels"
    :series="data.series || []"
    :horizontal="horizontal"
    :stacked="!!widget.stacked"
    :height="height"
    :class="{ 'cursor-pointer': !!widget.item_action }"
    @select="onSelect"
  />
</template>
