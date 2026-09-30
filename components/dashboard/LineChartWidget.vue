<script setup>
// line_chart widget - contract {labels, series: [{name, data, color?}]}
// rendered by s-chart (ApexCharts); widget.area fills under the lines. Also
// used outside dashboards through resolveWidgetComponent('line_chart')
// (e.g. a lab parameter's evolution), so `widget` is optional.
defineProps({
  widget: { type: Object, default: () => ({}) },
  data: { type: Object, required: true },
})
</script>

<template>
  <s-chart
    :type="widget.area ? 'area' : 'line'"
    :labels="data.labels || []"
    :series="data.series || []"
    :height="widget.height || 240"
  />
</template>
