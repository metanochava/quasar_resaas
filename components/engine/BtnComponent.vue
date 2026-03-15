<template>
  <q-btn
    v-bind="attrs"

    :dense="attrs.dense ?? layout.button_dense"
    :round="attrs.round ?? layout.button_round"

    :flat="attrs.flat ?? layout.button_style === 'flat'"
    :outline="attrs.outline ?? layout.button_style === 'outline'"
    :unelevated="attrs.unelevated ?? layout.button_style === 'unelevated'"
    :push="attrs.push ?? layout.button_style === 'push'"

    :ripple="animation.button_animation === 'ripple'"

    :class="[
      attrs.class,
      animation.hover_effect ? 'hover-' + animation.hover_style : ''
    ]"

    :style="{
      borderRadius: layout.square
        ? '0px'
        : layout.rounded
        ? '16px'
        : '4px'
    }"

  >
    <slot/>
  </q-btn>
</template>

<script>
import { defineComponent, computed, useAttrs } from "vue"
import { UserStore } from "./../../stores/AuthStore"

export default defineComponent({

  name:"SBtn",
  inheritAttrs:false,

  setup(){

    const attrs = useAttrs()
    const User = UserStore()

    const layout = computed(()=>User.ps?.layout || {})
    const animation = computed(()=>User.ps?.animation || {})

    return{
      attrs,
      layout,
      animation
    }

  }

})
</script>