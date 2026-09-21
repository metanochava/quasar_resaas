<script setup>
import { ref, computed } from 'vue'

import { useAlertStore } from '../../stores/AlertStore'
import { tdc } from '../../services/translation'
import { levelToQuasar } from '../../utils/apiContract'

// The history of what requests told the user (errors and alerts), shown inside the
// header Notification. The data is the AlertStore; nothing is requested here.
const Alerts = useAlertStore()

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'error', label: 'Errors' },
  { id: 'warning', label: 'Warnings' },
  { id: 'info', label: 'Information' },
  { id: 'success', label: 'Success' }
]

const ICONS = { success: 'check_circle', info: 'info', warning: 'warning', error: 'error' }

const filter = ref('all')

const items = computed(() => Alerts.newestFirst.filter(alert => {
  if (filter.value === 'all') return true
  if (filter.value === 'unread') return !alert.read
  return alert.level === filter.value
}))

const countOf = (id) => {
  if (id === 'all') return Alerts.data.length
  if (id === 'unread') return Alerts.unreadCount
  return Alerts.countByLevel[id] || 0
}

const colorOf = (level) => levelToQuasar(level)

// messages may carry the <b>...</b> some backend texts use; shown as plain text here
const plain = (text) => String(text ?? '').replace(/<[^>]*>/g, '')
const time = (value) => (value ? new Date(value).toLocaleString() : '')

function open(alert) {
  Alerts.markAsRead(alert)
}
</script>

<template>
  <div class="column no-wrap alert-history" data-test="alert-history">
    <div class="row items-center q-gutter-xs q-px-md q-py-sm alert-toolbar">
      <q-chip
        v-for="option in FILTERS"
        :key="option.id"
        dense
        clickable
        :outline="filter !== option.id"
        :color="filter === option.id ? 'primary' : undefined"
        :text-color="filter === option.id ? 'white' : undefined"
        :data-test="`alert-filter-${option.id}`"
        @click="filter = option.id"
      >
        {{ tdc(option.label) }} ({{ countOf(option.id) }})
      </q-chip>

      <q-space />

      <s-btn
        flat dense no-caps icon="done_all" color="primary"
        :label="tdc('Mark all as read')"
        :disable="!Alerts.unreadCount"
        data-test="alert-mark-all"
        @click="Alerts.markAllAsRead()"
      />
      <s-btn
        flat dense no-caps icon="delete_sweep" color="negative"
        :label="tdc('Clear all')"
        :disable="!Alerts.data.length"
        data-test="alert-clear"
        @click="Alerts.clear()"
      />
    </div>

    <q-separator />

    <div v-if="!items.length" class="column flex-center q-pa-xl text-grey" data-test="alert-empty">
      <q-icon name="notifications_none" size="50px" />
      <div class="q-mt-sm">{{ tdc('No alerts') }}</div>
      <div class="text-caption">{{ tdc('Messages from your actions will appear here.') }}</div>
    </div>

    <q-scroll-area v-else class="col alert-scroll">
      <q-list separator>
        <q-item
          v-for="alert in items"
          :key="alert.id"
          clickable
          :class="{ 'alert-unread': !alert.read }"
          data-test="alert-item"
          @click="open(alert)"
        >
          <q-item-section avatar>
            <q-icon :name="ICONS[alert.level] || 'info'" :color="colorOf(alert.level)" size="24px" />
          </q-item-section>

          <q-item-section>
            <q-item-label :class="{ 'text-weight-bold': !alert.read }" data-test="alert-message">{{ plain(alert.message) }}</q-item-label>
            <q-item-label caption class="row items-center q-gutter-x-sm">
              <span>{{ time(alert.createdAt) }}</span>
              <q-badge v-if="alert.code" outline color="grey-7" :label="alert.code" data-test="alert-code" />
              <span v-if="alert.request" class="text-grey-6" data-test="alert-request">
                {{ alert.request.method }} {{ alert.request.path }}
              </span>
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="row items-center no-wrap">
              <s-btn
                v-if="!alert.read"
                flat round dense icon="check" size="sm"
                :aria-label="tdc('Mark as read')"
                data-test="alert-read"
                @click.stop="Alerts.markAsRead(alert)"
              >
                <s-tooltip>{{ tdc('Mark as read') }}</s-tooltip>
              </s-btn>
              <s-btn
                flat round dense icon="close" size="sm"
                :aria-label="tdc('Remove')"
                data-test="alert-remove"
                @click.stop="Alerts.remove(alert)"
              >
                <s-tooltip>{{ tdc('Remove') }}</s-tooltip>
              </s-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </div>
</template>

<style scoped>
.alert-history { height: 100%; min-height: 0; }
.alert-scroll { flex: 1 1 auto; min-height: 0; }
.alert-unread { background: rgba(25, 118, 210, 0.08); }
</style>
