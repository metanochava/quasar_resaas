<template>
  <q-toggle
    v-model="localValue"
    :label="translatedLabel"
    :dense="attrs.dense ?? layout.input_dense"
  />
</template>

<script>
import { defineComponent, computed, ref, watch, useAttrs } from "vue"
import { useUserStore } from "../../stores/UserStore"
import { tdc } from "../../boot/base"

export default defineComponent({
  name: "s-switch",
  inheritAttrs: false,
  props: {
    modelValue: Boolean,
    label: String
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

    return { attrs, layout, localValue, translatedLabel }
  }
})
</script>
