<template>
  <component
    :is="componentName"
    v-model="localValue"
    v-bind="componentProps"
  />
</template>

<script>
import { defineComponent, computed } from "vue"
import SInput from "./InputComponent.vue"
import SSelect from "./SelectComponent.vue"
import SUpload from "./UploadComponent.vue"
import SCheckbox from "./CheckBoxComponent.vue"
import SSwitch from "./SwitchComponent.vue"

export default defineComponent({
  name: "s-field",

  components: {
    SInput,
    SSelect,
    SUpload,
    SCheckbox,
    SSwitch
  },

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

    const componentName = computed(() => {
      return props.field.component || "s-input"
    })

    const componentProps = computed(() => ({
      ...props.field
    }))

    return {
      localValue,
      componentName,
      componentProps
    }
  }
})
</script>