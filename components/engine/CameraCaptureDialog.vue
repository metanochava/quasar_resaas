<template>
  <q-dialog :model-value="modelValue" @update:model-value="v => emit('update:modelValue', v)" @hide="stopStream">
    <s-modal-card :title="tdc('Use camera')" icon="photo_camera" width="480px" @close="close">
      <s-select
        v-if="videoDevices.length > 1"
        v-model="selectedDeviceId"
        dense
        emit-value
        map-options
        :options="deviceOptions"
        :label="tdc('Camera')"
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
        <img v-if="capturedPreviewUrl" :src="capturedPreviewUrl" class="captured-frame">
      </div>

      <div v-if="starting" class="flex flex-center q-pa-md">
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
      </div>

      <div v-if="errorMsg" class="text-negative text-caption q-mt-sm text-center">
        {{ errorMsg }}
      </div>

      <template #footer>
      <template v-if="!capturedPreviewUrl">
        <s-btn
          flat
          color="primary"
          icon="photo_camera"
          :label="tdc('Capture')"
          :disable="starting || !!errorMsg"
          @click="capture"
        />
      </template>
      <template v-else>
        <s-btn flat color="grey-7" :label="tdc('Retake')" @click="retake" />
        <s-btn flat color="primary" :label="tdc('Use photo')" @click="usePhoto" />
      </template>
      </template>
    </s-modal-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from "vue"
import { tdc } from "../../services/translation"

// Extracted from ImageCaptureComponent.vue (s-image-capture), which
// previously had its own private copy of this exact device-enumeration/
// getUserMedia/canvas-capture flow - shared here so UploadComponent.vue
// (s-file) can offer the SAME camera capture for any ImageField without
// duplicating it, and s-image-capture now uses this too instead of its
// own inline version.
const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(["update:modelValue", "captured"])

const starting = ref(false)
const errorMsg = ref("")
const videoEl = ref(null)
const videoDevices = ref([])
const selectedDeviceId = ref(null)
const capturedBlob = ref(null)
const capturedPreviewUrl = ref(null)

let stream = null

const deviceOptions = computed(() =>
  videoDevices.value.map((device, index) => ({
    label: device.label || `${tdc("Camera")} ${index + 1}`,
    value: device.deviceId,
  }))
)

function cameraErrorMessage(e) {
  const msg = String(e?.message || e || "")

  if (msg.includes("NotAllowedError") || msg.toLowerCase().includes("permission")) {
    return tdc("Camera permission denied. Enable camera access in your browser settings.")
  }
  if (msg.includes("NotFoundError")) {
    return tdc("No camera found on this device.")
  }
  if (window.isSecureContext === false) {
    return tdc("Camera only works over HTTPS (or localhost).")
  }
  return tdc("Could not access the camera.")
}

async function openCamera() {
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

  emit("captured", file)
  close()
}

function close() {
  emit("update:modelValue", false)
}

watch(() => props.modelValue, (open) => {
  if (open) openCamera()
})

onBeforeUnmount(() => {
  stopTracks()
  if (capturedPreviewUrl.value) URL.revokeObjectURL(capturedPreviewUrl.value)
})
</script>

<style scoped>
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
