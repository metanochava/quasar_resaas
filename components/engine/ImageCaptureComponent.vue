<template>
  <div class="s-image-capture">
    <div v-if="previewUrl" class="row items-center q-gutter-sm">
      <q-avatar size="72px" square class="rounded-borders">
        <img :src="previewUrl" />
      </q-avatar>

      <div class="column q-gutter-xs">
        <div class="text-caption text-grey-7">{{ translatedLabel }}</div>
        <div class="row q-gutter-xs">
          <s-btn dense flat color="primary" :label="tdc('Trocar')" @click="openPicker" />
          <s-btn dense flat color="negative" :label="tdc('Remover')" @click="clear" />
        </div>
      </div>
    </div>

    <div v-else class="row q-gutter-sm items-center">
      <s-btn
        dense
        outline
        icon="upload"
        color="primary"
        :label="tdc('Escolher Ficheiro')"
        @click="triggerFileInput"
      />
      <s-btn
        dense
        outline
        icon="photo_camera"
        color="primary"
        :label="tdc('Usar Câmara')"
        @click="openCamera"
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
    />

    <q-dialog v-model="cameraOpen" @hide="stopStream">
      <s-card style="width: 100%; max-width: 480px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ tdc('Usar Câmara') }}</div>
          <q-space />
          <q-btn flat round dense icon="close" @click="cameraOpen = false" />
        </q-card-section>

        <q-card-section>
          <s-select
            v-if="videoDevices.length > 1"
            v-model="selectedDeviceId"
            dense
            emit-value
            map-options
            :options="deviceOptions"
            :label="tdc('Câmara')"
            class="q-mb-sm"
            @update:model-value="startStream"
          />

          <div class="camera-box">
            <video
              v-show="!capturedPreviewUrl"
              ref="videoEl"
              autoplay
              playsinline
              muted
            />
            <img v-if="capturedPreviewUrl" :src="capturedPreviewUrl" class="captured-frame" />
          </div>

          <div v-if="starting" class="flex flex-center q-pa-md">
            <q-spinner color="primary" size="32px" />
          </div>

          <div v-if="errorMsg" class="text-negative text-caption q-mt-sm text-center">
            {{ errorMsg }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <template v-if="!capturedPreviewUrl">
            <s-btn
              flat
              color="primary"
              icon="photo_camera"
              :label="tdc('Capturar')"
              :disable="starting || !!errorMsg"
              @click="capture"
            />
          </template>
          <template v-else>
            <s-btn flat color="grey-7" :label="tdc('Repetir')" @click="retake" />
            <s-btn flat color="primary" :label="tdc('Usar Foto')" @click="usePhoto" />
          </template>
        </q-card-actions>
      </s-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from "vue"
import { tdc } from "../../services/translation"

/**
 * Campo de foto reutilizável: upload OU câmara (com selecção de
 * dispositivo quando há mais do que uma câmara ligada). Devolve
 * sempre um File via v-model, com o mesmo contrato de s-upload -
 * pode substituir directamente um <s-upload> onde o campo for uma
 * imagem de identificação (ex.: foto de Patient/Employee).
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
const starting = ref(false)
const errorMsg = ref("")
const videoEl = ref(null)
const videoDevices = ref([])
const selectedDeviceId = ref(null)
const capturedBlob = ref(null)
const capturedPreviewUrl = ref(null)

let stream = null

const translatedLabel = computed(() => tdc(props.label))

const hasError = computed(() => !!props.error)
const firstError = computed(() =>
  (typeof props.error === "string" && props.error) || props.errorMessage || ""
)

const deviceOptions = computed(() =>
  videoDevices.value.map((device, index) => ({
    label: device.label || `${tdc("Câmara")} ${index + 1}`,
    value: device.deviceId,
  }))
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

function openPicker() {
  triggerFileInput()
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

// =========================================================
// CÂMARA
// =========================================================

function cameraErrorMessage(e) {
  const msg = String(e?.message || e || "")

  if (msg.includes("NotAllowedError") || msg.toLowerCase().includes("permission")) {
    return tdc("Permissão de câmara negada. Ativa o acesso à câmara nas definições do navegador.")
  }
  if (msg.includes("NotFoundError")) {
    return tdc("Nenhuma câmara encontrada neste dispositivo.")
  }
  if (window.isSecureContext === false) {
    return tdc("A câmara só funciona em HTTPS (ou localhost).")
  }
  return tdc("Não foi possível aceder à câmara.")
}

async function openCamera() {
  cameraOpen.value = true
  capturedBlob.value = null
  capturedPreviewUrl.value = null
  errorMsg.value = ""

  await startStream()

  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    videoDevices.value = devices.filter((d) => d.kind === "videoinput")
  } catch {
    videoDevices.value = []
  }
}

async function startStream() {
  stopTracks()
  starting.value = true
  errorMsg.value = ""

  try {
    const constraints = selectedDeviceId.value
      ? { video: { deviceId: { exact: selectedDeviceId.value } } }
      : { video: { facingMode: "environment" } }

    stream = await navigator.mediaDevices.getUserMedia(constraints)

    if (videoEl.value) {
      videoEl.value.srcObject = stream
    }

    if (!selectedDeviceId.value) {
      const track = stream.getVideoTracks()[0]
      selectedDeviceId.value = track?.getSettings?.().deviceId || null
    }
  } catch (e) {
    errorMsg.value = cameraErrorMessage(e)
  } finally {
    starting.value = false
  }
}

function stopTracks() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
    stream = null
  }
}

function stopStream() {
  stopTracks()
  capturedBlob.value = null
  capturedPreviewUrl.value = null
  errorMsg.value = ""
}

function capture() {
  if (!videoEl.value) return

  const canvas = document.createElement("canvas")
  canvas.width = videoEl.value.videoWidth
  canvas.height = videoEl.value.videoHeight
  canvas.getContext("2d").drawImage(videoEl.value, 0, 0)

  canvas.toBlob((blob) => {
    if (!blob) return
    capturedBlob.value = blob
    capturedPreviewUrl.value = URL.createObjectURL(blob)
  }, "image/jpeg", 0.9)
}

function retake() {
  if (capturedPreviewUrl.value) URL.revokeObjectURL(capturedPreviewUrl.value)
  capturedBlob.value = null
  capturedPreviewUrl.value = null
}

function usePhoto() {
  if (!capturedBlob.value) return

  const file = new File([capturedBlob.value], `photo-${Date.now()}.jpg`, {
    type: "image/jpeg",
  })

  setModelValue(file)
  cameraOpen.value = false
}

onBeforeUnmount(() => {
  stopTracks()
  revokePreview()
  if (capturedPreviewUrl.value) URL.revokeObjectURL(capturedPreviewUrl.value)
})
</script>

<style scoped>
.hidden-file-input {
  display: none;
}

.camera-box {
  width: 100%;
  min-height: 260px;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-box video,
.captured-frame {
  width: 100%;
  height: auto;
  display: block;
}
</style>
