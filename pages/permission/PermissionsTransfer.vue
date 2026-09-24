<template>
  <div class="row items-center q-gutter-sm q-pa-sm" data-test="permissions-transfer">
    <s-btn
      v-if="User.can(viewPermission)"
      flat dense icon="picture_as_pdf" color="primary"
      :label="tdc('Download PDF')" :loading="busy === 'pdf'"
      data-test="permissions-transfer-pdf"
      @click="download(pdfAction, 'pdf')"
    />
    <s-btn
      v-if="User.can(viewPermission)"
      flat dense :icon="FORMATS[format].icon" color="primary"
      :label="tdc(`Download ${FORMATS[format].label}`)" :loading="busy === format"
      data-test="permissions-transfer-data"
      @click="download(dataAction, format)"
    />
    <s-btn
      v-if="User.can(changePermission)"
      flat dense icon="upload_file" color="primary"
      :label="tdc(`Import ${FORMATS[format].label}`)"
      data-test="permissions-transfer-import"
      @click="openImport"
    />
  </div>

  <q-dialog v-model="importOpen" persistent>
    <s-modal-card :title="tdc(importTitle)" icon="upload_file" width="560px" form
                  @close="importOpen = false" @submit="submit">
      <p class="text-body2">{{ tdc(importHint) }}</p>

      <s-file v-model="file" :accept="FORMATS[format].accept"
              :label="tdc(`${FORMATS[format].label} file`)" data-test="permissions-transfer-file" />

      <q-option-group
        v-model="mode"
        class="q-mt-md"
        :options="[
          { value: 'add', label: tdc('Add to the current permissions') },
          { value: 'replace', label: tdc('Replace the permissions with the file') }
        ]"
      />

      <div v-if="rowErrors.length" class="q-mt-md text-negative" data-test="permissions-transfer-errors">
        <div class="text-weight-medium">{{ tdc('Nothing was changed. Errors:') }}</div>
        <div v-for="e in rowErrors" :key="e.where">{{ e.where }}: {{ e.message }}</div>
      </div>

      <template #footer>
        <s-btn flat :label="tdc('Cancel')" @click="importOpen = false" />
        <s-btn color="primary" icon="upload" type="submit" :label="tdc('Import')"
               :disable="!file" :loading="busy === 'import'" data-test="permissions-transfer-submit" />
      </template>
    </s-modal-card>
  </q-dialog>
</template>

<script setup>
// Export / import of permissions for any resource that exposes the three
// actions (PDF, data file, import): a group (CSV, auth/groups/{id}) or an
// entity type's profiles (JSON, django_resaas/entitytypes/{id}). Buttons
// follow the user's permissions (UX only); the backend enforces them, the
// scope and the "no grant of what you don't hold" rule. Errors go through the
// normal alert funnel; row / profile errors are listed in the dialog.
import { ref } from 'vue'
import { HTTPAuth, HTTPAuthBlob, url } from '../../services/api.js'
import { tdc } from '../../services/translation.js'
import { useUserStore } from '../../stores/UserStore.js'
import { AlertSuccess } from '../../boot/alerts.js'

const FORMATS = {
  csv: { label: 'CSV', icon: 'table_view', accept: '.csv,text/csv' },
  json: { label: 'JSON', icon: 'data_object', accept: '.json,application/json' }
}

const props = defineProps({
  // resource path, e.g. `auth/groups/${id}` (no trailing slash)
  basePath: { type: String, required: true },
  fileName: { type: String, default: 'permissions' },
  format: { type: String, default: 'csv', validator: (v) => ['csv', 'json'].includes(v) },
  pdfAction: { type: String, required: true },
  dataAction: { type: String, required: true },
  importAction: { type: String, required: true },
  viewPermission: { type: String, required: true },
  changePermission: { type: String, required: true },
  importTitle: { type: String, default: 'Import permissions' },
  importHint: { type: String, default: '' }
})
const emit = defineEmits(['imported'])

const User = useUserStore()
const busy = ref(null)
const importOpen = ref(false)
const file = ref(null)
const mode = ref('add')
const rowErrors = ref([])

function endpoint (action) {
  return url({ type: 'u', url: `${props.basePath}/${action}/` })
}

function safeName () {
  return String(props.fileName || 'permissions').replace(/[^\w-]+/g, '_')
}

async function download (action, extension) {
  busy.value = extension
  try {
    const { data } = await HTTPAuthBlob.get(endpoint(action))
    const href = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = href
    link.download = `${safeName()}.${extension}`
    link.click()
    setTimeout(() => URL.revokeObjectURL(href), 1000)
  } finally {
    busy.value = null
  }
}

function openImport () {
  file.value = null
  mode.value = 'add'
  rowErrors.value = []
  importOpen.value = true
}

// errors per row (CSV: details.rows) or per profile (JSON: details.profiles)
function listErrors (details) {
  const byPlace = details?.rows || details?.profiles || {}
  return Object.entries(byPlace).flatMap(([where, messages]) =>
    [].concat(messages).map((message) => ({ where, message }))
  )
}

async function submit () {
  if (!(file.value instanceof File)) return
  busy.value = 'import'
  rowErrors.value = []
  try {
    const form = new FormData()
    form.append('file', file.value)
    form.append('mode', mode.value)
    const { data } = await HTTPAuth.post(endpoint(props.importAction), form)
    importOpen.value = false
    AlertSuccess(tdc('Permissions imported'))
    emit('imported', data)
  } catch (error) {
    rowErrors.value = listErrors(error?.response?.data?.error?.details)
  } finally {
    busy.value = null
  }
}
</script>
