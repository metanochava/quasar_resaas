<template>
  <s-card flat class="column full-height notification-credentials-card">
    <q-bar
      :class="
        $q.dark.isActive
          ? 'bg-dark text-white'
          : 'bg-primary text-white'
      "
    >
      <q-icon name="forum" size="22px" />

      <div class="text-subtitle1 text-weight-bold q-ml-sm">
        {{ tdc('Notification Providers') }} - {{ Entity.row?.name }}
      </div>

      <q-space />

      <s-btn v-close-popup dense flat icon="close">
        <s-tooltip>{{ tdc('Close') }}</s-tooltip>
      </s-btn>
    </q-bar>

    <q-separator />

    <div
      v-if="!isOwnActiveEntity"
      class="col scroll"
    >
      <q-banner class="bg-warning text-dark q-ma-md">
        {{ tdc('You can only manage notification provider credentials for your own active Entity.') }}
      </q-banner>
    </div>

    <q-card-section
      v-else
      class="col scroll q-pa-md"
    >
      <div v-if="loading" class="flex flex-center q-pa-lg">
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
      </div>

      <q-list v-else bordered separator>
        <ChannelCredentialItem
          v-for="channel in channels"
          :key="channel.key"
          :channel="channel"
          :credential="credentialByChannel[channel.key]"
          :saving="savingChannel === channel.key"
          @save="onSaveChannel(channel.key, $event)"
          @toggle-active="onToggleActive(channel.key, $event)"
          @remove="onRemoveChannel(channel.key)"
        />
      </q-list>
    </q-card-section>
  </s-card>
</template>


<script setup>
import { computed, onMounted, ref } from 'vue'

import { useUserStore } from '../../stores/UserStore'
import { useEntityStore } from '../../stores/EntityStore'
import { useNotificationProviderCredentialStore } from '../../stores/NotificationProviderCredentialStore'

import { HTTPAuth, url } from '../../services/api'
import { tdc } from '../../services/translation'

import ChannelCredentialItem from './ChannelCredentialItem.vue'

const props = defineProps({
  entityId: [String, Number]
})

const User = useUserStore()
const Entity = useEntityStore()
const Credential = useNotificationProviderCredentialStore()

const loading = ref(false)
const savingChannel = ref(null)
const rows = ref([])

// Backend scopes list/create/update to the acting user's own active
// Entity (BaseAPIView's default entity_id scoping - no cross-entity
// permission exists for this resource) - so this only makes sense
// when the Entity being edited IS the acting user's own active one.
const isOwnActiveEntity = computed(() =>
  String(User?.Entity?.id) === String(props.entityId)
)

const channels = [
  {
    key: 'email',
    label: 'Email',
    icon: 'mail',
    providerName: 'django',
    fields: [
      { name: 'host', label: 'SMTP host', required: true },
      { name: 'port', label: 'SMTP port', type: 'number' },
      { name: 'username', label: 'Username' },
      { name: 'password', label: 'Password', type: 'password' },
      { name: 'use_tls', label: 'Use TLS', type: 'checkbox' },
      { name: 'use_ssl', label: 'Use SSL', type: 'checkbox' },
      { name: 'from_email', label: 'From address' }
    ]
  },
  {
    key: 'sms',
    label: 'SMS (Twilio)',
    icon: 'sms',
    providerName: 'twilio',
    fields: [
      { name: 'account_sid', label: 'Account SID', required: true },
      { name: 'auth_token', label: 'Auth Token', required: true, type: 'password' },
      { name: 'from_number', label: 'From number', required: true }
    ]
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: 'chat',
    providerName: 'meta_cloud_api',
    fields: [
      { name: 'token', label: 'Access Token', required: true, type: 'password' },
      { name: 'phone_number_id', label: 'Phone Number ID', required: true },
      { name: 'api_version', label: 'API version (optional)' }
    ]
  },
  {
    key: 'push',
    label: 'Push (Firebase)',
    icon: 'notifications_active',
    providerName: 'firebase',
    fields: [
      {
        name: '__json__',
        label: 'Service account JSON',
        type: 'textarea',
        required: true,
        hint: 'Paste the whole Firebase service account JSON here.'
      }
    ]
  }
]

const credentialByChannel = computed(() => {
  const map = {}
  for (const row of rows.value) {
    map[row.channel] = row
  }
  return map
})

async function loadCredentials() {
  loading.value = true

  try {
    await Credential.loadSchemaOnce()

    const { data } = await HTTPAuth.get(
      url({ type: 'u', url: `${Credential.safeUrl}/`, params: { page_size: 100 } })
    )

    rows.value = data.results || data || []
  } finally {
    loading.value = false
  }
}

async function onSaveChannel(channelKey, config) {
  const channel = channels.find(c => c.key === channelKey)
  const existing = credentialByChannel.value[channelKey]

  savingChannel.value = channelKey

  try {
    const payload = {
      channel: channelKey,
      provider_name: channel.providerName,
      is_active: true,
      config
    }

    if (existing) {
      const { data } = await HTTPAuth.patch(
        url({ type: 'u', url: `${Credential.safeUrl}/${existing.id}/` }),
        payload
      )
      rows.value = rows.value.map(r => (r.id === existing.id ? data : r))
    } else {
      const { data } = await HTTPAuth.post(
        url({ type: 'u', url: `${Credential.safeUrl}/` }),
        payload
      )
      rows.value = [...rows.value, data]
    }
  } finally {
    savingChannel.value = null
  }
}

async function onToggleActive(channelKey, isActive) {
  const existing = credentialByChannel.value[channelKey]
  if (!existing) return

  const { data } = await HTTPAuth.patch(
    url({ type: 'u', url: `${Credential.safeUrl}/${existing.id}/` }),
    { is_active: isActive }
  )

  rows.value = rows.value.map(r => (r.id === existing.id ? data : r))
}

async function onRemoveChannel(channelKey) {
  const existing = credentialByChannel.value[channelKey]
  if (!existing) return

  await HTTPAuth.delete(
    url({ type: 'u', url: `${Credential.safeUrl}/${existing.id}/` })
  )

  rows.value = rows.value.filter(r => r.id !== existing.id)
}

onMounted(() => {
  if (isOwnActiveEntity.value) {
    loadCredentials()
  }
})
</script>


<style scoped>
.notification-credentials-card {
  width: 640px;
  max-width: 100%;
}
</style>
