<template>
  <q-layout view="hHh lpR fFf">
    <q-header bordered :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
      <q-toolbar class="no-wrap q-px-md">
        <HeaderBrand />
        <q-space />
        <HeaderDarkMode />
        <HeaderFullScreen />
        <HeaderLanguage />
        <Servicos />
      </q-toolbar>
    </q-header>

    <q-page-container class="">
      <router-view />
      
    </q-page-container>

    <Rodape />

    <q-page-scroller position="bottom-right" :scroll-offset="50" :offset="[18, -10]">
      <s-btn icon="keyboard_arrow_up" color="primary" round />
    </q-page-scroller>
  </q-layout>
</template>

<script>
/* -------------------- IMPORT STORES -------------------- */

import { useTipoEntidadeStore, useUserStore } from '../stores/AuthStore'

/* -------------------- IMPORT COMPONENTS -------------------- */
import HeaderBrand from '../components/header/HeaderBrand.vue'
import HeaderDarkMode from '../components/header/HeaderDarkMode.vue'
import HeaderLanguage from '../components/header/HeaderLanguage.vue'
import HeaderFullScreen from '../components/header/HeaderFullScreen.vue'
import Servicos from '../components/header/HeaderServices.vue'
import Rodape from '../components/footer/MainFooter.vue'


import { defineComponent } from 'vue'

export default defineComponent({
  components: {
    HeaderBrand,
    HeaderDarkMode,
    HeaderLanguage,
    HeaderFullScreen,
    Servicos,
    Rodape,
  },
  setup() {
    const Auth = useTipoEntidadeStore()
    const User = useUserStore()

    return {
      Auth,
      User,
    }
  },
  data() {
    return {}
  },
  computed:{

    ps(){
      return this.User.ps || {}
    }

  },

  async mounted(){

    await this.User.getSettings()

  },

  methods: {},
})
</script>

<style></style>
