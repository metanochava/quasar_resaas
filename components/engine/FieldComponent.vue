<template>
  <component
    :is="componentName"
    v-model="localValue"
    v-bind="componentProps"
  />
</template>

<script>
import { defineComponent, computed } from "vue"
import { guessComponent, resolveRules } from "../../utils/schema"

export default defineComponent({
  name: "FieldComponent",

  props: {
    modelValue: [String, Number, Boolean, Object, Array, File, null],
    field: {
      type: Object,
      required: true
    }
  },

  emits: ["update:modelValue"],

  setup(props, { emit }) {
    const localValue = computed({
      get() {
        return props.modelValue
      },
      set(v) {
        emit("update:modelValue", v)
      }
    })

    const componentName = computed(() => guessComponent(props.field))

    // field.props already carries every backend-resolved UI prop
    // (accept/multiple/maxSize, options, min/max, ...) - label/rules
    // are filled in here only as a fallback, for a hand-built field
    // object that skipped buildFormFromSchema() and so never got them
    // computed (real schema fields already carry both inside .props).
    const componentProps = computed(() => {
      const base = { ...(props.field.props || {}) }

      if (base.label === undefined) {
        base.label = props.field.label || props.field.verbose_name || props.field.name
      }

      if (base.rules === undefined && Array.isArray(props.field.rules)) {
        base.rules = resolveRules(props.field.rules)
      }

      return base
    })

    return {
      localValue,
      componentName,
      componentProps
    }
  }
})
</script>
