<template>
  <q-page class="q-pa-sm">
    <s-card flat bordered>
      <q-card-section>
        <div class="text-h6">
          <q-icon name="trending_up" class="q-mr-xs" />
          {{ tdc('Performance') }}
        </div>
      </q-card-section>

      <q-separator />

      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner size="40px" color="primary" />
      </div>

      <template v-else>
        <q-card-section class="row q-col-gutter-md">
          <div class="col-6">
            <s-card flat bordered>
              <q-card-section>
                <div class="text-caption text-grey-6">{{ tdc('Active Cycle') }}</div>
                <div class="text-h6 text-weight-bold">{{ data.active_cycle?.name || tdc('None') }}</div>
              </q-card-section>
            </s-card>
          </div>
          <div class="col-6">
            <s-card flat bordered class="border-warning">
              <q-card-section>
                <div class="text-caption text-grey-6">{{ tdc('Pending Reviews') }}</div>
                <div class="text-h5 text-weight-bold text-warning">{{ data.pending_reviews }}</div>
              </q-card-section>
            </s-card>
          </div>
        </q-card-section>

        <q-card-section>
          <div class="text-subtitle2 text-weight-medium q-mb-sm">
            {{ tdc('Goals by Status') }}
          </div>
          <div v-if="!data.goals_by_status.length" class="text-caption text-grey-6">
            {{ tdc('No data') }}
          </div>
          <div v-else class="row q-gutter-sm">
            <q-badge v-for="item in data.goals_by_status" :key="item.status" color="primary" class="q-pa-sm">
              {{ item.status }}: {{ item.total }}
            </q-badge>
          </div>
        </q-card-section>
      </template>
    </s-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { tdc } from '../../../services/translation'
import { HTTPAuth, url } from '../../../services/api'

const loading = ref(true)
const data = ref({
  active_cycle: null,
  pending_reviews: 0,
  goals_by_status: [],
})

onMounted(async () => {
  loading.value = true
  try {
    const { data: response } = await HTTPAuth.get(url({
      type: 'u',
      url: 'hr/dashboard_desempenho',
    }))
    data.value = response
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.border-warning {
  border-color: var(--q-warning) !important;
}
</style>
