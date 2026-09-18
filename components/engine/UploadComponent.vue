<template>
  <div class="s-upload">
    <q-file
      v-model="localValue"
      v-bind="fileAttrs"
      :multiple="multiple"
      :append="multiple"
      :label="translatedLabel"
      :hint="translatedHint"
      :error="hasError"
      :error-message="firstError"
      :dense="attrs.dense ?? layout.dense"
      :outlined="attrs.outlined ?? (attrs.filled === undefined && attrs.standout === undefined)"
      :filled="attrs.filled"
      :standout="attrs.standout"
      :class="attrs.class"
      :style="radiusStyle"
      :rules="computedRules"
    />

    <div v-if="previewItems.length" class="s-upload-previews row q-gutter-sm q-mt-sm">
      <div
        v-for="item in previewItems"
        :key="item.key"
        class="s-upload-preview-item column items-center"
      >
        <div class="s-upload-preview-thumb" :style="radiusStyle">
          <img v-if="item.type === 'image'" :src="item.src" :alt="item.name">
          <q-icon v-else-if="item.type === 'pdf'" name="picture_as_pdf" size="32px" />
          <q-icon v-else name="insert_drive_file" size="32px" />
        </div>

        <div class="s-upload-preview-name text-caption ellipsis">{{ item.name }}</div>

        <s-btn
          flat
          round
          dense
          size="sm"
          color="negative"
          icon="close"
          @click="removeAt(item.index)"
        >
          <s-tooltip>{{ tdc('Remove') }}</s-tooltip>
        </s-btn>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed, ref, watch, useAttrs, onBeforeUnmount } from "vue"
import { useUserStore } from "../../stores/UserStore"
import { tdc } from "../../services/translation"
import { resolvePreview } from "../../utils/filePreview"

export default defineComponent({
  name: "s-upload",
  inheritAttrs: false,

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

    watch(() => props.modelValue, v => (localValue.value = v))
    watch(localValue, v => emit("update:modelValue", v))

    const translatedLabel = computed(() =>
      props.label ? tdc(props.label) : undefined
    )

    const translatedHint = computed(() =>
      props.hint ? tdc(props.hint) : undefined
    )

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
      translatedLabel,
      translatedHint,
      computedRules,
      radiusStyle,
      hasError,
      firstError,
      fileAttrs,
      previewItems,
      removeAt,
      tdc
    }
  }
})
</script>

<style scoped>
.s-upload-preview-thumb {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: rgba(128, 128, 128, 0.12);
}

.s-upload-preview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.s-upload-preview-item {
  width: 72px;
}

.s-upload-preview-name {
  max-width: 72px;
}
</style>
