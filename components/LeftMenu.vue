
<template>
  <s-card  square flat :class="$q.dark.isActive ? 'bg-transparent  fixed-top   header-fixed' : 'bg-transparent   fixed-top header-fixed' ">
    <q-item 
      class="row items-center justify-between  "
      :class="$q.dark.isActive
        ? 'bg-dark text-white'
        : 'bg-primary text-white'"
    >

      <!-- 🔥 ESQUERDA -->
      <div class="row items-center">

        <s-btn
          flat
          round
          v-show="!User.ps?.layout?.menu_rtl "
          dense
          icon="home"
          @click="$router.push({ name: 'home' })"
        />

        <s-btn
          round
          dense
          v-show="User.ps?.layout?.menu_rtl "
          flat
          :icon="User.ps?.layout?.menu_rtl ? 'format_textdirection_r_to_l' : 'format_textdirection_l_to_r'"
          class="text-white"
          @click="User.toggleMenuRtl()"
        >
          <s-tooltip>
            {{ tdc('Toggle menu side') }}
          </s-tooltip>
        </s-btn>

      </div>

      <!-- 🔥 CENTRO -->
      <div class=" col row items-center">
        <GroupSelector />
      </div>

      <!-- 🔥 DIREITA -->
      <div class="row items-center">

        <s-btn
          flat
          round
          dense
          v-show="User.ps?.layout?.menu_rtl "
          icon="home"
          @click="$router.push({ name: 'home' })"
        />

        <s-btn
          round
          dense
          flat
          v-show="!User.ps?.layout?.menu_rtl "
          :icon="User.ps?.layout?.menu_rtl ? 'format_textdirection_r_to_l' : 'format_textdirection_l_to_r'"
          class="text-white"
          @click="User.toggleMenuRtl()"
        >
          <s-tooltip>
            {{ tdc('Toggle menu side') }}
          </s-tooltip>
        </s-btn>
      </div>
    </q-item>
    <div class="q-pa-sm">
      <search-menu size="100%" />
    </div>
  </s-card>

  <LeftMenuSegundo  style="margin-top:95px; margin-bottom:0px" />

  <!-- 🔥 SIDEBAR MINI TOGGLE - fixed at the bottom of the drawer, same
       reasoning as .header-fixed above but pinned to the bottom instead,
       so it stays put while LeftMenuSegundo's own nav list scrolls. -->
  <s-card square flat class="footer-fixed" :class="$q.dark.isActive ? 'bg-transparent' : 'bg-transparent'">
    <q-item class="row items-center justify-center">
      <s-btn
        flat
        round
        dense
        :icon="isSidebarMini ? 'chevron_right' : 'chevron_left'"
        class="text-white"
        @click="User.toggleSidebarMini()"
      >
        <s-tooltip>
          {{ tdc(isSidebarMini ? 'Expand sidebar' : 'Collapse sidebar') }}
        </s-tooltip>
      </s-btn>
    </q-item>
  </s-card>

</template>
<script >

import LeftMenuSegundo from './LeftMenuSegundo.vue'
import { barStyle, thumbStyle } from '../services/app'
import SearchMenu from './SearchMenu.vue'

import { defineComponent } from 'vue'
import { tdc } from '../services/translation'
import { useUserStore } from '../stores/UserStore'
import { useGroupStore } from '../stores/GroupStore.js'
import GroupSelector from './GroupSelector.vue'


export default defineComponent({
  components: {
    LeftMenuSegundo,
    SearchMenu,
    GroupSelector
  },
  setup () {
    const User = useUserStore()
    const Group = useGroupStore()
    return {
      User,
      barStyle,
      thumbStyle,
      Group
    }
  },

  data () {
    return {
      tdc: tdc,
      active: null,
    }
  },

  created () {
  },
  computed: {
    isSidebarMini () {
      return !!this.User.ps?.layout?.sidebar?.mini
    }
  },

  mounted () {

  },

  methods: {

  }
})
</script>

<style >
.search-fixed {
    position: fixed;
    z-index: 9;
  }
.header-fixed {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
}
.footer-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
}
</style>