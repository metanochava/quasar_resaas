<template>
  <s-modal-card :title="tdc('Notification Preferences')" icon="forum" width="min(900px, 95vw)">
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
    </div>

    <div v-else>
      <div class="text-caption text-grey q-mb-md">
        {{ tdc('A channel is allowed by default until explicitly turned off here - except Marketing, which is opt-in only.') }}
      </div>

      <table class="preferences-table">
        <thead>
          <tr>
            <th></th>
            <th v-for="channel in channels" :key="channel.value">{{ tdc(channel.label) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in categories" :key="category.value">
            <td class="text-weight-medium">{{ tdc(category.label) }}</td>
            <td v-for="channel in channels" :key="channel.value" class="text-center">
              <q-toggle
                :model-value="isEnabled(category.value, channel.value)"
                color="primary"
                :disable="saving[`${category.value}:${channel.value}`]"
                @update:model-value="value => toggle(category.value, channel.value, value)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </s-modal-card>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { HTTPAuth, url } from '../../services/api'
import { tdc } from '../../services/translation'

// Reuses the generic NotificationPreferenceAPIView (BaseAPIView-based,
// notifications/preferences/) - its DynamicFilterBackend
// already supports ?recipient_key=<value> as a plain exact-match filter
// (see saas/core/base/views.py), no backend change needed. entity/
// branch/created_by/updated_by are auto-injected by
// BaseAPIView.perform_create() on POST.
const props = defineProps({
  userId: [String, Number]
})

const recipientKey = () => `user:${props.userId}`

// Mirrors django_resaas.notifications.enums.Channel/Category
const channels = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'push', label: 'Push' }
]

const categories = [
  { value: 'transactional', label: 'Transactional' },
  { value: 'security', label: 'Security' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'system', label: 'System' },
  { value: 'marketing', label: 'Marketing' }
]

const loading = ref(false)
const rows = ref([])
const saving = reactive({})

// BaseSerializer represents a choice field as {id,value,label} on read
// (RepresentationMixin, same convention as everywhere else in this
// codebase - see AutoTable.vue's toggleEstado()) - compare against
// .value, not the raw object, even though it still accepts a plain
// string on write (see toggle() below).
function findRow(category, channel) {
  return rows.value.find(r => r.category?.value === category && r.channel?.value === channel)
}

function isEnabled(category, channel) {
  const row = findRow(category, channel)
  // Absence means "allowed" for every category except marketing
  // (opt-in only) - see NotificationPreference's own docstring.
  return row ? row.enabled : category !== 'marketing'
}

async function load() {
  if (!props.userId) {
    rows.value = []
    return
  }

  loading.value = true

  try {
    const { data } = await HTTPAuth.get(
      url({
        type: 'u',
        url: 'notifications/preferences/',
        params: { recipient_key: recipientKey(), page_size: 0 }
      })
    )
    rows.value = data?.results || []
  } finally {
    loading.value = false
  }
}

async function toggle(category, channel, enabled) {
  const key = `${category}:${channel}`
  saving[key] = true

  try {
    const row = findRow(category, channel)

    if (row) {
      await HTTPAuth.patch(
        url({ type: 'u', url: `notifications/preferences/${row.id}/` }),
        { enabled }
      )
      row.enabled = enabled
    } else {
      const { data } = await HTTPAuth.post(
        url({ type: 'u', url: 'notifications/preferences/' }),
        {
          recipient_type: 'user',
          recipient_key: recipientKey(),
          channel,
          category,
          enabled
        }
      )
      rows.value = [...rows.value, data]
    }
  } finally {
    saving[key] = false
  }
}

watch(() => props.userId, load)
onMounted(load)
</script>

<style scoped>
.preferences-table {
  width: 100%;
  border-collapse: collapse;
}

.preferences-table th,
.preferences-table td {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.15);
}
</style>
