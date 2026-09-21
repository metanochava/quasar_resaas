<script setup>
import { ref, computed, watch } from 'vue'
import { tdc } from '../../services/translation'
import { HTTPAuth, url } from '../../services/api'

// Modelos activos para esta Entity (EntityModel) - só entre os que já
// fazem parte do seu EntityType (EntityTypeModel), mesma regra de
// EntityAppsDialog.vue (backend valida o mesmo em
// EntityAPIView.addModel).
//
// Mesmo layout/estrutura de ModelManager.vue (entity_type) - agrupado
// por app_label via q-expansion-item, com checkbox "seleccionar
// tudo" por grupo - o <q-dialog persistent full-height full-width>
// fica na página que usa este componente, não aqui (mesma divisão de
// EntityTypeSEPage.vue).
const props = defineProps({
  entityId: { type: [String, Number], default: null },
  entityTypeId: { type: [String, Number], default: null },
})

const loading = ref(false)
const toggling = ref(null)
const search = ref('')

const available = ref([])
const linked = ref([])

const isSelected = computed(() => (id) => linked.value.some(m => String(m.id) === String(id)))

function formatName(value) {
  return (value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

const filteredModels = computed(() => {
  const s = search.value.toLowerCase().trim()
  if (!s) return available.value
  return available.value.filter(m =>
    `${m.app_label}.${m.model}`.toLowerCase().includes(s)
  )
})

const groupedModels = computed(() => {
  const groups = {}
  for (const model of filteredModels.value) {
    const key = model.app_label || ''
    if (!groups[key]) groups[key] = []
    groups[key].push(model)
  }
  return groups
})

function allSelected(models) {
  return models.every(m => isSelected.value(m.id))
}

async function toggleModel(model) {
  toggling.value = model.id
  const wasLinked = isSelected.value(model.id)
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

function toggleGroup(models, checked) {
  models.forEach(item => {
    const exists = isSelected.value(item.id)
    if (checked && !exists) toggleModel(item)
    if (!checked && exists) toggleModel(item)
  })
}

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

watch(() => [props.entityId, props.entityTypeId], load, { immediate: true })
</script>

<template>
  <s-modal-card :title="tdc('Models Management')" icon="table_chart" fullscreen flush>
    <template #bar-actions>
      <q-badge color="white" text-color="primary">
        {{ linked.length }} {{ tdc('active') }}
      </q-badge>
    </template>

    <!-- static search: only the list below scrolls -->
    <template #subheader>
    <q-input
      v-model="search"
      outlined
      dense
      clearable
      :label="tdc('Search')"
    >
      <template #prepend>
        <q-icon name="search" />
      </template>
    </q-input>
    </template>

    <div class="col scroll" style="min-height: 0;">

      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
      </div>

      <q-list v-else separator>
        <q-expansion-item
          v-for="(models, app) in groupedModels"
          :key="app"
          expand-separator
          icon="table_chart"
        >

          <!-- HEADER -->
          <template #header>
            <q-item-section avatar>
              <q-icon name="table_chart" color="primary" />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-bold">
                {{ formatName(app) }}
              </q-item-label>
              <q-item-label caption>
                {{ models.length }} {{ tdc('models') }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-checkbox
                :model-value="allSelected(models)"
                @click.stop
                @update:model-value="val => toggleGroup(models, val)"
              />
            </q-item-section>
          </template>

          <!-- ITEMS -->
          <q-item
            v-for="item in models"
            :key="item.id"
            clickable
            v-ripple
            @click="toggleModel(item)"
          >
            <q-item-section avatar>
              <q-checkbox
                :model-value="isSelected(item.id)"
                :disable="toggling === item.id"
                @click.stop
                @update:model-value="() => toggleModel(item)"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label>
                {{ formatName(item.model) }}
              </q-item-label>
              <q-item-label caption>
                {{ item.app_label }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-badge
                :color="isSelected(item.id) ? 'primary' : 'grey'"
                outline
              >
                {{ isSelected(item.id) ? tdc('Active') : tdc('Inactive') }}
              </q-badge>
            </q-item-section>
          </q-item>

        </q-expansion-item>
      </q-list>

      <div v-if="!loading && !filteredModels.length" class="text-center text-grey q-pa-md">
        {{ tdc("This entity's EntityType has no models yet") }}
      </div>

    </div>
  </s-modal-card>
</template>
