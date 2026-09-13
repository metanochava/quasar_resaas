<script setup>
import { ref, watch } from 'vue'
import { tdc } from '../../services/translation'
import { HTTPAuth, url } from '../../services/api'

// Lista os models Django reais de uma app scaffolded - GET
// resaasapps/<name>/ (AppSchemaAPIView.retrieve(), backend), que já
// devolve {models: [ModelName, ...]} via introspecção real
// (apps.get_models()) - nenhum endpoint novo, só apresentação.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  appName: { type: String, default: null },
})

const emit = defineEmits(['update:modelValue'])

const loading = ref(false)
const models = ref([])
const error = ref('')

async function load() {
  if (!props.appName) return

  loading.value = true
  error.value = ''
  models.value = []

  try {
    const { data } = await HTTPAuth.get(
      url({ type: 'u', url: `django_resaas/resaasapps/${props.appName}/` })
    )
    models.value = data?.models || []
  } catch (e) {
    error.value = tdc('Could not load the models of this module')
  } finally {
    loading.value = false
  }
}

watch(() => [props.modelValue, props.appName], ([open]) => {
  if (open) load()
})
</script>

<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="v => emit('update:modelValue', v)"
  >
    <s-card class="models-dialog-card">
      <q-bar :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
        <q-icon name="view_module" class="q-mr-sm" />
        <div class="text-subtitle1 text-weight-bold">
          {{ tdc('Models') }} — {{ appName }}
        </div>
        <q-space />
        <s-btn dense flat round icon="close" v-close-popup>
          <q-tooltip>{{ tdc('Close') }}</q-tooltip>
        </s-btn>
      </q-bar>

      <q-separator />

      <q-card-section class="models-dialog-body">
        <div v-if="loading" class="flex flex-center q-pa-xl">
          <q-spinner size="36px" color="primary" />
        </div>

        <div v-else-if="error" class="text-negative text-center q-pa-md">
          {{ error }}
        </div>

        <q-list v-else-if="models.length" separator bordered>
          <q-item v-for="m in models" :key="m">
            <q-item-section avatar>
              <q-avatar color="grey-4" text-color="dark" icon="table_chart" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ m }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <div v-else class="text-center text-grey q-pa-md">
          {{ tdc('No models found for this module') }}
        </div>
      </q-card-section>
    </s-card>
  </q-dialog>
</template>

<style scoped>
.models-dialog-card {
  width: min(480px, 92vw);
  max-height: 80vh;
}

.models-dialog-body {
  max-height: calc(80vh - 50px);
  overflow-y: auto;
}
</style>
