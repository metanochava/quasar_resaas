<script setup>
import { ref, computed, watch } from 'vue'
import { tdc } from '../../services/translation'
import { HTTPAuth, url } from '../../services/api'
import { sDialog } from '../../services/dialog'

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

function confirmRemoveEntityType(entityType) {
  sDialog({
    title: tdc('Confirm'),
    message: tdc('Remove this entity type from "{name}"?').replace('{name}', props.appName),
    cancel: true,
    persistent: true,
  }).onOk(() => removeEntityType(entityType))
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
    <s-modal-card :title="`${tdc('Entity Types')} — ${appName}`" icon="category" width="480px">
      <template #subheader>
        <s-select
          v-model="pickerValue"
          :api="entityTypesUrl"
          option-label="name"
          option-value="id"
          :label="tdc('Add entity type')"
          :loading="adding"
          @update:model-value="addEntityType"
        />
      </template>

      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
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
            <s-btn flat round dense icon="close" color="negative" @click="confirmRemoveEntityType(et)">
              <s-tooltip>{{ tdc('Remove') }}</s-tooltip>
            </s-btn>
          </q-item-section>
        </q-item>
      </q-list>

      <div v-else class="text-center text-grey q-pa-md">
        {{ tdc('No entity type has this module active yet') }}
      </div>
    </s-modal-card>
  </q-dialog>
</template>
