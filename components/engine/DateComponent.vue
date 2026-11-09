<template>
  <q-input
    v-bind="inputAttrs"
    v-model="displayText"
    :label="translatedLabel"
    :placeholder="translatedPlaceholder || pattern"
    :hint="translatedHint"
    :error="hasError"
    :error-message="firstError"
    :rules="computedRules"
    :dense="attrs.dense ?? layout.dense"
    :outlined="attrs.outlined ?? (attrs.filled === undefined && attrs.standout === undefined)"
    :filled="attrs.filled"
    :standout="attrs.standout"
    :class="['s-date', attrs.class]"
    mask="##/##/####"
  >
    <template #append>
      <q-icon
        name="event"
        class="cursor-pointer"
      >
        <q-popup-proxy
          cover
          transition-show="scale"
          transition-hide="scale"
        >
          <q-date
            v-model="pickerValue"
            mask="YYYY-MM-DD"
            :locale="calendarLocale"
          >
            <div class="row items-center justify-end q-pa-sm">
              <s-btn
                v-close-popup
                label="OK"
                color="primary"
                flat
              />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>

    <slot />
  </q-input>
</template>

<script>
import { defineComponent, computed, useAttrs, ref, watch } from "vue"
import { useUserStore } from "../../stores/UserStore"
import { tdc } from "../../services/translation"
import { dateOrder, datePattern, isoToDisplay, displayToIso, dateLocale } from "../../utils/dateFormat"

export default defineComponent({
  name: "s-date",
  inheritAttrs: false,

  props: {
    modelValue: {
      type: String,
      default: null
    },

    label: String,

    placeholder: String,

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
    },

    validators: {
      type: Array,
      default: () => []
    }
  },

  emits: ["update:modelValue"],

  setup(props, { emit }) {
    const attrs = useAttrs()
    const User = useUserStore()

    const layout = computed(() => User.ps?.layout || {})

    // shown and typed in the language's order (pt-pt 09/11/2026, en-us
    // 11/09/2026); v-model is always ISO "YYYY-MM-DD" (utils/dateFormat.js)
    const languageCode = computed(() => User.Language?.code || '')
    const order = computed(() => dateOrder(languageCode.value))
    const pattern = computed(() => tdc(datePattern(order.value)))
    const calendarLocale = computed(() => dateLocale(languageCode.value))

    const displayText = ref(isoToDisplay(props.modelValue, order.value))

    const hasError = computed(() => !!props.error)
    const firstError = computed(() =>
      (typeof props.error === "string" && props.error) || props.errorMessage || ""
    )

    watch(
      () => props.modelValue,
      v => {
        // what was typed already means this value: keep the text as typed
        if ((displayToIso(displayText.value, order.value) || null) === (v || null)) return
        displayText.value = isoToDisplay(v, order.value)
      }
    )

    watch(order, () => {
      displayText.value = isoToDisplay(props.modelValue, order.value)
    })

    watch(displayText, text => {
      // incomplete or impossible (31/02): no date yet
      const iso = displayToIso(text, order.value)
      if ((iso || null) !== (props.modelValue || null)) emit("update:modelValue", iso)
    })

    // the calendar works in ISO
    const pickerValue = computed({
      get: () => props.modelValue || null,
      set: v => { displayText.value = isoToDisplay(v, order.value) }
    })

    const computedRules = computed(() => {
      const rules = []

      if (props.required) {
        rules.push(v => !!displayToIso(v, order.value) || !!String(v || '').trim() || tdc("Required field"))
      }

      // something typed that is not a date in the language's order
      rules.push(v => !String(v || '').trim() || !!displayToIso(v, order.value) || tdc("Invalid date"))

      // the field's own validators see the ISO value, as before
      for (const validator of props.validators) {
        rules.push(v => validator(displayToIso(v, order.value)))
      }

      return rules
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

    const inputAttrs = computed(() => {
      const {
        class: klass,
        label,
        placeholder,
        hint,
        ...rest
      } = attrs

      return rest
    })

    return {
      attrs,
      layout,
      displayText,
      pickerValue,
      pattern,
      calendarLocale,
      hasError,
      firstError,
      computedRules,
      translatedLabel,
      translatedPlaceholder,
      translatedHint,
      inputAttrs
    }
  }
})
</script>

<style scoped>
.s-date {
  width: 100%;
}
</style>