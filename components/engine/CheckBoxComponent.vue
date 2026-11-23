<template>
  <!-- in a form row it takes a field's height (dense or not) and the reserved
       hint / error line, so it lines up with the inputs beside it -->
  <div :class="['s-choice-field', { 's-choice-field--dense': dense }]">
    <q-checkbox
      v-model="localValue"
      :label="translatedLabel"
      :dense="dense"
    />

    <div v-if="hasError" class="s-checkbox-error text-negative text-caption">
      {{ firstError }}
    </div>
  </div>
</template>

<script>
import { defineComponent, computed, ref, watch, useAttrs } from "vue"
import { useUserStore } from "../../stores/UserStore"
import { fieldLook } from "../../utils/fieldLook"
import { tdc } from "../../services/translation"

export default defineComponent({
  name: "s-checkbox",
  inheritAttrs: false,
  props: {
    modelValue: Boolean,
    label: String,

    // Backend validation error for this field (BaseStore.errors[name],
    // see parseFieldErrors in boot/alerts.js) - q-checkbox has no
    // native :error/:error-message (it isn't QField-based), so this
    // renders as plain caption text below the checkbox instead.
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
    const dense = computed(() => Boolean(fieldLook(attrs, layout.value).dense))
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

    return { attrs, layout, dense, localValue, translatedLabel, hasError, firstError }
  }
})
</script>

<style scoped>
.s-checkbox-error {
  margin-top: -4px;
}
</style>

<style>
/* a checkbox / toggle in a form row (a col of a .row) lines up with the
   fields beside it: their control height (56px, 40px dense) plus the hint /
   error line every field reserves (utils/fieldLook) */
.row > [class*="col"] > .s-choice-field {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 56px;
  margin-bottom: 20px;
}
.row > [class*="col"] > .s-choice-field--dense {
  min-height: 40px;
}
.row > [class*="col"] > .s-choice-field > .s-checkbox-error {
  position: absolute;
  top: 100%;
  left: 0;
}
</style>
