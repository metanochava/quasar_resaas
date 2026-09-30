<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { resolveDashboardAction } from '../../services/dashboardActions'

// pie_chart widget - same contract {labels, series} as bar_chart/line_chart:
// a pie only makes sense with ONE series (the slices ARE the categories), so
// series[0] is used; series[0].colors (optional, parallel to labels) asks for
// semantic colours per slice ('positive', 'negative', ...). A donut with the
// total in the middle unless widget.donut === false. Rendered by s-chart.
const props = defineProps({
  widget: { type: Object, default: () => ({}) },
  data: { type: Object, required: true },
})

const router = useRouter()

const first = computed(() => (props.data.series || [])[0] || {})

function onSelect({ index, label }) {
  if (!props.widget.item_action) return
  const code = props.data.codes?.[index] ?? props.data.labels?.[index] ?? label
  resolveDashboardAction(props.widget.item_action, { router, context: { code, label: props.data.labels?.[index] ?? label } })
}
</script>

<template>
  <s-chart
    :type="widget.donut === false ? 'pie' : 'donut'"
    :labels="data.labels || []"
    :series="first.data || []"
    :colors="first.colors || []"
    :height="widget.height || 280"
    :class="{ 'cursor-pointer': !!widget.item_action }"
    @select="onSelect"
  />
</template>
