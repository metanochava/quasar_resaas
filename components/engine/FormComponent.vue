<script setup>
import { ref, watch, computed } from 'vue'
import { HTTPAuth, url } from '../../services/api'
import { parseFieldErrors } from '../../boot/alerts'
import { resolveRules } from '../../utils/schema'
import { toWriteValue } from '../../utils/payload'
import FormSection from '../auto/FormSection.vue'


// ---------------- PROPS ----------------
const props = defineProps({
  store: { default: () => [] },
  ignoreFields: {  default: () => [] },

  // Forces every field readonly regardless of the schema's own
  // read_only value - a "view" dialog reuses the exact same generic
  // form (labels, components, relations, files) as create/edit, it
  // just can't submit anything. Real enforcement stays the backend's
  // (this is display-only, same as the schema-driven read_only already
  // is - see app_schema.py), and the caller is expected to also drop
  // 'save'/'edit' from ActionForm's buttons so there's nothing to
  // submit in the first place.
  readonly: { type: Boolean, default: false }
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

// props.readonly forces EVERY field readonly (view mode) - merged on
// top of, never instead of, the field's own schema-driven props (which
// may already carry other config like accept/options/rules).
function fieldProps(f) {
  return props.readonly ? { ...f.props, readonly: true } : f.props
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



// ---------------- NORMALIZE ----------------
// READ shape ({id, value, label}) -> the value the API accepts: the shared implementation.
const normalizeValue = toWriteValue

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
            v-bind="fieldProps(f)"
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
            v-bind="fieldProps(f)"
            :rules="resolveRules(f.rules)"
            :error="!!errors[f.name]"
            :error-message="errors[f.name] || ''"
          />
        </div>
      </FormSection>

      <!-- FILE -->
      <FormSection v-if="fileFields.length" title="Attachments">
        <div v-for="f in fileFields" :key="f.name" class="col-12 col-sm-6 col-md-4">

          <!-- s-file (UploadComponent.vue) previews its own
               value now (image thumbnail/pdf+file icon), so this no
               longer needs its own separate preview block above it. -->
          <component
            :is=" f.component"
            v-model="form[f.name]"
            v-bind="fieldProps(f)"
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

