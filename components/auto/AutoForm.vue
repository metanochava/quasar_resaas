

<script setup>
import { ref, watch, computed } from 'vue'
import { tdc } from '../../services/translation'
import { HTTPAuth, url } from '../../services/api'
import ActionForm from '../../components/auto/ActionForm.vue'
import { toWriteValue } from '../../utils/payload'
        



// ---------------- PROPS ----------------
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  schema: { type: Array, default: () => [] },
  data: { type: Object, default: null },
  app: { type: String, required: true },
  model: { type: String, required: true },
  canDo: { type: Function, default: () => true },
  ignoreFields: { type: Array, default: () =>  ['id', 'created_at','updated_at', 'created_by', 'updated_by'] } 
  
})

// ---------------- EMITS ----------------
const emit = defineEmits(['update:modelValue','saved'])

// ---------------- LOCAL STATE (FIX) ----------------
const localModel = ref(props.modelValue)

watch(() => props.modelValue, v => {
  localModel.value = v
})

watch(localModel, v => {
  emit('update:modelValue', v)
})

// ---------------- FORM ----------------
const form = ref({})
const saving = ref(false)
const uploadProgress = ref(0)

const ignoreSet = computed(() => new Set(props.ignoreFields))


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
watch(() => props.data, (v) => {
  form.value = v ? { ...v } : {}
}, { immediate: true })

// ---------------- CLOSE ----------------
function close() {
  localModel.value = false
}

// ---------------- BUILD PAYLOAD ----------------
function buildPayload() {
  const hasFiles = fileFields.value.some(f =>
    form.value[f.name] instanceof File ||
    (Array.isArray(form.value[f.name]) && form.value[f.name][0] instanceof File)
  )

  if (!hasFiles) {
    // The form holds what the API READ back ({id, value, label} for a choice); the
    // API accepts the value. Same normalisation FormComponent applies.
    const data = {}

    for (const [key, value] of Object.entries(form.value)) {
      data[key] = toWriteValue(value)
    }

    return { data, config: {} }
  }

  const fd = new FormData()

  for (const [k, v] of Object.entries(form.value)) {
    if (v == null) continue

    if (v instanceof File) {
      fd.append(k, v)
    } else if (Array.isArray(v) && v[0] instanceof File) {
      fd.append(k, v[0])
    } else if (typeof v === 'object') {
      const value = toWriteValue(v)
      fd.append(k, typeof value === 'object' ? JSON.stringify(value) : value)
    } else {
      fd.append(k, v)
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

    const api = `${props.app}/${props.model.toLowerCase()}s/`
    const { data, config } = buildPayload()

    if (form.value.id) {
      // await HTTPAuth.put(url({ type:'u', url: api + form.value.id + '/, params:{} }), data, config)
      await HTTPAuth.patch(url({ type:'u', url: api + form.value.id + '/', params:{}}), data, config)
    } else {
      await HTTPAuth.post(url({ type:'u', url: api, params:{} }), data, config)
    }

    emit('saved')
    localModel.value = false

  } finally {
    saving.value = false
  }
}
</script>

<template>
  <q-dialog v-model="localModel" persistent>

    
    <s-modal-card
      :title="form?.id ? tdc('Edit') : tdc('New')"
      icon="edit_note"
      width="760px"
      @close="close"
    >
      <div v-if="!schema.length">
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
      </div>

      <div v-else class="row q-col-gutter-sm">
        
        <div v-for="f in generalFields" :key="f.name" class="col-6">
              <component
                :is=" f.component"
                v-model="form[f.name]"
                v-bind="f.props"
                dense
                outlined
              />
            </div>
            <div v-for="f in relationFields" :key="f.name" class="col-6">
              <component

                :is=" f.component"
                v-model="form[f.name]"
                v-bind="f.props"
                dense
                outlined
              />
            </div>
            <div v-for="f in fileFields" :key="f.name" class="col-6">

              <!-- preview -->
              <img
                v-if="f.ui?.isImage && typeof form[f.name] === 'string'"
                :src="form[f.name]"
                style="max-width:100px"
              />

              <component
                :is=" f.component"
                v-model="form[f.name]"
                v-bind="f.props"
                dense
                outlined
              />

            </div>
        <q-linear-progress v-if="uploadProgress > 0" :value="uploadProgress/100" />
          
      </div>

      <template #footer>
        <s-btn flat label="Cancel" @click="close" />
        <s-btn color="primary" :loading="saving" label="Save" @click="save" />

        <ActionForm
          :store="Person"
          :buttons="['cancel', 'reset', 'edit', 'save']"
        />
      </template>
    </s-modal-card>
  </q-dialog>
</template>