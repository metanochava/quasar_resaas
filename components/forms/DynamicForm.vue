<template>
  <!-- <s-dynamic-form>: a form from a definition (saas/core/forms). Four modes:
       schema (a model's Schema 1.0 fields), declarative (a JSON definition),
       hybrid (a definition whose `from_schema` fields take the model's
       metadata, plus slots) and workflow (it submits to its own endpoint, not
       a CRUD). The backend resolves the layers (platform -> entity type ->
       entity -> branch) and validates again: what is hidden or readonly here
       is never security. -->
  <div class="s-dynamic-form" data-test="dynamic-form">
    <div v-if="loading" class="flex flex-center q-pa-lg">
      <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="40px" />
    </div>
    <div v-else-if="loadError" class="text-negative q-pa-md" data-test="df-load-error">{{ tdc(loadError) }}</div>

    <q-form v-else-if="form" @submit.prevent="submit">
      <div v-if="form.title" class="text-h6 q-mb-md">{{ tdc(form.title) }}</div>
      <slot name="before" :data="data" />

      <!-- TABS -->
      <template v-if="layout === 'tabs'">
        <q-tabs v-model="activeTab" dense no-caps align="left" active-color="primary" indicator-color="primary">
          <q-tab v-for="section in visibleSections" :key="section.key" :name="section.key"
                 :label="tdc(section.label || section.key)" :icon="section.icon"
                 :class="{ 'text-negative': sectionHasErrors(section) }" />
        </q-tabs>
        <q-separator class="q-mb-md" />
        <template v-for="section in visibleSections" :key="section.key">
          <div v-show="activeTab === section.key">
            <slot :name="`section-${section.key}`" :section="section" :data="data">
              <div class="row q-col-gutter-md">
                <DynamicField v-for="field in section.fields" :key="field.name" :field="field"
                              :model-value="data[field.name]" :scope="data" :errors="errors" :readonly="readonly"
                              @update:model-value="value => setValue(field.name, value)" />
              </div>
            </slot>
          </div>
        </template>
      </template>

      <!-- WIZARD -->
      <q-stepper v-else-if="layout === 'wizard'" v-model="step" flat animated header-nav data-test="df-wizard">
        <q-step v-for="(section, index) in visibleSections" :key="section.key" :name="index"
                :title="tdc(section.label || section.key)" :icon="section.icon || 'edit'"
                :done="index < step" :error="sectionHasErrors(section)">
          <slot :name="`section-${section.key}`" :section="section" :data="data">
            <div class="row q-col-gutter-md">
              <DynamicField v-for="field in section.fields" :key="field.name" :field="field"
                            :model-value="data[field.name]" :scope="data" :errors="errors" :readonly="readonly"
                            @update:model-value="value => setValue(field.name, value)" />
            </div>
          </slot>
          <q-stepper-navigation class="row q-gutter-sm">
            <s-btn v-if="index > 0" flat :label="tdc('Back')" data-test="df-back" @click="step -= 1">
              <s-tooltip>{{ tdc('Previous step') }}</s-tooltip>
            </s-btn>
            <s-btn v-if="index < visibleSections.length - 1" color="primary" :label="tdc('Next')"
                   data-test="df-next" @click="next(section)">
              <s-tooltip>{{ tdc('Next step') }}</s-tooltip>
            </s-btn>
          </q-stepper-navigation>
        </q-step>
      </q-stepper>

      <!-- SECTIONS (cards / accordions / plain) and GRID -->
      <template v-else>
        <template v-for="section in visibleSections" :key="section.key">
          <q-expansion-item v-if="section.layout === 'accordion'" :label="tdc(section.label || section.key)"
                            :icon="section.icon" default-opened header-class="text-weight-medium" class="q-mb-md">
            <div class="row q-col-gutter-md q-pa-sm">
              <DynamicField v-for="field in section.fields" :key="field.name" :field="field"
                            :model-value="data[field.name]" :scope="data" :errors="errors" :readonly="readonly"
                            @update:model-value="value => setValue(field.name, value)" />
            </div>
          </q-expansion-item>
          <component :is="section.layout === 'plain' || layout === 'grid' ? 'div' : 's-card'" v-else
                     :flat="true" :bordered="true" class="q-mb-md" :data-test="`df-section-${section.key}`">
            <div v-if="section.label && layout !== 'grid'" class="text-subtitle1 text-weight-medium q-pa-sm">
              {{ tdc(section.label) }}
            </div>
            <slot :name="`section-${section.key}`" :section="section" :data="data">
              <div class="row q-col-gutter-md" :class="{ 'q-pa-sm': layout !== 'grid' }">
                <DynamicField v-for="field in section.fields" :key="field.name" :field="field"
                              :model-value="data[field.name]" :scope="data" :errors="errors" :readonly="readonly"
                              @update:model-value="value => setValue(field.name, value)" />
              </div>
            </slot>
          </component>
        </template>
      </template>

      <slot name="after" :data="data" />
      <div v-if="formError" class="text-negative q-mb-sm" data-test="df-form-error">{{ formError }}</div>

      <div v-if="!readonly && showSubmit" class="row justify-end q-gutter-sm">
        <slot name="actions" :data="data" :submit="submit">
          <s-btn type="submit" color="primary" icon="send" :label="tdc(submitLabel)" :loading="submitting"
                 :disable="layout === 'wizard' && step < visibleSections.length - 1" data-test="df-submit">
            <s-tooltip>{{ tdc(submitLabel) }}</s-tooltip>
          </s-btn>
        </slot>
      </div>
    </q-form>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { tdc } from '../../services/translation'
import { HTTPAuth, url } from '../../services/api'
import { evaluateCondition } from '../../utils/formConditions'
import { applySchema, definitionFromSchema, fillEndpoint, validateData } from '../../utils/formDefinition'
import DynamicField from './DynamicField.vue'

const props = defineProps({
  // a definition object (declarative / workflow / hybrid) ...
  definition: { type: Object, default: null },
  // ... or its key: the resolved definition is asked to the backend
  formKey: { type: String, default: '' },
  // Schema 1.0 fields of the model (a store's `fields`) for schema / hybrid
  schemaFields: { type: Array, default: () => [] },
  modelValue: { type: Object, default: () => ({}) },
  // a workflow endpoint's {placeholders}, e.g. { id: stay.id }
  params: { type: Object, default: () => ({}) },
  // autosave context (the record being edited) when the definition autosaves
  draftContext: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  showSubmit: { type: Boolean, default: true },
  submitLabel: { type: String, default: 'Submit' }
})

const emit = defineEmits(['update:modelValue', 'submit', 'submitted', 'error', 'loaded'])

const resolved = ref(null)
const loading = ref(false)
const loadError = ref('')
const data = ref({})
const errors = ref({})
const formError = ref('')
const submitting = ref(false)
const step = ref(0)
const activeTab = ref(null)

const form = computed(() => {
  const base = props.definition || resolved.value
  if (!base) {
    return props.schemaFields.length ? definitionFromSchema(props.formKey || 'local.form', props.schemaFields) : null
  }
  if (base.mode === 'schema' && props.schemaFields.length) {
    return { ...definitionFromSchema(base.key, props.schemaFields), ...base, sections: definitionFromSchema(base.key, props.schemaFields).sections }
  }
  return base.mode === 'hybrid' ? applySchema(base, props.schemaFields) : base
})

const layout = computed(() => form.value?.layout || 'sections')
const visibleSections = computed(() => (form.value?.sections || []).filter(s => evaluateCondition(s.visible_if, data.value)))

function defaults (fields) {
  const out = {}
  for (const field of fields || []) {
    if (field.default !== undefined) out[field.name] = JSON.parse(JSON.stringify(field.default))
    else if (field.type === 'repeater') out[field.name] = []
  }
  return out
}

function initData () {
  const all = (form.value?.sections || []).flatMap(s => s.fields || [])
  data.value = { ...defaults(all), ...(props.modelValue || {}) }
  activeTab.value = visibleSections.value[0]?.key || null
}

async function load () {
  if (props.definition || !props.formKey) {
    initData()
    await loadDraft()
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    const { data: answer } = await HTTPAuth.get(url({ type: 'u', url: 'django_resaas/forms/resolve/', params: { key: props.formKey } }))
    resolved.value = answer.definition
    emit('loaded', answer)
    initData()
    await loadDraft()
  } catch {
    loadError.value = 'Could not load the form.'
  } finally {
    loading.value = false
  }
}


function setValue (name, value) {
  data.value = { ...data.value, [name]: value }
  if (errors.value[name]) {
    const rest = { ...errors.value }
    delete rest[name]
    errors.value = rest
  }
  emit('update:modelValue', data.value)
  scheduleDraft()
}

function sectionHasErrors (section) {
  const names = (section.fields || []).map(f => f.name)
  return Object.keys(errors.value).some(path => names.includes(path.split('.')[0]))
}

function next (section) {
  const found = validateData({ sections: [section] }, data.value)
  errors.value = { ...errors.value, ...found }
  if (!Object.keys(found).length) step.value += 1
}

// ---------------------------------------------------------------- drafts
const draftKey = computed(() => (form.value?.autosave && (props.formKey || form.value?.key)) || '')
let draftTimer = null

async function loadDraft () {
  if (!draftKey.value) return
  try {
    const { data: answer } = await HTTPAuth.get(url({ type: 'u', url: 'django_resaas/forms/draft/', params: { key: draftKey.value, context: props.draftContext } }))
    if (answer?.data) data.value = { ...data.value, ...answer.data }
  } catch { /* no draft: start empty */ }
}

function scheduleDraft () {
  if (!draftKey.value) return
  clearTimeout(draftTimer)
  draftTimer = setTimeout(() => {
    HTTPAuth.put(url({ type: 'u', url: 'django_resaas/forms/draft/' }), { key: draftKey.value, context: props.draftContext, data: data.value })
      .catch(() => {})
  }, 1200)
}

function dropDraft () {
  if (!draftKey.value) return
  clearTimeout(draftTimer)
  HTTPAuth.delete(url({ type: 'u', url: 'django_resaas/forms/draft/', params: { key: draftKey.value, context: props.draftContext } })).catch(() => {})
}

onBeforeUnmount(() => clearTimeout(draftTimer))

// ---------------------------------------------------------------- submit
function serverErrors (error) {
  const details = error?.response?.data?.error?.details
  return details && typeof details === 'object' ? Object.fromEntries(Object.entries(details).map(([k, v]) => [k, [].concat(v)])) : {}
}

async function submit () {
  formError.value = ''
  errors.value = validateData(form.value, data.value)
  if (Object.keys(errors.value).length) {
    emit('error', errors.value)
    return
  }
  const submitTo = form.value?.mode === 'workflow' ? form.value.submit : null
  if (!submitTo) {
    emit('submit', data.value)
    dropDraft()
    return
  }
  submitting.value = true
  try {
    const endpoint = fillEndpoint(submitTo.endpoint, props.params)
    const response = await HTTPAuth[submitTo.method || 'post'](url({ type: 'u', url: endpoint }), data.value)
    dropDraft()
    emit('submitted', response.data)
  } catch (error) {
    errors.value = serverErrors(error)
    formError.value = error?.response?.data?.error?.message || error?.message || tdc('Could not submit the form.')
    emit('error', errors.value)
  } finally {
    submitting.value = false
  }
}

// last: load() uses the draft helpers above
watch(() => [props.definition, props.formKey], load, { immediate: true })
watch(() => props.modelValue, value => {
  if (value && JSON.stringify(value) !== JSON.stringify(data.value)) data.value = { ...data.value, ...value }
})

defineExpose({ submit, validate: () => (errors.value = validateData(form.value, data.value)), data, errors })
</script>
