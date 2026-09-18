<template>
  <div class="s-image-capture">
    <div v-if="previewUrl" class="row items-center q-gutter-sm">
      <q-avatar size="72px" square class="rounded-borders">
        <img :src="previewUrl">
      </q-avatar>

      <div class="column q-gutter-xs">
        <div class="text-caption text-grey-7">{{ translatedLabel }}</div>
        <div class="row q-gutter-xs">
          <s-btn dense flat color="primary" :label="tdc('Change')" @click="triggerFileInput" />
          <s-btn dense flat color="negative" :label="tdc('Remove')" @click="clear" />
        </div>
      </div>
    </div>

    <div v-else class="row q-gutter-sm items-center">
      <s-btn
        dense
        outline
        icon="upload"
        color="primary"
        :label="tdc('Choose file')"
        @click="triggerFileInput"
      />
      <s-btn
        dense
        outline
        icon="photo_camera"
        color="primary"
        :label="tdc('Use camera')"
        @click="cameraOpen = true"
      />
      <div v-if="required && showRequiredHint" class="text-negative text-caption">
        {{ tdc('Required field') }}
      </div>
    </div>

    <div v-if="hasError" class="text-negative text-caption">
      {{ firstError }}
    </div>

    <input
      ref="fileInputEl"
      type="file"
      accept="image/*"
      class="hidden-file-input"
      @change="onFileChosen"
    >

    <!-- Shared with UploadComponent.vue (s-file) - see
         CameraCaptureDialog.vue's own comment for why this used to be
         a private copy of the same device/getUserMedia/canvas flow. -->
    <CameraCaptureDialog v-model="cameraOpen" @captured="setModelValue" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from "vue"
import { tdc } from "../../services/translation"
import CameraCaptureDialog from "./CameraCaptureDialog.vue"

/**
 * Campo de foto reutilizável: upload OU câmara (com selecção de
 * dispositivo quando há mais do que uma câmara ligada, via
 * CameraCaptureDialog.vue). Devolve sempre um File via v-model, com o
 * mesmo contrato de s-file - pode substituir directamente um <s-file>
 * onde o campo for uma imagem de identificação (ex.: foto de Patient/
 * Employee).
 *
 * MVP: sem crop/rotate (fase futura, não bloqueante - ver
 * docs/architecture/patient-longitudinal-health-pharmacy.md, Fase 3
 * do back).
 */

const props = defineProps({
  // File: foto nova escolhida/capturada nesta sessão.
  // String: URL de uma foto já guardada no servidor (ex.: a editar
  // um Paciente existente) - mostrada tal e qual, sem createObjectURL.
  modelValue: [Object, File, String, null],
  label: { type: String, default: "Foto" },
  required: Boolean,

  // Backend validation error for this field (BaseStore.errors[name],
  // see parseFieldErrors in boot/alerts.js) - this component has no
  // underlying QField, so the message renders as plain caption text.
  error: {
    type: [Boolean, String],
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(["update:modelValue"])

const fileInputEl = ref(null)
const previewUrl = ref(null)
const showRequiredHint = ref(false)
const cameraOpen = ref(false)

const translatedLabel = computed(() => tdc(props.label))

const hasError = computed(() => !!props.error)
const firstError = computed(() =>
  (typeof props.error === "string" && props.error) || props.errorMessage || ""
)

function setModelValue(file) {
  emit("update:modelValue", file)
}

let previewIsObjectUrl = false

function revokePreview() {
  if (previewUrl.value && previewIsObjectUrl) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = null
  previewIsObjectUrl = false
}

watch(
  () => props.modelValue,
  (value) => {
    revokePreview()

    if (!value) return

    if (typeof value === "string") {
      previewUrl.value = value
    } else {
      previewUrl.value = URL.createObjectURL(value)
      previewIsObjectUrl = true
    }
  },
  { immediate: true }
)

function triggerFileInput() {
  fileInputEl.value?.click()
}

function onFileChosen(event) {
  const file = event.target.files?.[0]
  if (file) setModelValue(file)
  event.target.value = ""
}

function clear() {
  showRequiredHint.value = props.required
  setModelValue(null)
}

onBeforeUnmount(() => {
  revokePreview()
})
</script>

<style scoped>
.hidden-file-input {
  display: none;
}
</style>
