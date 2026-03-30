<script>
import { defineComponent, computed } from 'vue'
import { useRoute } from 'vue-router'
import { MenuStore } from './../stores/MenuStore'

export default defineComponent({
  name: 'RightMenu',

  setup() {
    const route = useRoute()
    const menu = MenuStore()

    // 🔥 AUTO INIT (sem app precisar fazer nada)
    menu.init()

    const component = computed(() => {
      return menu.rightMenus?.[route.name] || null
    })

    return { component }
  }
})
</script>

<template>
  <component v-if="component" :is="component" />
</template>