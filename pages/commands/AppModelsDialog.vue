<script setup>
import { ref, watch } from 'vue'
import { tdc } from '../../services/translation'
import { HTTPAuth, url } from '../../services/api'

// Lista os models Django reais de uma app - GET
// resaasapps/lookup/?app=<name> (AppSchemaAPIView.lookup(), backend),
// que devolve {models: [ModelName, ...]} via introspecção real
// (apps.get_models()). Usa query param, não path segment - um nome
// com ponto (ex.: "django_resaas.saas") nunca chegaria inteiro a
// retrieve()/<pk>/ (o router trata "." num path segment como
// separador de format suffix); lookup() existe exactamente para isso,
// e funciona também para nomes sem ponto.
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
      url({ type: 'u', url: 'django_resaas/resaasapps/lookup/', params: { app: props.appName } })
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
    <s-modal-card :title="`${tdc('Models')} — ${appName}`" icon="view_module" width="480px">
      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
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
    </s-modal-card>
  </q-dialog>
</template>
