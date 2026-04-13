<script setup>
import { ref, watch, computed } from 'vue'
import { HTTPAuth, url } from '../../boot/api'
import { componentMap } from '../../boot/component_map'

// ---------------- PROPS ----------------
const props = defineProps({
  schema: { type: Array, default: () => [] },
  data: { type: Object, default: null },
  module: { type: String, required: true },
  model: { type: String, required: true },
  ignoreFields: { type: Array, default: () => [] }
})

const emit = defineEmits(['saved'])

// ---------------- STATE ----------------
const form = ref({})
const saving = ref(false)
const uploadProgress = ref(0)

const ignoreSet = computed(() => new Set(props.ignoreFields || []))

// ---------------- FIELD GROUPS ----------------
const generalFields = computed(() =>
  props.schema.filter(f =>
    !ignoreSet.value.has(f.name) &&
    !f.ui?.isRelation &&
    !f.ui?.isFile &&
    !f.ui?.isImage
  )
)

const relationFields = computed(() =>
  props.schema.filter(f =>
    !ignoreSet.value.has(f.name) &&
    f.ui?.isRelation
  )
)

const fileFields = computed(() =>
  props.schema.filter(f =>
    !ignoreSet.value.has(f.name) &&
    (f.ui?.isFile || f.ui?.isImage)
  )
)

// ---------------- WATCH DATA ----------------
watch(() => props.data, v => {
  form.value = v ? { ...v } : {}
}, { immediate: true })

// ---------------- NORMALIZE ----------------
function normalizeValue(v) {
  // FILE
  if (v instanceof File) return v

  // ARRAY (M2M)
  if (Array.isArray(v)) {
    return v.map(x => {
      if (x && typeof x === 'object') {
        if ('value' in x) return x.value
        if ('id' in x) return x.id
      }
      return x
    })
  }

  // RELAÇÃO / CHOICE
  if (v && typeof v === 'object') {
    if ('value' in v) return v.value
    if ('id' in v) return v.id
  }

  return v
}

// ---------------- DETECT FILE ----------------
function hasFiles() {
  return Object.values(form.value).some(v => v instanceof File)
}

// ---------------- BUILD PAYLOAD ----------------
function buildPayload() {
  const useFormData = hasFiles()

  // JSON
  if (!useFormData) {
    const data = {}

    for (const [k, v] of Object.entries(form.value)) {
      if (v == null) continue
      data[k] = normalizeValue(v)
    }

    return { data, config: {} }
  }

  // FORM DATA
  const fd = new FormData()

  for (const [k, v] of Object.entries(form.value)) {
    if (v == null) continue

    const val = normalizeValue(v)

    if (val instanceof File) {
      fd.append(k, val)

    } else if (Array.isArray(val)) {
      val.forEach(x => fd.append(k, x))

    } else {
      fd.append(k, val)
    }
  }

  return {
    data: fd,
    config: {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) {
          uploadProgress.value = Math.round((e.loaded * 100) / e.total)
        }
      }
    }
  }
}

// ---------------- SAVE (EXPOSTO) ----------------
async function save() {
  saving.value = true
  uploadProgress.value = 0

  try {
    const api = `/api/${props.module}/${props.model.toLowerCase()}s/`
    const { data, config } = buildPayload()

    if (form.value.id) {
      await HTTPAuth.patch(
        url({ type: 'u', url: api + form.value.id + '/' }),
        data,
        config
      )
    } else {
      await HTTPAuth.post(
        url({ type: 'u', url: api }),
        data,
        config
      )
    }

    emit('saved')

  } finally {
    saving.value = false
  }
}

// 🔥 EXPOR PARA O PAI CONTROLAR
defineExpose({
  save,
  form,
  saving
})
</script>

<template>
  <q-card flat bordered>

    <!-- BODY -->
    <q-card-section class="row q-col-gutter-sm">

      <!-- NORMAL -->
      <div v-for="f in generalFields" :key="f.name" class="col-6">
        <component
          :is="componentMap[f.component] || f.component"
          v-model="form[f.name]"
          v-bind="f.props"
        />
      </div>

      <!-- RELAÇÕES -->
      <div v-for="f in relationFields" :key="f.name" class="col-6">
        <component
          :is="componentMap[f.component] || f.component"
          v-model="form[f.name]"
          v-bind="f.props"
        />
      </div>

      <!-- FILE -->
      <div v-for="f in fileFields" :key="f.name" class="col-6">
        <component
          :is="componentMap[f.component] || f.component"
          v-model="form[f.name]"
          v-bind="f.props"
        />
      </div>

      <!-- PROGRESS -->
      <q-linear-progress
        v-if="uploadProgress > 0"
        :value="uploadProgress / 100"
      />

    </q-card-section>

  </q-card>
</template>