<script setup>
import { tdc } from '../../services/translation'

defineProps({
  label: { type: String, default: 'No data' },
})
</script>

<template>
  <!-- the icon with the text to its right, centred in the widget -->
  <div class="row no-wrap items-center justify-center q-gutter-x-sm q-pa-lg text-grey-6">
    <q-icon name="inbox" size="24px" />
    <div class="text-caption">{{ tdc(label) }}</div>
  </div>
</template>
