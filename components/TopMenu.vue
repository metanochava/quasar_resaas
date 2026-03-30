<template>
  <q-bar >
    <div class="q-pa-sm q-pl-md  items-center text-body1">
      <div class="q-ml-md cursor-pointer non-selectable">
        <q-item clickable dense replace v-ripple
          :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'"  >
          <q-item-section avatar @click="$router.push({ name: 'home'})" >
            <q-icon  name="home" />
          </q-item-section>
          <q-item-section class="text-body1" @click="$router.push({ name: 'home'})" >{{ tdc('Casa') }}</q-item-section>
          <q-item-section side>
            <s-btn
            round dense flat
            :icon="'settings'" :class="$q.dark.isActive ? 'text-white' : 'text-white'"
            @click="User.toggleSettings()"
          >
            <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">{{ tdc('Configurações') }}</q-tooltip>
          </s-btn>
          </q-item-section>
        </q-item>
      </div>
    </div>

    <TopMenuSegundo ></TopMenuSegundo>
    <q-space />
    <SearchMenu  :size="'180'" style="margin-right: 30px;"/>


  </q-bar>
</template>
<script >

import TopMenuSegundo from './TopMenuSegundo.vue'
import { defineComponent } from 'vue'
import { tdc } from '../boot/base'
import { useUserStore } from '../stores/UserStore'
import SearchMenu from './SearchMenu.vue';

export default defineComponent({
  name: 'TopMenu',
  components: {
    TopMenuSegundo,
    SearchMenu
  },
  setup () {
    const User = useUserStore()
    return {
      User
    }
  },

  data () {
    return {
      tdc: tdc,
    }
  },

  created () {
  },
  computed: {
  },

  mounted () {

  },

  methods: {

  }
})
</script>
