<template>
  <q-scroll-area
  >

    <q-expansion-item
      v-for="App in User.Menus"
      :key="App"

      :class="
        $q.dark.isActive
          ? 'bg-dark-saas text-subtitle1 text-white'
          : 'text-subtitle1 text-primary'
      "

      class="full-width"
      :thumb-style="thumbStyle"
      :bar-style="barStyle"
      style="
        /* height: calc(500vh - 50px); */
        overflow-x:hidden;
      "

      :icon="App.icon"
      dense

      :label="tdc(App.menu)"

      :header-class="
        $q.dark.isActive
          ? 'bg-dark text-white'
          : 'bg-primary text-white'
      "

      :expand-icon-class="'text-white'"
    >

      <q-separator />

      <SubMenu :Dados="App.submenu" />

      <q-separator />

    </q-expansion-item>

  </q-scroll-area>
</template>
<script >


import { defineComponent } from 'vue'
import { tdc, toPlural} from '../boot/base'
import { useUserStore } from '../stores/UserStore'
import { useEntityTypeStore } from '../stores/EntityTypeStore'
import SubMenu from './SubMenu.vue'


export default defineComponent({
  name: 'LeftMenuSegundo',

  components: {
    SubMenu
  },
  setup () {
    const EntityType = useEntityTypeStore()
    const  User = useUserStore()
    return {
      EntityType,
      User,
      tdc,
      toPlural
    }
  },
  data () {
    return {

    }
  },
  computed: {

  },
  watch: {

  },
  mounted () {

  },
  methods: {

  }
})
</script>
