<script setup>
import { ref, watch, computed } from 'vue'
import { HTTPAuth, url } from '../../services/api'
import { parseFieldErrors } from '../../boot/alerts'
import FormSection from '../auto/FormSection.vue'


// ---------------- PROPS ----------------
const props = defineProps({
  store: { default: () => [] },
  ignoreFields: {  default: () => [] }
})

const emit = defineEmits(['saved'])

// ---------------- STATE ----------------
const form = ref({})
const saving = ref(false)
const uploadProgress = ref(0)

// Backend validation errors from the last failed save, as
// {field: "message"} - this form does its own direct HTTPAuth calls
// (see save() below) rather than going through BaseStore.create()/
// update(), so it needs its own copy of the same error handling.
const errors = ref({})

const ignoreSet = computed(() => new Set(props.ignoreFields || []))

// 🔥 ocultar campos tipo id
function isHiddenField(f) {
  return ['id'].includes(f.name)
}

// ---------------- FIELD GROUPS ----------------
const generalFields = computed(() =>
  props.store.fields.filter(f =>
    !ignoreSet.value.has(f.name) &&
    !isHiddenField(f) &&
    !f.ui?.isRelation &&
    !f.ui?.isFile &&
    !f.ui?.isImage
  )
)

const relationFields = computed(() =>
  props.store.fields.filter(f =>
    !ignoreSet.value.has(f.name) &&
    !isHiddenField(f) &&
    f.ui?.isRelation
  )
)

const fileFields = computed(() =>
  props.store.fields.filter(f =>
    !ignoreSet.value.has(f.name) &&
    !isHiddenField(f) &&
    (f.ui?.isFile || f.ui?.isImage)
  )
)




// ---------------- WATCH ----------------
watch(() => props.store.form, v => {
  form.value = v ? { ...v } : {}
}, { immediate: true })

// ---------------- RESET ----------------
// Restores the local working copy back to the last loaded row (or an
// empty object for a new/unsaved record) - ActionForm's "Reset" button
// already called this optionally (`props.reform?.resetForm?.()`) from
// both FormTwo.vue and FormModal.vue, but this method didn't exist yet
// so Reset silently did nothing to the field values.
function resetForm() {
  form.value = props.store.row ? { ...props.store.row } : {}
}

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

// ---------------- HELPERS ----------------
function isRealFile(v) {
  return v instanceof File
}

// ---------------- PREVIEW ----------------
function getPreview(f, value) {
  if (!value) return null
  if (!f.ui?.isFile && !f.ui?.isImage) return null

  // New file
  if (value instanceof File) {
    if (value.type.startsWith('image')) {
      return { type: 'image', src: URL.createObjectURL(value) }
    }
    if (value.type === 'application/pdf') {
      return { type: 'pdf', src: URL.createObjectURL(value) }
    }
    return { type: 'file', name: value.name }
  }

  // Objeto backend
  if (typeof value === 'object' && value.url) {

    let safeUrl = value.url.replace('http://', 'https://')

    if (value.mime_type?.startsWith('image')) {
      return { type: 'image', src: safeUrl }
    }

    if (value.mime_type === 'application/pdf') {
      return { type: 'pdf', src: safeUrl }
    }

    return { type: 'file', name: value.name }
  }

  return null
}

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
  return fileFields.value.some(f => form.value[f.name] instanceof File)
}

// ---------------- PAYLOAD ----------------
function buildPayload() {
  const useFormData = hasFiles()

  if (!useFormData) {
    const data = {}

    for (const [k, v] of Object.entries(form.value)) {
      if (v == null) continue

      const isFileField = fileFields.value.some(f => f.name === k)

      if (isFileField && !(v instanceof File)) continue

      data[k] = normalizeValue(v)
    }

    return { data, config: {} }
  }

  const fd = new FormData()

  for (const [k, v] of Object.entries(form.value)) {
    if (v == null) continue

    const isFileField = fileFields.value.some(f => f.name === k)

    if (isFileField) {
      if (!(v instanceof File)) continue
      fd.append(k, v)
      continue
    }

    const val = normalizeValue(v)

    if (Array.isArray(val)) {
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
  errors.value = {}

  try {
    // props.store.safeUrl prefers the schema's own RESAAS.endpoint-
    // resolved endpoint (set once loadSchema() runs) over guessing
    // "app/models/" - a related model registered under a custom
    // endpoint (e.g. NotificationPreference -> notifications/
    // preferences/, see notifications/models/preference.py) would
    // otherwise 404 here, same class of bug already fixed for the
    // schema itself in app_schema.py's build_model().
    const api = `${props.store.safeUrl}/`
    const { data, config } = buildPayload()
    let dados = null

    if (form.value.id) {
      dados = await HTTPAuth.patch(
        url({ type: 'u', url: api + form.value.id + '/' }),
        data,
        config
      )
    } else {
      dados = await HTTPAuth.post(
        url({ type: 'u', url: api }),
        data,
        config
      )

    }

    emit('saved', dados.data )

    return dados.data

  } catch (error) {
    errors.value = parseFieldErrors(error?.response?.data)
    throw error

  } finally {
    saving.value = false
  }
}

// ---------------- EXPOSE ----------------
defineExpose({
  save,
  resetForm,
  form,
  saving
})
</script>

<template>
  <q-card flat>
    <q-card-section class="q-pa-none">
      <!-- GENERAL -->
      <FormSection v-if="generalFields.length" title="General Information">
        <div
          v-for="f in generalFields"
          :key="f.name"
          class="col-12 col-sm-6 col-md-4"
        >
          <component
            :is=" f.component"
            v-model="form[f.name]"
            v-bind="f.props"
            :rules="resolveRules(f.rules)"
            :error="!!errors[f.name]"
            :error-message="errors[f.name] || ''"
          />

        </div>
      </FormSection>

      <!-- RELATION -->
      <FormSection v-if="relationFields.length" title="Relations">
        <div
          v-for="f in relationFields"
          :key="f.name"
          class="col-12 col-sm-6 col-md-4"
        >
          <component
            :is=" f.component"
            v-model="form[f.name]"
            v-bind="f.props"
            :rules="resolveRules(f.rules)"
            :error="!!errors[f.name]"
            :error-message="errors[f.name] || ''"
          />
        </div>
      </FormSection>

      <!-- FILE -->
      <FormSection v-if="fileFields.length" title="Attachments">
        <div v-for="f in fileFields" :key="f.name" class="col-12 col-sm-6 col-md-4">

          <!-- PREVIEW -->
          <template v-if="previewOf(f)">
            <q-img
              v-if="previewOf(f).type === 'image'"
              :src="previewOf(f).src"
              class="form-file-preview-image"
            />

            <iframe
              v-else-if="previewOf(f).type === 'pdf'"
              :src="previewOf(f).src"
              class="form-file-preview-pdf"
            />
          </template>

          <!-- INPUT -->

          <component
            :is=" f.component"
            v-model="form[f.name]"
            v-bind="f.props"
            :rules="resolveRules(f.rules)"
            :error="!!errors[f.name]"
            :error-message="errors[f.name] || ''"
          />

        </div>
      </FormSection>

      <!-- PROGRESS -->
      <q-linear-progress
        v-if="uploadProgress > 0"
        :value="uploadProgress / 100"
      />

    </q-card-section>
  </q-card>
</template>

<style scoped>
.form-file-preview-image {
  max-width: 120px;
  margin-bottom: 8px;
  border-radius: 4px;
}

.form-file-preview-pdf {
  width: 100%;
  height: 200px;
  margin-bottom: 8px;
  border: none;
}
</style>