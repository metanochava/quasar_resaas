<template>
  <!-- The layers of the Form Engine's forms (django_resaas formdefinitions):
       list them, write a new version as JSON with a live preview, publish it,
       and see the form a key resolves to for this Entity / Branch. The
       backend validates every definition and decides who keeps which layer
       (platform / entity type: Root; entity / branch: the Entity's Admin). -->
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- LIST -->
      <div class="col-12 col-md-4">
        <s-card flat bordered>
          <q-card-section class="row items-center no-wrap q-py-sm">
            <q-icon name="dynamic_form" color="primary" class="q-mr-xs" />
            <div class="text-subtitle1 text-weight-medium">{{ tdc('Forms') }}</div>
            <q-space />
            <s-btn v-if="can('add_formdefinition')" flat dense round icon="add" color="primary"
                   data-test="fd-new" @click="newDefinition">
              <s-tooltip>{{ tdc('New form layer') }}</s-tooltip>
            </s-btn>
            <s-btn flat dense round icon="refresh" @click="load">
              <s-tooltip>{{ tdc('Reload the list') }}</s-tooltip>
            </s-btn>
          </q-card-section>
          <q-separator />
          <div v-if="loading" class="flex flex-center q-pa-md"><q-spinner color="primary" size="32px" /></div>
          <div v-else-if="!rows.length" class="text-caption text-grey-6 q-pa-md">{{ tdc('No forms yet.') }}</div>
          <q-list v-else dense separator data-test="fd-list">
            <q-item v-for="row in rows" :key="row.id" clickable :active="selected?.id === row.id"
                    active-class="bg-primary text-white" @click="select(row)">
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ row.key }}</q-item-label>
                <q-item-label caption :class="{ 'text-white': selected?.id === row.id }">
                  {{ tdc(levelLabel(row.level)) }} · v{{ row.version }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge :color="row.status === 'published' ? 'positive' : 'grey'"
                         :label="tdc(row.status === 'published' ? 'Published' : 'Draft')" />
              </q-item-section>
            </q-item>
          </q-list>
        </s-card>
      </div>

      <!-- EDITOR + PREVIEW -->
      <div class="col-12 col-md-8">
        <s-card v-if="editing" flat bordered>
          <q-card-section class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <s-input v-model="editing.key" :label="tdc('Form key')" :readonly="!isNew"
                       :hint="tdc('module.name, e.g. hotel.check_in')" data-test="fd-key" />
            </div>
            <div class="col-12 col-sm-6">
              <s-select v-model="editing.level" :options="levelOptions" emit-value map-options
                        :readonly="!isNew" :label="tdc('Layer')" data-test="fd-level" />
            </div>
            <div v-if="editing.level === 'entity_type'" class="col-12">
              <s-select v-model="editing.entity_type" :api="selectUrl('django_resaas/entitytypes')"
                        emit-value map-options :readonly="!isNew" :label="tdc('Entity type')" />
            </div>
            <div v-if="editing.level === 'branch'" class="col-12">
              <s-select v-model="editing.branch" :api="selectUrl('django_resaas/branchs')"
                        emit-value map-options :readonly="!isNew" :label="tdc('Branch')" />
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-tabs v-model="view" dense no-caps align="left" active-color="primary" indicator-color="primary">
              <q-tab name="json" icon="data_object" :label="tdc('Definition')" />
              <q-tab name="preview" icon="visibility" :label="tdc('Preview')" />
              <q-tab name="resolved" icon="layers" :label="tdc('Resolved form')" />
            </q-tabs>
            <q-separator class="q-mb-sm" />

            <div v-show="view === 'json'">
              <q-input v-model="json" type="textarea" outlined autogrow :readonly="readonlyEditor"
                       input-class="fd-json" :error="!!jsonError" :error-message="jsonError" data-test="fd-json" />
            </div>
            <div v-if="view === 'preview'">
              <div v-if="jsonError" class="text-negative">{{ jsonError }}</div>
              <s-dynamic-form v-else-if="parsed" :definition="parsed" :show-submit="false" data-test="fd-preview" />
            </div>
            <div v-if="view === 'resolved'">
              <div class="text-caption text-grey-7 q-mb-sm">
                {{ tdc('The form this key gives in this entity and branch (every published layer).') }}
              </div>
              <s-dynamic-form :form-key="editing.key" :show-submit="false" @loaded="answer => (resolvedLayers = answer.layers)" />
              <div v-if="resolvedLayers.length" class="text-caption q-mt-sm">
                {{ tdc('Layers') }}: {{ resolvedLayers.map(l => `${tdc(levelLabel(l.level))} v${l.version}`).join(' → ') }}
              </div>
            </div>
            <div v-if="saveError" class="text-negative q-mt-sm" data-test="fd-error">{{ saveError }}</div>
          </q-card-section>
          <q-separator />
          <q-card-actions align="right">
            <s-btn v-if="canSave" color="primary" icon="save" no-caps :loading="saving"
                   :label="tdc(isNew ? 'Save' : 'Save as a new version')" :disable="!!jsonError" data-test="fd-save" @click="save">
              <s-tooltip>{{ tdc('A published version never changes: saving makes a new draft version') }}</s-tooltip>
            </s-btn>
            <s-btn v-if="canPublish" color="positive" icon="publish" no-caps :label="tdc('Publish')"
                   :loading="saving" data-test="fd-publish" @click="publish">
              <s-tooltip>{{ tdc('Publish this version: the form starts using it') }}</s-tooltip>
            </s-btn>
          </q-card-actions>
        </s-card>
        <div v-else class="text-grey-6 q-pa-xl text-center">{{ tdc('Choose a form or start a new layer.') }}</div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { HTTPAuth, url } from '../../services/api'
import { tdc } from '../../services/translation'
import { useUserStore } from '../../stores/UserStore'
import { errorMessage } from '../../utils/apiContract'

const User = useUserStore()
const can = perm => User.can(perm)
const BASE = 'django_resaas/formdefinitions/'

const rows = ref([])
const loading = ref(false)
const selected = ref(null)
const editing = ref(null)
const json = ref('')
const view = ref('json')
const saving = ref(false)
const saveError = ref('')
const resolvedLayers = ref([])

const LEVELS = { platform: 'Platform', entity_type: 'Entity type', entity: 'Entity', branch: 'Branch' }
const levelLabel = level => LEVELS[level] || level
const levelOptions = computed(() => Object.entries(LEVELS)
  .filter(([level]) => can('manage_platform_formdefinition') || ['entity', 'branch'].includes(level))
  .map(([value, label]) => ({ value, label: tdc(label) })))
const selectUrl = endpoint => url({ type: 'u', url: endpoint, params: { select: 'true' } })

const isNew = computed(() => !editing.value?.id)
const published = computed(() => editing.value?.status === 'published')
const readonlyEditor = computed(() => !can('add_formdefinition'))
const canSave = computed(() => can('add_formdefinition'))
const canPublish = computed(() => !isNew.value && !published.value && can('publish_formdefinition'))

const parsed = computed(() => {
  try { return JSON.parse(json.value) } catch { return null }
})
const jsonError = computed(() => (json.value && !parsed.value ? tdc('Invalid JSON.') : ''))

async function load () {
  loading.value = true
  try {
    const { data } = await HTTPAuth.get(url({ type: 'u', url: BASE }))
    rows.value = Array.isArray(data) ? data : (data?.results || [])
  } catch {
    rows.value = []
  } finally {
    loading.value = false
  }
}

function select (row) {
  selected.value = row
  editing.value = { ...row }
  json.value = JSON.stringify(row.definition, null, 2)
  saveError.value = ''
  view.value = 'json'
}

function newDefinition () {
  selected.value = null
  editing.value = { key: '', level: 'entity', entity_type: null, branch: null, status: 'draft' }
  json.value = JSON.stringify({
    schema_version: '1.0', key: '', mode: 'declarative', layout: 'sections',
    sections: [{ key: 'main', label: 'Main', fields: [{ name: 'name', type: 'text', label: 'Name', required: true }] }]
  }, null, 2)
  saveError.value = ''
}

// the definition's key follows the form's key
watch(() => editing.value?.key, key => {
  if (!isNew.value || !parsed.value || !key) return
  json.value = JSON.stringify({ ...parsed.value, key }, null, 2)
})

async function save () {
  if (jsonError.value || !parsed.value) return   // invalid JSON is never sent
  saving.value = true
  saveError.value = ''
  try {
    const body = { key: editing.value.key, level: editing.value.level, definition: parsed.value,
      entity_type: editing.value.entity_type || null, branch: editing.value.branch || null }
    const { data } = await HTTPAuth.post(url({ type: 'u', url: BASE }), body)
    await load()
    select(data)
  } catch (error) {
    saveError.value = errorMessage(error) || tdc('Could not save.')
  } finally {
    saving.value = false
  }
}

async function publish () {
  saving.value = true
  saveError.value = ''
  try {
    const { data } = await HTTPAuth.post(url({ type: 'u', url: `${BASE}${editing.value.id}/publish/` }), {})
    await load()
    select(data)
  } catch (error) {
    saveError.value = errorMessage(error) || tdc('Could not publish.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
:deep(.fd-json) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  min-height: 320px;
}
</style>
