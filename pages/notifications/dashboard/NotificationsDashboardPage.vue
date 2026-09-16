<template>
  <q-page class="q-pa-sm">
    <s-card flat bordered>
      <q-card-section>
        <div class="text-h6">
          <q-icon name="notifications" class="q-mr-xs" />
          {{ tdc('Notifications') }}
        </div>
      </q-card-section>

      <q-separator />

      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
      </div>

      <template v-else>
        <q-card-section class="row q-col-gutter-md">
          <div class="col-6 col-md-3">
            <s-card flat bordered>
              <q-card-section>
                <div class="text-caption text-grey-6">{{ tdc('Total in Outbox') }}</div>
                <div class="text-h5 text-weight-bold">{{ data.total_outbox }}</div>
              </q-card-section>
            </s-card>
          </div>
          <div class="col-6 col-md-3">
            <s-card flat bordered>
              <q-card-section>
                <div class="text-caption text-grey-6">{{ tdc('Active Rules') }}</div>
                <div class="text-h5 text-weight-bold">
                  {{ data.active_rules_count }} / {{ data.total_rules_count }}
                </div>
              </q-card-section>
            </s-card>
          </div>
          <div class="col-6 col-md-3">
            <s-card flat bordered>
              <q-card-section>
                <div class="text-caption text-grey-6">{{ tdc('Delivery Attempts') }}</div>
                <div class="text-h5 text-weight-bold">{{ data.total_delivery_attempts }}</div>
              </q-card-section>
            </s-card>
          </div>
          <div class="col-6 col-md-3">
            <s-card
              flat bordered
              :class="successRateClass"
            >
              <q-card-section>
                <div class="text-caption text-grey-6">{{ tdc('Success Rate') }}</div>
                <div class="text-h5 text-weight-bold" :class="successRateTextClass">
                  {{ data.delivery_success_rate !== null ? data.delivery_success_rate + '%' : '—' }}
                </div>
              </q-card-section>
            </s-card>
          </div>
        </q-card-section>

        <q-card-section class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">
              {{ tdc('Outbox by Status') }}
            </div>
            <div v-if="!data.by_status.length" class="text-caption text-grey-6">
              {{ tdc('No data') }}
            </div>
            <div v-else class="row q-gutter-sm">
              <q-badge
                v-for="item in data.by_status" :key="item.status"
                :color="statusColor(item.status)"
                class="q-pa-sm"
              >
                {{ item.status }}: {{ item.total }}
              </q-badge>
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">
              {{ tdc('Outbox by Channel') }}
            </div>
            <div v-if="!data.by_channel.length" class="text-caption text-grey-6">
              {{ tdc('No data') }}
            </div>
            <div v-else class="row q-gutter-sm">
              <q-badge
                v-for="item in data.by_channel" :key="item.channel"
                color="secondary"
                class="q-pa-sm"
              >
                {{ item.channel }}: {{ item.total }}
              </q-badge>
            </div>
          </div>
        </q-card-section>

        <q-card-section>
          <div class="text-subtitle2 text-weight-medium q-mb-sm">
            {{ tdc('Recent Failures') }}
          </div>
          <div v-if="!data.recent_failures.length" class="text-caption text-grey-6">
            {{ tdc('No failures recorded') }}
          </div>
          <q-list v-else separator>
            <q-item v-for="item in data.recent_failures" :key="item.id">
              <q-item-section avatar>
                <q-icon name="error" color="negative" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item.event }} ({{ item.channel }})</q-item-label>
                <q-item-label caption>{{ item.recipient_identity }}</q-item-label>
                <q-item-label caption class="text-negative">{{ item.last_error || '—' }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>{{ item.updated_at }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </template>
    </s-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { tdc } from '../../../services/translation'
import { HTTPAuth, url } from '../../../services/api'

const loading = ref(true)
const data = ref({
  total_outbox: 0,
  by_status: [],
  by_channel: [],
  total_delivery_attempts: 0,
  successful_delivery_attempts: 0,
  delivery_success_rate: null,
  active_rules_count: 0,
  total_rules_count: 0,
  recent_failures: [],
})

const successRateClass = computed(() => {
  if (data.value.delivery_success_rate === null) return ''
  return data.value.delivery_success_rate < 90 ? 'border-negative' : ''
})

const successRateTextClass = computed(() => {
  if (data.value.delivery_success_rate === null) return ''
  return data.value.delivery_success_rate < 90 ? 'text-negative' : 'text-positive'
})

function statusColor(status) {
  return {
    pending: 'grey',
    dispatching: 'info',
    queued: 'info',
    processing: 'primary',
    retry: 'warning',
    sent: 'positive',
    failed: 'negative',
    cancelled: 'grey',
  }[status] || 'grey'
}

onMounted(async () => {
  loading.value = true
  try {
    const { data: response } = await HTTPAuth.get(url({
      type: 'u',
      url: 'notifications/dashboard',
    }))
    data.value = response
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.border-negative {
  border-color: var(--q-negative) !important;
}
</style>
