<script setup>
import { tdc } from '../../services/translation'

// Top toolbar (mega-prompt secção 4/5/56/57) - project/app/model
// selection + the core action flow (Generate -> Validate -> Diff ->
// Save). Purely presentational/event-emitting - ScaffoldPage.vue owns
// what each action actually does.
const props = defineProps({
  apps: { type: Array, default: () => [] },
  selectedApp: { type: String, default: null },
  models: { type: Array, default: () => [] },
  selectedModel: { type: String, default: null },

  activeFile: { type: Object, default: null },
  errorCount: { type: Number, default: 0 },
  dirtyCount: { type: Number, default: 0 },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:selectedApp', 'update:selectedModel',
  'validate', 'save', 'discard', 'refresh', 'toggle-generator',
])

function saveLabel() {
  if (props.saving) return tdc('Saving...')
  if (!props.activeFile) return tdc('Save')
  if (props.errorCount > 0) return tdc('Invalid')
  if (props.activeFile.dirty) return tdc('Save')
  return tdc('Saved')
}
</script>

<template>
  <s-card flat bordered class="toolbar">
    <div class="row items-center q-gutter-sm q-pa-sm">
      <q-icon name="developer_mode" size="24px" color="primary" />
      <div class="text-subtitle1 text-weight-bold">{{ tdc('Scaffold IDE') }}</div>

      <q-separator vertical inset />

      <s-select
        style="min-width: 160px"
        dense
        :model-value="selectedApp"
        :options="apps"
        option-value="name"
        option-label="name"
        emit-value
        map-options
        :label="tdc('App')"
        @update:model-value="v => emit('update:selectedApp', v)"
      />

      <s-select
        style="min-width: 160px"
        dense
        :model-value="selectedModel"
        :options="models"
        :label="tdc('Model')"
        @update:model-value="v => emit('update:selectedModel', v)"
      />

      <q-space />

      <s-btn flat dense icon="add_box" :label="tdc('Generate')" @click="emit('toggle-generator')" />

      <s-btn
        v-if="activeFile"
        flat dense icon="fact_check" :label="tdc('Validate')"
        @click="emit('validate')"
      />

      <s-btn
        v-if="activeFile?.dirty"
        flat dense icon="undo" color="grey-7" :label="tdc('Discard')"
        @click="emit('discard')"
      />

      <s-btn
        v-if="activeFile"
        dense
        :color="errorCount > 0 ? 'negative' : 'primary'"
        icon="save"
        :label="saveLabel()"
        :loading="saving"
        :disable="!activeFile.dirty || errorCount > 0"
        @click="emit('save')"
      >
        <q-tooltip v-if="errorCount > 0">{{ tdc('Fix validation errors before saving') }}</q-tooltip>
      </s-btn>

      <q-badge v-if="dirtyCount > 0" color="warning" text-color="dark">
        {{ dirtyCount }} {{ tdc('unsaved') }}
      </q-badge>

      <s-btn flat dense round icon="refresh" @click="emit('refresh')">
        <q-tooltip>{{ tdc('Refresh') }}</q-tooltip>
      </s-btn>
    </div>
  </s-card>
</template>

<style scoped>
.toolbar {
  position: sticky;
  top: 0;
  z-index: 5;
}
</style>
