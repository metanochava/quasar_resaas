<template>
  <div class="col-12" style="margin-top: 2px;">
    <search-menu :size="'300'" />
    <s-card
      square
      flat
      v-for="App in User.Menus"
      :key="App"
      style="padding: 0px"
      :class="
          $q.dark.isActive
            ? ' col-xs-12 col-md-12 col-lg-12 q-bt-md'
            : 'bg-saas   text-primary  col-xs-12 col-md-12 col-lg-12 q-bt-md'"
    >
      <q-expansion-item
        group="menu"
        default-opened
        :class="
          $q.dark.isActive
            ? 'bg-dark-saas text-subtitle1'
            : 'bg-transparent text-subtitle1 text-primary'
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
          <q-page-scroller position="bottom-right" :scroll-offset="50" :offset="[18, -10]">
      <s-btn icon="keyboard_arrow_up" color="primary"  />
    </q-page-scroller>
    </s-card>
  </div>
</template>



<style scoped>
  
</style>
<script >


import { defineComponent } from 'vue'
import { tdc, toPlural} from '../boot/base'
import { useUserStore } from '../stores/UserStore'
import { useEntityTypeStore } from '../stores/EntityTypeStore'
import SearchMenu from './SearchMenu.vue'
import SubMenu from './SubMenu.vue'


export default defineComponent({
  name: 'LeftMenuSegundo',

  components: {
    SearchMenu,
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
