<template>

  <q-input
    v-bind="attrs"

    :dense="attrs.dense ?? layout.input_dense"

    :outlined="attrs.outlined ?? layout.input_style === 'outlined'"
    :filled="attrs.filled ?? layout.input_style === 'filled'"
    :standout="attrs.standout ?? layout.input_style === 'standout'"

    :class="attrs.class"
    :style="{
      borderRadius: layout.square
        ? '0px'
        : layout.rounded
        ? '16px'
        : '4px'
    }"
  >
    <slot/>
  </q-input>

</template>

<script>

import { defineComponent, computed, useAttrs } from 'vue'
import { UserStore } from "./../../stores/AuthStore"

export default defineComponent({

  name:"SInput",
  inheritAttrs:false,

  setup(){

    const attrs = useAttrs()
    const User = UserStore()

    const layout = computed(()=>User.ps?.layout || {})

    return{
      attrs,
      layout
    }

  }

})
</script>