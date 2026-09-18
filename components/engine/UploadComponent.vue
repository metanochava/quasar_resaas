<template>
  <div class="s-file">
    <!-- Native picker stays mounted (q-file's own pickFiles()/rules/
         FormData integration is still what actually opens the OS file
         dialog and holds the value) but is never shown - only the
         buttons below are, per-field label/hint/error still render
         above them so nothing informational is lost. -->
    <div v-if="translatedLabel || translatedHint || hasError" class="s-file-meta">
      <div v-if="translatedLabel" class="text-caption text-grey-7">{{ translatedLabel }}</div>
      <div v-if="hasError" class="text-negative text-caption">{{ firstError }}</div>
      <div v-else-if="translatedHint" class="text-caption text-grey-6">{{ translatedHint }}</div>
    </div>

    <q-file
      ref="fileRef"
      v-model="localValue"
      v-bind="fileAttrs"
      :multiple="multiple"
      :append="multiple"
      :rules="computedRules"
      class="s-file-native-input"
    />

    <div class="row items-center q-gutter-sm">
      <div
        v-for="item in previewItems"
        :key="item.key"
        class="s-file-preview-item column items-center"
      >
        <div class="s-file-preview-thumb" :style="radiusStyle">
          <img v-if="item.type === 'image'" :src="item.src" :alt="item.name">
          <q-icon v-else-if="item.type === 'pdf'" name="picture_as_pdf" size="32px" />
          <q-icon v-else name="insert_drive_file" size="32px" />
        </div>

        <div class="s-file-preview-name text-caption ellipsis">{{ item.name }}</div>

        <div class="row q-gutter-xs">
          <s-btn
            v-if="!multiple"
            flat
            round
            dense
            size="sm"
            color="primary"
            icon="edit"
            @click="openAdd"
          >
            <s-tooltip>{{ tdc('Change') }}</s-tooltip>
          </s-btn>
          <s-btn
            flat
            round
            dense
            size="sm"
            color="negative"
            icon="delete"
            @click="removeAt(item.index)"
          >
            <s-tooltip>{{ tdc('Remove') }}</s-tooltip>
          </s-btn>
        </div>
      </div>

      <!-- Add - a single value already has its own "Change" button
           above, so this only shows again once empty (single) or
           always (multiple, to keep adding more). -->
      <s-btn
        v-if="multiple || !previewItems.length"
        round
        outline
        color="primary"
        icon="add"
        @click="isImageField ? (addMenuOpen = true) : openAdd()"
      >
        <s-tooltip>{{ tdc('Add') }}</s-tooltip>

        <q-menu v-if="isImageField" v-model="addMenuOpen">
          <q-list dense style="min-width: 160px">
            <q-item clickable v-close-popup @click="openAdd">
              <q-item-section avatar><q-icon name="upload" /></q-item-section>
              <q-item-section>{{ tdc('Choose file') }}</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="cameraOpen = true">
              <q-item-section avatar><q-icon name="photo_camera" /></q-item-section>
              <q-item-section>{{ tdc('Use camera') }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </s-btn>
    </div>

    <CameraCaptureDialog v-if="isImageField" v-model="cameraOpen" @captured="onCameraCaptured" />
  </div>
</template>

<script>
import { defineComponent, computed, ref, watch, useAttrs, onBeforeUnmount, nextTick } from "vue"
import { useUserStore } from "../../stores/UserStore"
import { tdc } from "../../services/translation"
import { resolvePreview } from "../../utils/filePreview"
import CameraCaptureDialog from "./CameraCaptureDialog.vue"

// A comma-joined accept list can be MIME-based ("image/*") or
// extension-based (".png,.jpg,.jpeg,.webp" - see User.RESAAS.fields'
// own profile config, saas/models/user.py) - either form should offer
// the camera option, so both are checked.
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|bmp|heic|heif)\b/i

function looksLikeImageAccept(accept) {
  if (!accept) return false
  return accept.includes("image/") || IMAGE_EXTENSIONS.test(accept)
}

export default defineComponent({
  name: "s-file",
  inheritAttrs: false,

  components: {
    CameraCaptureDialog
  },

  props: {
    modelValue: [Object, Array, File, null],
    label: String,
    hint: String,
    required: Boolean,

    // Backend now sends this from RESAAS.fields' own `multiple` (see
    // app_schema.py's _resolve_ui() - the exact same per-field config
    // dict that already carries `accept`/`max_size`), so a schema-driven
    // form gets multi-file upload without the page having to know about
    // it - but any manual caller can still just pass it directly too.
    multiple: {
      type: Boolean,
      default: false
    },

    // Bytes - same RESAAS.fields `max_size` the backend already
    // validates; checked here too so an oversized file is rejected in
    // the browser instead of round-tripping to the server first.
    maxSize: {
      type: Number,
      default: null
    },

    // Backend validation error for this field (BaseStore.errors[name],
    // see parseFieldErrors in boot/alerts.js) - matches Quasar's own
    // :error/:error-message convention.
    error: {
      type: [Boolean, String],
      default: false
    },
    errorMessage: {
      type: String,
      default: ''
    }
  },

  emits: ["update:modelValue"],

  setup(props, { emit }) {
    const attrs = useAttrs()
    const User = useUserStore()
    const layout = computed(() => User.ps?.layout || {})
    const localValue = ref(props.modelValue)
    const fileRef = ref(null)
    const addMenuOpen = ref(false)
    const cameraOpen = ref(false)

    watch(() => props.modelValue, v => (localValue.value = v))
    watch(localValue, v => emit("update:modelValue", v))

    const translatedLabel = computed(() =>
      props.label ? tdc(props.label) : undefined
    )

    const translatedHint = computed(() =>
      props.hint ? tdc(props.hint) : undefined
    )

    const isImageField = computed(() => looksLikeImageAccept(attrs.accept))

    const computedRules = computed(() => {
      const rules = []

      if (props.required) {
        rules.push(v => {
          if (Array.isArray(v)) return v.length > 0 || tdc("Required field")
          return !!v || tdc("Required field")
        })
      }

      if (props.maxSize) {
        rules.push(v => {
          const files = Array.isArray(v) ? v : (v ? [v] : [])
          const tooBig = files.find(f => f instanceof File && f.size > props.maxSize)
          if (!tooBig) return true
          const maxMb = (props.maxSize / (1024 * 1024)).toFixed(1)
          return `${tdc("File too large - max")} ${maxMb}MB`
        })
      }

      return rules
    })

    const radiusStyle = computed(() => ({
      borderRadius: layout.value.rounded ? "16px" : "4px"
    }))

    const hasError = computed(() => !!props.error)
    const firstError = computed(() =>
      (typeof props.error === "string" && props.error) || props.errorMessage || ""
    )

    const fileAttrs = computed(() => {
      const { class: klass, ...rest } = attrs
      return rest
    })

    // ---------------- OPEN NATIVE PICKER ----------------
    // The visible q-file is display:none (see <style> below) but stays
    // fully functional - pickFiles() is QFile's own exposed method for
    // opening the OS file dialog programmatically, so "Add"/"Change"
    // can trigger it without the native control ever being shown.
    function openAdd() {
      nextTick(() => fileRef.value?.pickFiles?.())
    }

    function onCameraCaptured(file) {
      if (props.multiple) {
        const current = Array.isArray(localValue.value) ? localValue.value : []
        localValue.value = [...current, file]
      } else {
        localValue.value = file
      }
    }

    // ---------------- PREVIEW ----------------
    const blobUrls = new Set()

    const previewItems = computed(() => {
      const values = Array.isArray(localValue.value)
        ? localValue.value
        : (localValue.value ? [localValue.value] : [])

      return values
        .map((value, index) => {
          const preview = resolvePreview(value)
          if (!preview) return null

          if (preview.isBlobUrl) blobUrls.add(preview.src)

          return {
            ...preview,
            index,
            key: value instanceof File ? `${value.name}-${value.size}-${value.lastModified}` : (value.url || index)
          }
        })
        .filter(Boolean)
    })

    function removeAt(index) {
      if (Array.isArray(localValue.value)) {
        localValue.value = localValue.value.filter((_, i) => i !== index)
      } else {
        localValue.value = null
      }
    }

    onBeforeUnmount(() => {
      blobUrls.forEach(url => URL.revokeObjectURL(url))
    })

    return {
      attrs,
      layout,
      localValue,
      fileRef,
      addMenuOpen,
      cameraOpen,
      isImageField,
      translatedLabel,
      translatedHint,
      computedRules,
      radiusStyle,
      hasError,
      firstError,
      fileAttrs,
      previewItems,
      openAdd,
      removeAt,
      onCameraCaptured,
      tdc
    }
  }
})
</script>

<style scoped>
.s-file-native-input {
  display: none;
}

.s-file-preview-thumb {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: rgba(128, 128, 128, 0.12);
}

.s-file-preview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.s-file-preview-item {
  width: 72px;
}

.s-file-preview-name {
  max-width: 72px;
}

.s-file-meta {
  margin-bottom: 4px;
}
</style>
