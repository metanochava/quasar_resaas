<template>

  <q-card
    v-bind="attrs"

    :flat="attrs.flat ?? layout.card_flat"
    :bordered="attrs.bordered ?? layout.card_bordered"

    :style="{
      borderRadius: layout.square
        ? '0px'
        : layout.rounded
        ? '16px'
        : '4px'
    }"

    :class="[
      attrs.class,
      animation.card_animation ? 'anim-' + animation.card_animation : ''
    ]"

  >
    <slot/>
  </q-card>

</template>

<script>

import { defineComponent, computed, useAttrs } from 'vue'
import { UserStore } from "./../../stores/AuthStore"

export default defineComponent({

  name:"SCard",
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