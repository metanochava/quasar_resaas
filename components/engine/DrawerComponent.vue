<template>

  <q-drawer
    v-bind="attrs"

    :mini="attrs.mini ?? layout.sidebar_mini"
    :width="attrs.width ?? layout.sidebar_width"

  >
    <slot/>
  </q-drawer>

</template>

<script>

import { defineComponent, computed, useAttrs } from 'vue'
import { useUserStore } from "./../../stores/UserStore"

export default defineComponent({

  name:"s-drawer",
  inheritAttrs:false,

  setup(){

    const attrs = useAttrs()
    const User = useUserStore()

    const layout = computed(()=>User.ps?.layout || {})

    return{
      attrs,
      layout
    }

  }

})
</script>
