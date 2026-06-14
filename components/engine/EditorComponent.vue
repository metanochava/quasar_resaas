<template>
  <div class="s-editor-wrapper">
    <div
      v-if="translatedLabel"
      class="s-editor-label"
    >
      {{ translatedLabel }}
      <span
        v-if="required"
        class="text-negative"
      >
        *
      </span>
    </div>

    <q-editor
      v-bind="editorAttrs"
      v-model="localValue"
      :placeholder="translatedPlaceholder"
      :toolbar="computedToolbar"
      :min-height="computedMinHeight"
      :max-height="attrs.maxHeight"
      :height="attrs.height"
      :dense="attrs.dense ?? layout.input_dense"
      :class="[
        's-editor',
        attrs.class,
        {
          's-editor--error': hasError
        }
      ]"
    />

    <div
      v-if="translatedHint && !hasError"
      class="s-editor-hint"
    >
      {{ translatedHint }}
    </div>

    <div
      v-if="hasError"
      class="s-editor-error"
    >
      {{ firstError }}
    </div>
  </div>
</template>

<script>
import { defineComponent, computed, useAttrs, ref, watch } from "vue"
import { useUserStore } from "../../stores/UserStore"
import { tdc } from "../../boot/base"

export default defineComponent({
  name: "s-editor",
  inheritAttrs: false,

  props: {
    modelValue: {
      type: String,
      default: ""
    },

    label: String,

    placeholder: String,

    hint: String,

    required: Boolean,

    validators: {
      type: Array,
      default: () => []
    },

    toolbar: {
      type: Array,
      default: null
    },

    minHeight: {
      type: String,
      default: "180px"
    }
  },

  emits: ["update:modelValue"],

  setup(props, { emit }) {
    const attrs = useAttrs()
    const User = useUserStore()

    const layout = computed(() => User.ps?.layout || {})

    const localValue = ref(props.modelValue || "")

    const hasError = ref(false)
    const firstError = ref("")

    watch(
      () => props.modelValue,
      value => {
        localValue.value = value || ""
      }
    )

    watch(localValue, value => {
      emit("update:modelValue", value)
      validate(value)
    })

    const translatedLabel = computed(() =>
      props.label
        ? tdc(props.label)
        : attrs.label
        ? tdc(attrs.label)
        : undefined
    )

    const translatedPlaceholder = computed(() =>
      props.placeholder
        ? tdc(props.placeholder)
        : attrs.placeholder
        ? tdc(attrs.placeholder)
        : undefined
    )

    const translatedHint = computed(() =>
      props.hint
        ? tdc(props.hint)
        : attrs.hint
        ? tdc(attrs.hint)
        : undefined
    )

    const computedToolbar = computed(() => {
      if (props.toolbar) return props.toolbar

      return [
        [
          {
            label: tdc("Formato"),
            icon: "format_size",
            list: "no-icons",
            options: [
              "p",
              "h1",
              "h2",
              "h3",
              "h4",
              "h5",
              "h6",
              "code"
            ]
          }
        ],

        [
          "bold",
          "italic",
          "strike",
          "underline",
          "subscript",
          "superscript"
        ],

        [
          "quote",
          "unordered",
          "ordered",
          "outdent",
          "indent"
        ],

        [
          "left",
          "center",
          "right",
          "justify"
        ],

        [
          "undo",
          "redo"
        ],

        [
          "removeFormat"
        ]
      ]
    })

    const computedMinHeight = computed(() => {
      return attrs.minHeight || props.minHeight
    })

    function validate(value) {
      const rules = []

      if (props.required) {
        rules.push(v => !!stripHtml(v).trim() || tdc("Campo obrigatório"))
      }

      for (const validator of props.validators) {
        rules.push(validator)
      }

      for (const rule of rules) {
        const result = rule(value)

        if (result !== true) {
          hasError.value = true
          firstError.value = result
          return false
        }
      }

      hasError.value = false
      firstError.value = ""
      return true
    }

    function stripHtml(value) {
      return String(value || "").replace(/<[^>]*>/g, "")
    }

    const editorAttrs = computed(() => {
      const {
        class: klass,
        label,
        placeholder,
        hint,
        minHeight,
        maxHeight,
        height,
        ...rest
      } = attrs

      return rest
    })

    return {
      attrs,
      layout,
      localValue,
      translatedLabel,
      translatedPlaceholder,
      translatedHint,
      computedToolbar,
      computedMinHeight,
      hasError,
      firstError,
      editorAttrs
    }
  }
})
</script>

<style scoped>
.s-editor-wrapper {
  width: 100%;
}

.s-editor-label {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
  color: rgba(0, 0, 0, 0.75);
}

.s-editor {
  width: 100%;
}

.s-editor--error {
  border: 1px solid var(--q-negative);
  border-radius: 4px;
}

.s-editor-hint {
  font-size: 12px;
  color: #777;
  margin-top: 4px;
}

.s-editor-error {
  font-size: 12px;
  color: var(--q-negative);
  margin-top: 4px;
}
</style>