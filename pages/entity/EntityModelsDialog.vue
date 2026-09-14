<script setup>
import { ref, computed, watch } from 'vue'
import { tdc } from '../../services/translation'
import { HTTPAuth, url } from '../../services/api'

// Modelos activos para esta Entity (EntityModel) - só entre os que já
// fazem parte do seu EntityType (EntityTypeModel), mesma regra e
// mesmo padrão de EntityAppsDialog.vue (ver ali para o porquê -
// backend valida o mesmo em EntityAPIView.addModel).
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

const modelLabel = (m) => `${m.app_label}.${m.model}`

const hasModel = computed(() => (id) => linked.value.some(m => String(m.id) === String(id)))

const filteredModels = computed(() => {
  const s = search.value.toLowerCase().trim()
  if (!s) return available.value
  return available.value.filter(m => modelLabel(m).toLowerCase().includes(s))
})

async function load() {
  if (!props.entityId || !props.entityTypeId) return

  loading.value = true

  try {
    const [entityTypeModels, entityModels] = await Promise.all([
      HTTPAuth.get(url({ type: 'u', url: `django_resaas/entitytypes/${props.entityTypeId}/models/` })),
      HTTPAuth.get(url({ type: 'u', url: `django_resaas/entitys/${props.entityId}/models/` })),
    ])

    available.value = entityTypeModels.data || []
    linked.value = entityModels.data || []
  } finally {
    loading.value = false
  }
}

async function toggleModel(model) {
  toggling.value = model.id
  const wasLinked = hasModel.value(model.id)
  const old = [...linked.value]

  // optimistic UI
  linked.value = wasLinked
    ? linked.value.filter(m => String(m.id) !== String(model.id))
    : [...linked.value, { ...model }]

  try {
    await HTTPAuth.post(
      url({
        type: 'u',
        url: `django_resaas/entitys/${props.entityId}/${wasLinked ? 'removeModel' : 'addModel'}/`,
      }),
      { id: model.id }
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
    <s-card class="entity-models-dialog-card column no-wrap">
      <q-bar :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
        <q-icon name="table_chart" class="q-mr-sm" />
        <div class="text-subtitle1 text-weight-bold">{{ tdc('Models') }}</div>
        <q-space />
        <q-badge color="white" text-color="primary">{{ linked.length }} {{ tdc('active') }}</q-badge>
        <s-btn dense flat round icon="close" class="q-ml-sm" v-close-popup>
          <s-tooltip>{{ tdc('Close') }}</s-tooltip>
        </s-btn>
      </q-bar>

      <q-separator />

      <div class="q-pa-sm">
        <s-input v-model="search" dense outlined clearable :placeholder="tdc('Search model...')">
          <template #prepend><q-icon name="search" /></template>
        </s-input>
      </div>

      <q-card-section class="col entity-models-dialog-body">
        <div v-if="loading" class="flex flex-center q-pa-xl">
          <q-spinner size="36px" color="primary" />
        </div>

        <q-list v-else-if="filteredModels.length" separator bordered>
          <q-item
            v-for="model in filteredModels" :key="model.id"
            clickable v-ripple
            :class="{ 'model-active': hasModel(model.id) }"
            @click="toggleModel(model)"
          >
            <q-item-section avatar>
              <q-avatar
                :color="hasModel(model.id) ? 'primary' : 'grey-4'"
                :text-color="hasModel(model.id) ? 'white' : 'dark'"
                icon="table_chart"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-medium">{{ modelLabel(model) }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row items-center q-gutter-sm">
                <q-chip dense size="sm" :color="hasModel(model.id) ? 'primary' : 'grey-5'" text-color="white">
                  {{ hasModel(model.id) ? tdc('Active') : tdc('Inactive') }}
                </q-chip>
                <q-checkbox
                  :model-value="hasModel(model.id)"
                  :disable="toggling === model.id"
                  @click.stop
                  @update:model-value="() => toggleModel(model)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <div v-else class="text-center text-grey q-pa-md">
          {{ tdc("This entity's EntityType has no models yet") }}
        </div>
      </q-card-section>
    </s-card>
  </q-dialog>
</template>

<style scoped>
.entity-models-dialog-card {
  width: min(480px, 92vw);
  max-height: 80vh;
}

.entity-models-dialog-body {
  overflow-y: auto;
}

.model-active {
  background: rgba(25, 118, 210, 0.08);
}
</style>
