<template>

  <q-card
    v-bind="attrs"

    :flat="attrs.flat ?? false"
    :bordered="attrs.bordered ?? false"

    :style="{
      borderRadius: layout.rounded ? '16px' : '4px'
    }"

    :class="[
      attrs.class,
      cardAnimation ? 'anim-' + cardAnimation : ''
    ]"

  >
    <slot/>
  </q-card>

</template>

<script>

import { defineComponent, computed, useAttrs } from 'vue'
import { useUserStore } from "../../stores/UserStore"
import { unwrapChoice } from "../../theme/unwrapChoice.js"

// LayoutSetting já não tem card_flat/card_bordered/square - só
// `rounded` (django_resaas.saas.models.layout_setting.LayoutSetting) -
// o raio segue o mesmo valor que theme/applyLayout.js aplica
// globalmente em --s-radius.
export default defineComponent({

  name:"s-card",
  inheritAttrs:false,

  setup(){

    const attrs = useAttrs()
    const User = useUserStore()

    const layout = computed(()=>User.ps?.layout || {})
    const animation = computed(()=>User.ps?.animation || {})
    const cardAnimation = computed(() => unwrapChoice(animation.value.card_animation))

    return{
      attrs,
      layout,
      animation,
      cardAnimation
    }

  }

})
</script>
