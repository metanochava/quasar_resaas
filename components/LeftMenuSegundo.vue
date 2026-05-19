<template>
  <div >
  
    <s-card
      square
      flat
      v-for="App in User.Menus"
      :key="App"
      style="padding: 0px; "
      
    >
      <q-expansion-item
        group="menu"
        default-opened
        :class="
          $q.dark.isActive
            ? 'bg-dark-saas text-subtitle1'
            : 'bg-saass text-subtitle1 text-primary'
        "
        :icon="App.icon"
        dense
        :label="(tdc(App.menu))"
        :header-class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'"
        :expand-icon-class="$q.dark.isActive ? 'text-white' : 'text-white'"
      >
        <q-separator />
          <SubMenu :Dados="App.submenu" />
          <SubMenu :Dados="App.submenu" />
        <q-separator />
      </q-expansion-item>
    </s-card>
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
