<script setup>
import { ref, computed, watch } from 'vue'
import { tdc } from '../../services/translation'
import { HTTPAuth, url } from '../../services/api'

// Quais EntityTypes têm esta App activa + possibilidade de adicionar -
// mesma relação/idioma já usado do lado inverso por
// pages/entity_type/AppManager.vue (EntityTypeStore.apps/hasApp/
// toggleApp), aqui invertido: AppAPIView.entityTypes/addEntityType/
// removeEntityType (mesmo modelo EntityTypeApp, sem tabela nova - ver
// data/app/views/app.py). Estado local ao diálogo (não há ainda uma
// store própria para App - não se cria uma só para isto).
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  appId: { type: [String, Number], default: null },
  appName: { type: String, default: null },
})

const emit = defineEmits(['update:modelValue'])

const loading = ref(false)
const linked = ref([])
const adding = ref(false)
const pickerValue = ref(null)

const entityTypesUrl = url({ type: 'u', url: 'django_resaas/entitytypes/' })

const isLinked = computed(() => (id) => linked.value.some(e => String(e.id) === String(id)))

async function load() {
  if (!props.appId) return

  loading.value = true

  try {
    const { data } = await HTTPAuth.get(
      url({ type: 'u', url: `django_resaas/apps/${props.appId}/entityTypes/` })
    )
    linked.value = data || []
  } finally {
    loading.value = false
  }
}

async function addEntityType(entityType) {
  if (!entityType?.id || isLinked.value(entityType.id)) return

  adding.value = true

  try {
    await HTTPAuth.post(
      url({ type: 'u', url: `django_resaas/apps/${props.appId}/addEntityType/` }),
      { id: entityType.id }
    )
    linked.value.push({ id: entityType.id, name: entityType.name || entityType.label })
  } finally {
    adding.value = false
    pickerValue.value = null
  }
}

async function removeEntityType(entityType) {
  const old = [...linked.value]
  linked.value = linked.value.filter(e => String(e.id) !== String(entityType.id))

  try {
    await HTTPAuth.post(
      url({ type: 'u', url: `django_resaas/apps/${props.appId}/removeEntityType/` }),
      { id: entityType.id }
    )
  } catch (e) {
    linked.value = old
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
    <s-card class="et-dialog-card">
      <q-bar :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
        <q-icon name="category" class="q-mr-sm" />
        <div class="text-subtitle1 text-weight-bold">
          {{ tdc('Entity Types') }} — {{ appName }}
        </div>
        <q-space />
        <s-btn dense flat round icon="close" v-close-popup>
          <q-tooltip>{{ tdc('Close') }}</q-tooltip>
        </s-btn>
      </q-bar>

      <q-separator />

      <q-card-section class="q-pb-sm">
        <s-select
          v-model="pickerValue"
          :api="entityTypesUrl"
          option-label="name"
          option-value="id"
          :label="tdc('Add entity type')"
          :loading="adding"
          @update:model-value="addEntityType"
        />
      </q-card-section>

      <q-card-section class="et-dialog-body">
        <div v-if="loading" class="flex flex-center q-pa-xl">
          <q-spinner size="36px" color="primary" />
        </div>

        <q-list v-else-if="linked.length" separator bordered>
          <q-item v-for="et in linked" :key="et.id">
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white" icon="category" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ et.name }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <s-btn flat round dense icon="close" color="negative" @click="removeEntityType(et)">
                <q-tooltip>{{ tdc('Remove') }}</q-tooltip>
              </s-btn>
            </q-item-section>
          </q-item>
        </q-list>

        <div v-else class="text-center text-grey q-pa-md">
          {{ tdc('No entity type has this module active yet') }}
        </div>
      </q-card-section>
    </s-card>
  </q-dialog>
</template>

<style scoped>
.et-dialog-card {
  width: min(480px, 92vw);
  max-height: 80vh;
}

.et-dialog-body {
  max-height: calc(80vh - 130px);
  overflow-y: auto;
}
</style>
