<template>
  <div>
    <q-toggle
      v-model="localValue"
      :label="translatedLabel"
      :dense="attrs.dense ?? layout.dense"
    />

    <div v-if="hasError" class="s-switch-error text-negative text-caption">
      {{ firstError }}
    </div>
  </div>
</template>

<script>
import { defineComponent, computed, ref, watch, useAttrs } from "vue"
import { useUserStore } from "../../stores/UserStore"
import { tdc } from "../../services/translation"

export default defineComponent({
  name: "s-switch",
  inheritAttrs: false,
  props: {
    modelValue: Boolean,
    label: String,

    // Backend validation error for this field (BaseStore.errors[name],
    // see parseFieldErrors in boot/alerts.js) - q-toggle has no native
    // :error/:error-message (it isn't QField-based), so this renders
    // as plain caption text below the toggle instead.
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

    const hasError = computed(() => !!props.error)
    const firstError = computed(() =>
      (typeof props.error === "string" && props.error) || props.errorMessage || ""
    )

    return { attrs, layout, localValue, translatedLabel, hasError, firstError }
  }
})
</script>

<style scoped>
.s-switch-error {
  margin-top: -4px;
}
</style>
