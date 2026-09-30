<template>
  <s-card flat class="entity-panel storage-panel">
    <div
      class="panel-header"
      :class="$q.dark.isActive ? 'bg-dark' : 'bg-primary'"
    >
      <q-icon name="donut_large" size="20px" color="white" />
      <div class="text-subtitle1 text-weight-bold text-white q-ml-sm">
        {{ tdc('Storage') }}
      </div>
      <q-space />
    </div>

    <div v-if="loading" class="flex flex-center q-pa-lg">
      <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
    </div>

    <q-card-section v-else class="q-pa-md">
      <div
        v-if="!breakdown.length"
        class="text-caption text-grey text-center q-pa-md"
      >
        <q-icon name="cloud_off" size="28px" class="q-mb-xs" />
        <div>{{ tdc('No files uploaded yet.') }}</div>
      </div>

      <!-- one slice per file category; sizes shown human-readable -->
      <s-chart
        v-else
        type="donut"
        :labels="breakdown.map(b => b.category)"
        :series="breakdown.map(b => b.bytes)"
        :format="humanSize"
        total-label="Used"
        :height="260"
      />
    </q-card-section>
  </s-card>
</template>


<script setup>
import { onMounted, ref, watch } from 'vue'

import { useEntityStore } from '../../stores/EntityStore'
import { HTTPAuth, url } from '../../services/api'
import { tdc } from '../../services/translation'


const props = defineProps({
  entityId: [String, Number]
})

const Entity = useEntityStore()

const loading = ref(false)
const breakdown = ref([])

function humanSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}


async function load() {
  if (!props.entityId) return

  loading.value = true

  try {
    const { data } = await HTTPAuth.get(
      url({ type: 'u', url: `${Entity.safeUrl}/${props.entityId}/storage/` })
    )

    breakdown.value = data?.breakdown || []

  } finally {
    loading.value = false
  }
}


watch(() => props.entityId, load)
onMounted(load)
</script>


<style scoped>
.entity-panel {
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
}





</style>
