<script setup>
import { ref, computed, watch } from 'vue'
import { tdc } from '../../services/translation'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  fields: { type: Array, default: () => [] },
  ignoreFields: { type: Array, default: () => [] },
  schema: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue', 'apply'])
const localModel = ref(props.modelValue)
const filters = ref({})

watch(() => props.modelValue, v => localModel.value = v)
watch(localModel, v => emit('update:modelValue', v))

const ignoreSet = computed(() => new Set(props.ignoreFields))

const schemaFilterFields = computed(() => {
  const fields = props.schema?.filters?.fields
  return Array.isArray(fields) && fields.length ? new Set(fields) : null
})

const filterEnabled = computed(() =>
  props.schema?.filters?.enabled ?? true
)

const availableFields = computed(() =>
  props.fields.filter(f => {
    if (!filterEnabled.value) return false
    if (ignoreSet.value.has(f.name)) return false
    if (schemaFilterFields.value && !schemaFilterFields.value.has(f.name)) return false
    if (f.ui?.isFile || f.ui?.isImage) return false
    return true
  })
)

const basicFields = computed(() =>
  availableFields.value
    .filter(f =>
      f.ui?.isRelation ||
      f.ui?.isChar ||
      f.ui?.isNumeric
    )
    .slice(0, 10)
)

const advancedFields = computed(() =>
  availableFields.value.filter(
    f => !basicFields.value.some(b => b.name === f.name)
  )
)

const activeCount = computed(() =>
  Object.values(filters.value).filter(
    v => v !== null && v !== undefined && v !== ''
  ).length
)

function close() {
  localModel.value = false
}

function clear() {
  filters.value = {}
}

function normalizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(item =>
      typeof item === 'object' && item !== null
        ? item.id ?? item.value ?? item
        : item
    )
  }

  if (typeof value === 'object' && value !== null) {
    return value.id ?? value.value ?? value
  }

  return value
}

function apply() {
  const payload = Object.fromEntries(
    Object.entries(filters.value)
      .filter(([, v]) =>
        v !== null &&
        v !== undefined &&
        v !== ''
      )
      .map(([key, value]) => [
        key,
        normalizeValue(value)
      ])
  )

  emit('apply', {
    ...payload,
    __resetPage: true
  })

  close()
}
</script>

<template>
  <q-dialog v-model="localModel" persistent>
    <s-card style="min-width:720px;max-width:92vw">
      <q-bar :class="['row items-center justify-between',$q.dark.isActive?'bg-dark text-white':'bg-primary text-white']">
        <div class="text-h6">{{ tdc('Filters') }}<span v-if="activeCount"> ({{ activeCount }})</span></div>
        <s-btn dense flat icon="close" @click="close">
          <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white text-14' : 'bg-primary text-white text-14'">{{ tdc('Close') }}</q-tooltip>
        </s-btn>
      </q-bar>

      <q-separator />

      <q-card-section v-if="!fields.length" class="flex flex-center">
        <q-spinner />
      </q-card-section>

      <q-card-section v-else-if="!filterEnabled" class="text-center text-grey">
        {{ tdc('Filters disabled') }}
      </q-card-section>

      <q-card-section v-else class="row q-col-gutter-sm">
        <div v-for="f in basicFields" :key="f.name" class="col-12 col-sm-6 col-md-4">
          <component
            :is="f.component || 's-input'"
            v-model="filters[f.name]"
            v-bind="f.props"
            :label="f.label"
            dense
            outlined
          />
        </div>

        <div v-for="f in advancedFields" :key="f.name" class="col-12 col-sm-6 col-md-4">
          <component
            :is="f.component || 's-input'"
            v-model="filters[f.name]"
            v-bind="f.props"
            :label="f.label"
            dense
            outlined
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <s-btn flat :label="tdc('Clear')" @click="clear" />
        <s-btn flat :label="tdc('Cancel')" @click="close" />
        <s-btn color="primary" :label="tdc('Apply')" :disable="!filterEnabled" @click="apply" />
      </q-card-actions>
    </s-card>
  </q-dialog>
</template>