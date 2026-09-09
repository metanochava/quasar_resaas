<script setup>
import { tdc } from '../../services/translation'

defineProps({
  label: { type: String, default: 'No data' },
})
</script>

<template>
  <div class="column flex-center q-pa-lg text-grey-6">
    <q-icon name="inbox" size="28px" class="q-mb-xs" />
    <div class="text-caption">{{ tdc(label) }}</div>
  </div>
</template>
