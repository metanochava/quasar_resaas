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

// ---------------- WATCH ----------------
watch(() => props.data, v => {
  form.value = v ? { ...v } : {}
}, { immediate: true })

// ---------------- RULES ----------------
function resolveRules(rules = []) {
  return rules.map(r => {
    switch (r.type) {
      case 'required':
        return val => !!val || r.message
      case 'min_length':
        return val => !val || val.length >= r.value || r.message
      case 'max_length':
        return val => !val || val.length <= r.value || r.message
      case 'min':
        return val => val == null || val >= r.value || r.message
      case 'max':
        return val => val == null || val <= r.value || r.message
      case 'email':
        return val =>
          !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || r.message
      default:
        return () => true
    }
  })
}

// ---------------- PREVIEW ENGINE ----------------
function getPreview(f, value) {
  if (!value) return null

  let src = value
  let name = ''

  if (value instanceof File) {
    src = URL.createObjectURL(value)
    name = value.name
  } else if (typeof value === 'string') {
    src = value
    name = value
  }

  const lower = name.toLowerCase()

  if (f.ui?.isImage || /\.(png|jpg|jpeg|gif|svg|webp)$/.test(lower)) {
    return { type: 'image', src }
  }

  if (/\.pdf$/.test(lower)) {
    return { type: 'pdf', src }
  }

  if (/\.(mp4|webm|ogg)$/.test(lower)) {
    return { type: 'video', src }
  }

  if (/\.(mp3|wav|ogg)$/.test(lower)) {
    return { type: 'audio', src }
  }

  if (/\.json$/.test(lower)) {
    return { type: 'json', src }
  }

  if (/\.(txt|log|md)$/.test(lower)) {
    return { type: 'text', src }
  }

  if (f.ui?.isRichText) {
    return { type: 'html', content: value }
  }

  return { type: 'file', name }
}

// 🔥 helper correto (resolve erro do "as p")
function previewOf(f) {
  return getPreview(f, form.value[f.name])
}

// ---------------- NORMALIZE ----------------
function normalizeValue(v) {
  if (v instanceof File) return v

  if (Array.isArray(v)) {
    return v.map(x => {
      if (x && typeof x === 'object') {
        if ('value' in x) return x.value
        if ('id' in x) return x.id
      }
      return x
    })
  }

  if (v && typeof v === 'object') {
    if ('value' in v) return v.value
    if ('id' in v) return v.id
  }

  return v
}

// ---------------- FILE DETECT ----------------
function hasFiles() {
  return Object.values(form.value).some(v => v instanceof File)
}

// ---------------- PAYLOAD ----------------
function buildPayload() {
  const useFormData = hasFiles()

  if (!useFormData) {
    const data = {}
    for (const [k, v] of Object.entries(form.value)) {
      if (v == null) continue
      data[k] = normalizeValue(v)
    }
    return { data, config: {} }
  }

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

// ---------------- SAVE ----------------
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

// ---------------- EXPOSE ----------------
defineExpose({
  save,
  form,
  saving
})
</script>

<template>
  <q-card flat bordered>
    <q-card-section class="row q-col-gutter-sm">

      <!-- NORMAL + RELATION -->
      <div
        v-for="f in [...generalFields, ...relationFields]"
        :key="f.name"
        class="col-6"
      >

        <!-- PREVIEW -->
        <template v-if="previewOf(f)">
          <q-img
            v-if="previewOf(f).type === 'image'"
            :src="previewOf(f).src"
            style="max-width:120px; margin-bottom:8px"
          />

          <iframe
            v-else-if="previewOf(f).type === 'pdf'"
            :src="previewOf(f).src"
            style="width:100%; height:200px"
          />

          <video
            v-else-if="previewOf(f).type === 'video'"
            :src="previewOf(f).src"
            controls
          />

          <audio
            v-else-if="previewOf(f).type === 'audio'"
            :src="previewOf(f).src"
            controls
          />

          <div
            v-else-if="previewOf(f).type === 'html'"
            v-html="previewOf(f).content"
          />

          <pre v-else-if="previewOf(f).type === 'json'">
            {{ previewOf(f).src }}
          </pre>

          <pre v-else-if="previewOf(f).type === 'text'">
            {{ previewOf(f).src }}
          </pre>

          <div v-else>
            📁 {{ previewOf(f).name }}
          </div>
        </template>

        <!-- INPUT -->
        <component
          :is="componentMap[f.component] || f.component || 'q-input'"
          v-model="form[f.name]"
          v-bind="f.props"
          :rules="resolveRules(f.rules)"
        />

      </div>

      <!-- FILE -->
      <div v-for="f in fileFields" :key="f.name" class="col-6">

        <template v-if="previewOf(f)">
          <q-img v-if="previewOf(f).type === 'image'" :src="previewOf(f).src" style="max-width:120px" />
          <iframe v-else-if="previewOf(f).type === 'pdf'" :src="previewOf(f).src" style="width:100%; height:200px" />
          <div v-else>📁 {{ previewOf(f).name }}</div>
        </template>

        <component
          :is="componentMap[f.component] || f.component || 'q-input'"
          v-model="form[f.name]"
          v-bind="f.props"
          :rules="resolveRules(f.rules)"
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