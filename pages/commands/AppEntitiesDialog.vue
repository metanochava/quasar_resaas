<script setup>
import { ref, computed, watch } from 'vue'
import { tdc } from '../../services/translation'
import { HTTPAuth, url } from '../../services/api'
import { sDialog } from '../../services/dialog'
import { useUserStore } from '../../stores/UserStore'

// The Entities that use a module (EntityApp), next to AppEntityTypesDialog's
// entity types: apps/{id}/entities/ (GET active + available, POST link,
// DELETE entities/{entity}/ unlink). Only an Entity whose type has the
// module can use it - "available" lists exactly those.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  appId: { type: [String, Number], default: null },
  appName: { type: String, default: null },
})

const emit = defineEmits(['update:modelValue'])

// UX only - linking / unlinking needs change_app on the backend
const canChange = computed(() => useUserStore().can('change_app'))

const loading = ref(false)
const saving = ref(false)
const active = ref([])
const available = ref([])
const picked = ref(null)

const base = computed(() => `django_resaas/apps/${props.appId}/entities/`)
const options = computed(() => available.value.map(e => ({
  value: e.id,
  label: e.entity_type ? `${e.name} · ${e.entity_type}` : e.name,
})))

async function load() {
  if (!props.appId) return
  loading.value = true
  try {
    const { data } = await HTTPAuth.get(url({ type: 'u', url: base.value }))
    active.value = data?.active || []
    available.value = data?.available || []
  } finally {
    loading.value = false
  }
}

async function addEntity(entityId) {
  if (!entityId) return
  saving.value = true
  try {
    await HTTPAuth.post(url({ type: 'u', url: base.value }), { entity: entityId })
    await load()
  } finally {
    saving.value = false
    picked.value = null
  }
}

function confirmRemove(entity) {
  sDialog({
    title: tdc('Confirm'),
    message: tdc('Remove this entity from "{name}"?').replace('{name}', props.appName),
    cancel: true,
    persistent: true,
  }).onOk(() => removeEntity(entity))
}

async function removeEntity(entity) {
  saving.value = true
  try {
    await HTTPAuth.delete(url({ type: 'u', url: `${base.value}${entity.id}/` }))
    await load()
  } finally {
    saving.value = false
  }
}

watch(() => [props.modelValue, props.appId], ([open]) => {
  if (open) load()
})
</script>

<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="v => emit('update:modelValue', v)"
  >
    <s-modal-card :title="`${tdc('Entities')} — ${appName}`" icon="apartment" width="520px">
      <template v-if="canChange" #subheader>
        <s-select
          v-model="picked"
          :options="options"
          emit-value map-options
          :label="tdc('Add entity')"
          :hint="tdc('Only entities whose type has this module can use it')"
          :loading="saving"
          data-test="app-entities-picker"
          @update:model-value="addEntity"
        />
      </template>

      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
      </div>

      <q-list v-else-if="active.length" separator bordered>
        <q-item v-for="e in active" :key="e.id" data-test="app-entity">
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white" icon="apartment" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">{{ e.name }}</q-item-label>
            <q-item-label v-if="e.entity_type" caption>{{ e.entity_type }}</q-item-label>
          </q-item-section>
          <q-item-section v-if="canChange" side>
            <s-btn flat round dense icon="close" color="negative" :disable="saving" @click="confirmRemove(e)">
              <s-tooltip>{{ tdc('Remove from this module') }}</s-tooltip>
            </s-btn>
          </q-item-section>
        </q-item>
      </q-list>

      <div v-else class="text-center text-grey q-pa-md">
        {{ tdc('No entity uses this module yet') }}
      </div>
    </s-modal-card>
  </q-dialog>
</template>
