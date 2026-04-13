<script setup>
import { ref, watch, computed } from 'vue'
import { HTTPAuth, url } from '../../boot/api'
import { componentMap } from '../../boot/component_map'

// props
const props = defineProps({
  schema: Array,
  data: Object,
  module: String,
  model: String,
  ignoreFields: Array
})

const emit = defineEmits(['saved'])

// state
const form = ref({})
const saving = ref(false)
const uploadProgress = ref(0)

const ignoreSet = computed(() => new Set(props.ignoreFields || []))

const generalFields = computed(() =>
  props.schema.filter(f => !ignoreSet.value.has(f.name) && !f.ui?.isRelation && !f.ui?.isFile && !f.ui?.isImage)
)

const relationFields = computed(() =>
  props.schema.filter(f => !ignoreSet.value.has(f.name) && f.ui?.isRelation)
)

const fileFields = computed(() =>
  props.schema.filter(f => !ignoreSet.value.has(f.name) && (f.ui?.isFile || f.ui?.isImage))
)

watch(() => props.data, v => {
  form.value = v ? { ...v } : {}
}, { immediate: true })

function normalizeValue(v) {
  // 🔥 FILE
  if (v instanceof File) return v

  // 🔥 RELAÇÃO {id,label,value}
  if (v && typeof v === 'object') {
    // FK
    if ('id' in v) return v.id

    // CHOICE
    if ('value' in v) return v.value
  }

  // 🔥 ARRAY (M2M)
  if (Array.isArray(v)) {
    return v.map(x => {
      if (x && typeof x === 'object') {
        if ('id' in x) return x.id
        if ('value' in x) return x.value
      }
      return x
    })
  }

  return v
}

function buildPayload() {
  const fd = new FormData()

  for (const [k, v] of Object.entries(form.value)) {
    if (v == null) continue

    const val = normalizeValue(v)

    // FILE
    if (val instanceof File) {
      fd.append(k, val)

    // ARRAY (M2M)
    } else if (Array.isArray(val)) {
      val.forEach(x => fd.append(k, x))

    // PRIMITIVO
    } else {
      fd.append(k, val)
    }
  }

  return fd
}

async function save() {
  saving.value = true
  try {
    const api = `/api/${props.module}/${props.model.toLowerCase()}s/`
    const payload = buildPayload()

    if (form.value.id) {
      await HTTPAuth.patch(url({ type:'u', url: api + form.value.id + '/' }), payload)
    } else {
      await HTTPAuth.post(url({ type:'u', url: api }), payload)
    }

    emit('saved')

  } finally {
    saving.value = false
  }
}



// <FormModal v-model="open" :schema="schema" :module="module" :model="model" />
// <FormPage :schema="schema" :module="module" :model="model" />
</script>

<template>
  <q-card flat bordered>

    <!-- BODY -->
    <q-card-section class="row q-col-gutter-sm">

      <div v-for="f in generalFields" :key="f.name" class="col-6">
        <component :is="componentMap[f.component] || f.component" v-model="form[f.name]" v-bind="f.props" />
      </div>

      <div v-for="f in relationFields" :key="f.name" class="col-6">
        <component :is="componentMap[f.component] || f.component" v-model="form[f.name]" v-bind="f.props"  />
      </div>

      <div v-for="f in fileFields" :key="f.name" class="col-6">
        <component :is="componentMap[f.component] || f.component" v-model="form[f.name]" v-bind="f.props" />
      </div>

      <q-linear-progress v-if="uploadProgress > 0" :value="uploadProgress/100" />

    </q-card-section>

    <!-- ACTIONS -->
    <q-card-actions align="right">
      <s-btn color="primary" :loading="saving" label="Salvar" @click="save" />
    </q-card-actions>

  </q-card>
</template>



