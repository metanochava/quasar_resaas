<template>
  <!-- one field of a form definition: its registered / built-in component,
       or a repeater / an object of its own fields (recursive) -->
  <div v-if="visible" :class="colClass" :data-test="`df-field-${field.name}`">
    <!-- REPEATER: a list of objects with the same fields -->
    <div v-if="field.type === 'repeater'" class="df-repeater">
      <div class="row items-center q-mb-xs">
        <div class="text-subtitle2">{{ tdc(field.label || field.name) }}<span v-if="required"> *</span></div>
        <q-space />
        <s-btn
          flat dense round icon="add" color="primary"
          :disable="locked || (field.max_items != null && items.length >= field.max_items)"
          :data-test="`df-add-${field.name}`"
          @click="addItem"
        >
          <s-tooltip>{{ tdc('Add an item') }}</s-tooltip>
        </s-btn>
      </div>
      <div v-if="!items.length" class="text-caption text-grey-6 q-mb-sm">{{ tdc('No items.') }}</div>
      <s-card v-for="(item, index) in items" :key="index" flat bordered class="q-mb-sm">
        <q-card-section class="row q-col-gutter-sm items-start">
          <DynamicField
            v-for="child in field.fields"
            :key="child.name"
            :field="child"
            :model-value="item[child.name]"
            :scope="{ ...scope, ...item }"
            :errors="errors"
            :path="`${path}.${index}.`"
            :readonly="locked"
            @update:model-value="value => setItem(index, child.name, value)"
          />
          <div class="col-auto">
            <s-btn flat dense round icon="delete_outline" color="negative" :disable="locked"
                   :data-test="`df-remove-${field.name}-${index}`" @click="removeItem(index)">
              <s-tooltip>{{ tdc('Remove this item') }}</s-tooltip>
            </s-btn>
          </div>
        </q-card-section>
      </s-card>
      <div v-if="ownError" class="text-negative text-caption">{{ tdc(ownError) }}</div>
    </div>

    <!-- OBJECT: nested fields kept under this field's name -->
    <div v-else-if="field.type === 'object'" class="df-object">
      <div class="text-subtitle2 q-mb-xs">{{ tdc(field.label || field.name) }}</div>
      <div class="row q-col-gutter-sm">
        <DynamicField
          v-for="child in field.fields"
          :key="child.name"
          :field="child"
          :model-value="(modelValue || {})[child.name]"
          :scope="{ ...scope, ...(modelValue || {}) }"
          :errors="errors"
          :path="`${path}.`"
          :readonly="locked"
          @update:model-value="value => emit('update:modelValue', { ...(modelValue || {}), [child.name]: value })"
        />
      </div>
    </div>

    <!-- A FIELD -->
    <component
      :is="resolved.component"
      v-else-if="resolved"
      v-bind="componentProps"
      :model-value="field.calculate ? calculated : modelValue"
      @update:model-value="value => emit('update:modelValue', value)"
    />
    <div v-else class="text-caption text-negative" data-test="df-unknown-component">
      {{ tdc('Unknown field component') }}: {{ field.component || field.type }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'
import { url } from '../../services/api'
import { resolveFormComponent } from './registry'
import { calculate, isDisabled, isReadonly, isRequired, isVisible } from '../../utils/formDefinition'

defineOptions({ name: 'DynamicField' })

const props = defineProps({
  field: { type: Object, required: true },
  modelValue: { type: null, default: null },
  // the data the conditions read (the whole form, or the item of a repeater)
  scope: { type: Object, default: () => ({}) },
  errors: { type: Object, default: () => ({}) },
  path: { type: String, default: '' },
  readonly: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed(() => isVisible(props.field, props.scope))
const required = computed(() => isRequired(props.field, props.scope))
const locked = computed(() => props.readonly || isReadonly(props.field, props.scope) || !!props.field.calculate)
const fullPath = computed(() => `${props.path}${props.field.name}`)
const ownError = computed(() => (props.errors[fullPath.value] || [])[0] || '')
const calculated = computed(() => (props.field.calculate ? calculate(props.field, props.scope) : null))
const colClass = computed(() => (props.field.cols ? `col-12 col-md-${props.field.cols}` : 'col-12'))
const resolved = computed(() => resolveFormComponent(props.field))

const componentProps = computed(() => {
  const field = props.field
  const extra = { ...(resolved.value?.props || {}) }
  if (field.type === 'relation' && field.relation?.endpoint) {
    extra.api = url({ type: 'u', url: field.relation.endpoint, params: { select: 'true' } })
  }
  if (field.options) extra.options = field.options.map(o => ({ ...o, label: tdc(o.label ?? String(o.value)) }))
  if (field.accept) extra.accept = field.accept
  return {
    ...extra,
    field,
    label: `${tdc(field.label || field.name)}${required.value ? ' *' : ''}`,
    hint: field.help ? tdc(field.help) : undefined,
    placeholder: field.placeholder ? tdc(field.placeholder) : undefined,
    readonly: locked.value,
    disable: isDisabled(field, props.scope),
    error: !!ownError.value,
    errorMessage: ownError.value ? tdc(ownError.value) : undefined,
    'data-test': `df-input-${field.name}`
  }
})

const items = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []))

function addItem () {
  const blank = Object.fromEntries((props.field.fields || []).map(f => [f.name, f.default ?? null]))
  emit('update:modelValue', [...items.value, blank])
}

function removeItem (index) {
  emit('update:modelValue', items.value.filter((_, i) => i !== index))
}

function setItem (index, name, value) {
  emit('update:modelValue', items.value.map((item, i) => (i === index ? { ...item, [name]: value } : item)))
}
</script>
