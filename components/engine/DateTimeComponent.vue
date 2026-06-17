<template>
  <q-input
    v-bind="inputAttrs"
    v-model="displayValue"
    :label="translatedLabel"
    :placeholder="translatedPlaceholder"
    :hint="translatedHint"
    :error="hasError"
    :error-message="firstError"
    :rules="computedRules"
    :dense="attrs.dense ?? layout.input_dense"
    :outlined="attrs.outlined ?? layout.input_style === 'outlined'"
    :filled="attrs.filled ?? layout.input_style === 'filled'"
    :standout="attrs.standout ?? layout.input_style === 'standout'"
    :class="['s-datetime', attrs.class]"
    mask="DD-MM-YYYY"
    
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
              mask="DD-MM-YYYY"
            />

            <q-separator />

            <q-time
              v-model="timeValue"
              mask="HH:mm:ss"
              format24h
            />

            <div class="row justify-end q-pa-sm">
              <q-btn
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
import { tdc } from "../../boot/base"

export default defineComponent({
  name: "s-datetime",
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

    const localValue = ref(props.modelValue)

    const dateValue = ref("")
    const timeValue = ref("00:00:00")

    const hasError = ref(false)
    const firstError = ref("")

    watch(
      () => props.modelValue,
      v => {
        localValue.value = v

        if (v) {
          const parts = String(v).split(" ")

          dateValue.value = parts[0] || ""
          timeValue.value = parts[1] || "00:00:00"
        }
      },
      { immediate: true }
    )

    watch(localValue, v => {
      emit("update:modelValue", v)
    })

    const displayValue = computed({
      get() {
        return localValue.value
      },
      set(v) {
        localValue.value = v
      }
    })

    function applyDateTime() {
      if (!dateValue.value) return

      localValue.value =
        `${dateValue.value} ${timeValue.value || "00:00:00"}`
    }

    const computedRules = computed(() => {
      const rules = []

      if (props.required) {
        rules.push(v => !!v || tdc("Campo obrigatório"))
      }

      for (const validator of props.validators) {
        rules.push(validator)
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
      localValue,
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
.s-datetime {
  width: 100%;
}
</style>