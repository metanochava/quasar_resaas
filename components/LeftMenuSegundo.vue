<template>

  <div class="bg-grey" style="width: 300px; margin-top: 100px;  margin-left: -3px;  height: calc(100vh - 180px);">
    <q-scroll-area
      class="fit"
      :thumb-style="thumbStyle"
      :bar-style="barStyle"
    > 

      <q-list bordered class="rounded-borders full-width">
        <q-expansion-item
          v-for="App in User.Menus"
          :key="App"

          :class="
            $q.dark.isActive
              ? 'bg-dark-saas text-subtitle1 text-white'
              : 'text-subtitle1 text-primary'
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

      </q-list>
    </q-scroll-area>

  </div>
</template>
<script >


import { defineComponent, h } from 'vue'
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
