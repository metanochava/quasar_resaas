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
import { UserStore } from "./../../stores/AuthStore"

export default defineComponent({

  name:"SDrawer",
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