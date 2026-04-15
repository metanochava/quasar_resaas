

<script setup>
import { ref, watch, computed } from 'vue'
import { tdc } from '../../boot/base'
import { HTTPAuth, url } from '../../boot/api'



// ---------------- PROPS ----------------
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  schema: { type: Array, default: () => [] },
  data: { type: Object, default: null },
  module: { type: String, required: true },
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
    return { data: form.value, config: {} }
  }

  const fd = new FormData()

  for (const [k, v] of Object.entries(form.value)) {
    if (v == null) continue

    if (v instanceof File) {
      fd.append(k, v)
    } else if (Array.isArray(v) && v[0] instanceof File) {
      fd.append(k, v[0])
    } else if (typeof v === 'object') {
      fd.append(k, JSON.stringify(v))
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

    const api = `/api/${props.module}/${props.model.toLowerCase()}s/`
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

    
    <s-card style="min-width: 760px; max-width: 92vw;">
      <!-- HEADER -->

      <!-- HEADER -->
      <q-bar class="row items-center justify-between" :class="$q.dark.isActive ? 'bg-primary text-white' : 'bg-primary text-white'">
         <div class="text-h6">
          {{ form?.id ? ('Editar') : tdc('Novo') }}
        </div>
        <s-btn dense flat icon="close" @click="close" >
          <q-tooltip>{{('Fechar')}}</q-tooltip>
        </s-btn>
      </q-bar>

      <q-separator />

      <!-- BODY -->
      <q-card-section v-if="!schema.length">
        <q-spinner />
      </q-card-section>

      <q-card-section v-else class="row q-col-gutter-sm">
        
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
          
      </q-card-section>
      <q-separator />

      <!-- ACTIONS -->
      <q-card-actions align="right">
        <s-btn flat label="Cancelar" @click="close" />
        <s-btn color="primary" :loading="saving" label="Salvar" @click="save" />
      </q-card-actions>

    </s-card>
  </q-dialog>
</template>