<template>
  <div >
  

    <q-expansion-item
      v-for="App in User.Menus"
      group="menu"
      default-opened
      :key="App"
      :class="
        $q.dark.isActive
          ? 'bg-dark-saas text-subtitle1 col-12'
          : 'bg-saass text-subtitle1  col-12 text-primary'
      "
      :icon="App.icon"
      dense
      :label="(tdc(App.menu))"
      :header-class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'"
      :expand-icon-class="$q.dark.isActive ? 'text-white' : 'text-white'"
    >
      <q-separator />
        <SubMenu :Dados="App.submenu" />
      <q-separator />
    </q-expansion-item>

  </div>
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
