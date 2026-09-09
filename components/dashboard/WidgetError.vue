<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'

const props = defineProps({
  error: { type: Object, default: null },
})

defineEmits(['retry'])

const message = computed(() => props.error?.message || 'Error loading widget.')
</script>

<template>
  <div class="column flex-center q-pa-md text-negative">
    <q-icon name="error_outline" size="28px" class="q-mb-xs" />
    <div class="text-caption text-center">{{ message }}</div>
    <q-btn
      flat dense size="sm" color="negative" icon="refresh"
      :label="tdc('Retry')" class="q-mt-xs"
      @click="$emit('retry')"
    />
  </div>
</template>
