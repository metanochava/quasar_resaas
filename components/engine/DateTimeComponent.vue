<template>
  <q-input
    v-bind="inputAttrs"
    v-model="displayValue"
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
    :class="['s-date-time', attrs.class]"
    mask="##/##/#### ##:##"
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
          <div class="bg-white">
            <q-date
              v-model="dateValue"
              mask="YYYY-MM-DD"
              :locale="calendarLocale"
            />

            <q-separator />

            <q-time
              v-model="timeValue"
              mask="HH:mm"
              format24h
            />

            <div class="row justify-end q-pa-sm">
              <s-btn
                flat
                color="primary"
                label="OK"
                @click="applyDateTime"
                v-close-popup
              />
            </div>
          </div>
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
import {
  dateOrder, datePattern, dateLocale,
  splitIsoDateTime, isoDateTimeToDisplay, displayToIsoDateTime
} from "../../utils/dateFormat"

export default defineComponent({
  name: "s-date-time",
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

    // shown and typed in the language's order ("09/11/2026 14:30" in pt-pt,
    // "11/09/2026 14:30" in en-us, 24h); v-model is always ISO
    // "YYYY-MM-DD HH:mm:ss" (utils/dateFormat.js)
    const languageCode = computed(() => User.Language?.code || '')
    const order = computed(() => dateOrder(languageCode.value))
    const pattern = computed(() => `${tdc(datePattern(order.value))} HH:mm`)
    const calendarLocale = computed(() => dateLocale(languageCode.value))

    const displayValue = ref(isoDateTimeToDisplay(props.modelValue, order.value))
    const dateValue = ref("")
    const timeValue = ref("00:00")

    const hasError = computed(() => !!props.error)
    const firstError = computed(() =>
      (typeof props.error === "string" && props.error) || props.errorMessage || ""
    )

    // the pickers start on the current value
    function syncPickers (value) {
      const { date, time } = splitIsoDateTime(value)
      dateValue.value = date
      timeValue.value = time || "00:00"
    }
    syncPickers(props.modelValue)

    watch(
      () => props.modelValue,
      v => {
        syncPickers(v)
        // what was typed already means this value: keep the text as typed
        const typed = displayToIsoDateTime(displayValue.value, order.value)
        if (typed && splitIsoDateTime(typed).date === splitIsoDateTime(v).date &&
            splitIsoDateTime(typed).time === splitIsoDateTime(v).time) return
        displayValue.value = isoDateTimeToDisplay(v, order.value)
      }
    )

    watch(order, () => {
      displayValue.value = isoDateTimeToDisplay(props.modelValue, order.value)
    })

    watch(displayValue, text => {
      // incomplete or impossible: no value yet
      const iso = displayToIsoDateTime(text, order.value)
      if ((iso || null) !== (props.modelValue || null)) emit("update:modelValue", iso)
    })

    function applyDateTime() {
      if (!dateValue.value) return
      displayValue.value = isoDateTimeToDisplay(`${dateValue.value} ${timeValue.value || "00:00"}`, order.value)
    }

    const computedRules = computed(() => {
      const rules = []

      if (props.required) {
        rules.push(v => !!String(v || '').trim() || tdc("Required field"))
      }

      // something typed that is not a date and time in the language's order
      rules.push(v => !String(v || '').trim() || !!displayToIsoDateTime(v, order.value) || tdc("Invalid date"))

      // the field's own validators see the ISO value, as before
      for (const validator of props.validators) {
        rules.push(v => validator(displayToIsoDateTime(v, order.value)))
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
      pattern,
      calendarLocale,
      dateValue,
      timeValue,
      displayValue,
      applyDateTime,
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
.s-date-time {
  width: 100%;
}
</style>