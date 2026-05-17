
<template>

  <component v-if="component" :is="component" />
    <div v-for="i in 100" :key="i">
    Right Menu <br><br><br>
  </div>
  Right Menu <br>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMenuStore } from './../stores/MenuStore'

export default defineComponent({
  name: 'RightMenuResaas',

  setup() {
    const route = useRoute()
    const menu = useMenuStore()

    // 🔥 AUTO INIT (sem app precisar fazer nada)
    menu.init()

    const component = computed(() => {
      return menu.rightMenus?.[route.name] || null
    })

    return { component }
  }
})
</script>