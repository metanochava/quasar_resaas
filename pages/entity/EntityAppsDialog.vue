<script setup>
import { ref, computed, watch } from 'vue'
import { tdc } from '../../services/translation'
import { HTTPAuth, url } from '../../services/api'

// Apps activas para esta Entity (EntityApp) - só entre as que já
// fazem parte do seu EntityType (EntityTypeApp), nunca o registo
// global de Apps (esse universo é escolhido ao nível do EntityType -
// ver pages/entity_type/AppManager.vue/EntityTypeStore.apps - aqui só
// se escolhe dentro do que o EntityType já disponibiliza). Backend
// valida o mesmo (EntityAPIView.addApp rejeita 400 fora do
// EntityTypeApp), este ecrã só reflecte essa regra.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  entityId: { type: [String, Number], default: null },
  entityTypeId: { type: [String, Number], default: null },
})

const emit = defineEmits(['update:modelValue'])

const loading = ref(false)
const toggling = ref(null)
const search = ref('')

const available = ref([])
const linked = ref([])

const hasApp = computed(() => (id) => linked.value.some(a => String(a.id) === String(id)))

const filteredApps = computed(() => {
  const s = search.value.toLowerCase().trim()
  if (!s) return available.value
  return available.value.filter(a => (a.name || '').toLowerCase().includes(s))
})

async function load() {
  if (!props.entityId || !props.entityTypeId) return

  loading.value = true

  try {
    const [entityTypeApps, entityApps] = await Promise.all([
      HTTPAuth.get(url({ type: 'u', url: `django_resaas/entitytypes/${props.entityTypeId}/apps/` })),
      HTTPAuth.get(url({ type: 'u', url: `django_resaas/entitys/${props.entityId}/apps/` })),
    ])

    available.value = entityTypeApps.data || []
    linked.value = entityApps.data || []
  } finally {
    loading.value = false
  }
}

async function toggleApp(app) {
  toggling.value = app.id
  const wasLinked = hasApp.value(app.id)
  const old = [...linked.value]

  // optimistic UI
  linked.value = wasLinked
    ? linked.value.filter(a => String(a.id) !== String(app.id))
    : [...linked.value, { id: app.id, name: app.name }]

  try {
    await HTTPAuth.post(
      url({
        type: 'u',
        url: `django_resaas/entitys/${props.entityId}/${wasLinked ? 'removeApp' : 'addApp'}/`,
      }),
      { id: app.id }
    )
  } catch (e) {
    linked.value = old
  } finally {
    toggling.value = null
  }
}

watch(() => [props.modelValue, props.entityId, props.entityTypeId], ([open]) => {
  if (open) load()
})
</script>

<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="v => emit('update:modelValue', v)"
  >
    <s-card class="entity-apps-dialog-card column no-wrap">
      <q-bar :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
        <q-icon name="extension" class="q-mr-sm" />
        <div class="text-subtitle1 text-weight-bold">{{ tdc('Apps') }}</div>
        <q-space />
        <q-badge color="white" text-color="primary">{{ linked.length }} {{ tdc('active') }}</q-badge>
        <s-btn dense flat round icon="close" class="q-ml-sm" v-close-popup>
          <s-tooltip>{{ tdc('Close') }}</s-tooltip>
        </s-btn>
      </q-bar>

      <q-separator />

      <div class="q-pa-sm">
        <s-input v-model="search" dense outlined clearable :placeholder="tdc('Search app...')">
          <template #prepend><q-icon name="search" /></template>
        </s-input>
      </div>

      <q-card-section class="col entity-apps-dialog-body">
        <div v-if="loading" class="flex flex-center q-pa-xl">
          <q-spinner size="36px" color="primary" />
        </div>

        <q-list v-else-if="filteredApps.length" separator bordered>
          <q-item
            v-for="app in filteredApps" :key="app.id"
            clickable v-ripple
            :class="{ 'app-active': hasApp(app.id) }"
            @click="toggleApp(app)"
          >
            <q-item-section avatar>
              <q-avatar
                :color="hasApp(app.id) ? 'primary' : 'grey-4'"
                :text-color="hasApp(app.id) ? 'white' : 'dark'"
                icon="extension"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-medium">{{ app.name }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row items-center q-gutter-sm">
                <q-chip dense size="sm" :color="hasApp(app.id) ? 'primary' : 'grey-5'" text-color="white">
                  {{ hasApp(app.id) ? tdc('Active') : tdc('Inactive') }}
                </q-chip>
                <q-checkbox
                  :model-value="hasApp(app.id)"
                  :disable="toggling === app.id"
                  @click.stop
                  @update:model-value="() => toggleApp(app)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <div v-else class="text-center text-grey q-pa-md">
          {{ tdc("This entity's EntityType has no apps yet") }}
        </div>
      </q-card-section>
    </s-card>
  </q-dialog>
</template>

<style scoped>
.entity-apps-dialog-card {
  width: min(480px, 92vw);
  max-height: 80vh;
}

.entity-apps-dialog-body {
  overflow-y: auto;
}

.app-active {
  background: rgba(25, 118, 210, 0.08);
}
</style>
