<template>
  <q-expansion-item
    header-class="text-weight-medium"
  >
    <template #header>
      <q-item-section avatar>
        <q-icon :name="channel.icon" />
      </q-item-section>

      <q-item-section>
        {{ channel.label }}
      </q-item-section>

      <q-item-section side>
        <q-chip
          dense
          :color="statusColor"
          text-color="white"
          :label="statusLabel"
        />
      </q-item-section>
    </template>

    <q-card>
      <q-card-section class="q-gutter-sm">
        <div
          v-if="credential"
          class="row items-center q-gutter-sm"
        >
          <s-switch
            :model-value="credential.is_active"
            :label="tdc('Active')"
            @update:model-value="emit('toggle-active', $event)"
          />

          <q-space />

          <s-btn
            flat
            dense
            color="negative"
            icon="delete"
            :label="tdc('Remove override')"
            @click="confirmRemove"
          />
        </div>

        <q-banner v-if="credential" dense class="bg-grey-2 text-caption">
          {{ tdc('For security, existing values are never shown here - enter new ones below only to replace them.') }}
        </q-banner>

        <template v-for="field in channel.fields" :key="field.name">
          <s-input
            v-if="field.type !== 'checkbox' && field.type !== 'textarea'"
            v-model="values[field.name]"
            dense
            outlined
            :label="field.label + (field.required ? ' *' : '')"
            :type="field.type || 'text'"
            :hint="field.hint"
          />

          <s-input
            v-else-if="field.type === 'textarea'"
            v-model="values[field.name]"
            dense
            outlined
            type="textarea"
            autogrow
            :label="field.label + (field.required ? ' *' : '')"
            :hint="field.hint"
          />

          <s-checkbox
            v-else
            v-model="values[field.name]"
            :label="field.label"
          />
        </template>

        <div class="row justify-end q-mt-sm">
          <s-btn
            color="primary"
            :label="tdc('Save')"
            :loading="saving"
            :disable="!canSave"
            @click="save"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-expansion-item>
</template>


<script setup>
import { computed, reactive } from 'vue'
import { useQuasar } from 'quasar'

import { tdc } from '../../services/translation'

const props = defineProps({
  channel: { type: Object, required: true },
  credential: { type: Object, default: null },
  saving: { type: Boolean, default: false }
})

const emit = defineEmits(['save', 'toggle-active', 'remove'])

const $q = useQuasar()

const values = reactive({})
for (const field of props.channel.fields) {
  values[field.name] = field.type === 'checkbox' ? false : ''
}

const statusColor = computed(() => {
  if (!props.credential) return 'grey'
  return props.credential.is_active ? 'positive' : 'grey-7'
})

const statusLabel = computed(() => {
  if (!props.credential) return tdc('Using platform default')
  return props.credential.is_active ? tdc('Configured') : tdc('Configured (inactive)')
})

const canSave = computed(() =>
  props.channel.fields
    .filter(f => f.required)
    .every(f => String(values[f.name] || '').trim().length > 0)
)

function save() {
  if (props.channel.key === 'push') {
    let parsed
    try {
      parsed = JSON.parse(values.__json__)
    } catch (e) {
      $q.notify({ type: 'negative', message: tdc('Invalid JSON.') })
      return
    }
    emit('save', parsed)
    return
  }

  const config = {}
  for (const field of props.channel.fields) {
    const value = values[field.name]
    if (field.type === 'checkbox') {
      config[field.name] = !!value
    } else if (value !== '' && value !== undefined && value !== null) {
      config[field.name] = field.type === 'number' ? Number(value) : value
    }
  }

  emit('save', config)
}

function confirmRemove() {
  $q.dialog({
    title: tdc('Remove override'),
    message: tdc('This entity will fall back to the platform-wide default for this channel. Continue?'),
    cancel: true,
    persistent: true
  }).onOk(() => emit('remove'))
}
</script>
