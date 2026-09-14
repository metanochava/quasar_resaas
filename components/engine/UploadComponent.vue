<template>
  <q-file
    v-model="localValue"
    v-bind="fileAttrs"
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
</template>

<script>
import { defineComponent, computed, ref, watch, useAttrs } from "vue"
import { useUserStore } from "../../stores/UserStore"
import { tdc } from "../../services/translation"

export default defineComponent({
  name: "s-upload",
  inheritAttrs: false,

  props: {
    modelValue: [Object, Array, File, null],
    label: String,
    hint: String,
    required: Boolean,

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
        rules.push(v => !!v || tdc("Required field"))
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
      fileAttrs
    }
  }
})
</script>
