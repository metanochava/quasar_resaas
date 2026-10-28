<template>
  <q-layout view="hHh lpR fFf" >
    <q-header bordered :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
      <q-toolbar class="no-wrap q-px-md">
        <HeaderBrand />
        <q-space />

        <HeaderDarkMode class="gt-xs" />
        <HeaderFullScreen class="gt-xs" />
        <HeaderLanguage class="gt-xs" />
        <Servicos />

        <Notificacoes v-if="signedIn"/>
        <HeaderUser />
      </q-toolbar>
    </q-header>

    <!-- a very translucent wash of the theme's colours (Entity's when signed
         in with one, else the host's EntityType - see mounted) -->
    <q-page-container class="auth-bg" :class="{ 'auth-bg--dark text-white': $q.dark.isActive }">
      <router-view />
    </q-page-container>

    <Rodape />

    <q-page-scroller position="bottom-right" :scroll-offset="50" :offset="[18, -10]">
      <s-btn icon="keyboard_arrow_up" color="primary"  />
    </q-page-scroller>
  </q-layout>
</template>

<script>
/* -------------------- IMPORT STORES -------------------- */

import { useUserStore } from '../stores/UserStore'
import { useEntityTypeStore } from '../stores/EntityTypeStore'
import { useBrandFavicon } from '../composables/useBrandIcon'
import { useEntityStore } from '../stores/EntityStore'
import { findEntityType } from '../utils/entityTypeHost'

/* -------------------- IMPORT COMPONENTS -------------------- */
import HeaderBrand from '../components/header/HeaderBrand.vue'
import HeaderDarkMode from '../components/header/HeaderDarkMode.vue'
import HeaderLanguage from '../components/header/HeaderLanguage.vue'
import HeaderFullScreen from '../components/header/HeaderFullScreen.vue'
import Servicos from '../components/header/HeaderServices.vue'
import Rodape from '../components/footer/MainFooter.vue'
import Notificacoes from '../components/header/HeaderNotifications.vue'
import HeaderUser from '../components/header/HeaderUser.vue'


import { defineComponent } from 'vue'

export default defineComponent({
  components: {
    HeaderBrand,
    HeaderDarkMode,
    HeaderLanguage,
    HeaderFullScreen,
    Servicos,
    Rodape,
    Notificacoes,
    HeaderUser,
  },
  setup() {
    // the browser tab icon: the active Entity's logo, else its EntityType icon
    useBrandFavicon()
    const EntityType = useEntityTypeStore()
    const Entity = useEntityStore()
    const User = useUserStore()

    return {
      EntityType,
      Entity,
      User,
    }
  },
  data() {
    return {}
  },
  
  computed:{
    ps(){
      return this.User.ps || {}
    },
    signedIn () {
      return this.User.isSignedIn()
    }
  },

  // The look of the auth pages (login, register, forgot password, the site):
  // the Entity's theme when signed in with one (its endpoints need a
  // session), else the theme of this host's EntityType (PUBLIC reads).
  async mounted(){
    this.User.loadFromStorage()
    const signedIn = this.User.isSignedIn()
    if (signedIn && this.User.Entity?.id) {
      await this.Entity.getLayoutSettings(this.User.Entity.id)
      return
    }
    const entityType = await this.hostEntityType()
    if (entityType) {
      this.User.EntityType = entityType
      await this.EntityType.getLayoutSettings(entityType.id, { force: true })
    }
  },

  methods: {
    async hostEntityType () {
      try {
        if (!this.EntityType.rows?.length) await this.EntityType.getEntityTypes()
        return findEntityType(this.EntityType.rows || []) || this.User.EntityType || null
      } catch (e) {
        return this.User.EntityType || null
      }
    },
  },
})
</script>

<style>
.auth-bg {
  background:
    radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--q-primary) 10%, transparent) 0%, transparent 45%),
    radial-gradient(circle at 88% 82%, color-mix(in srgb, var(--q-secondary, var(--q-primary)) 9%, transparent) 0%, transparent 45%),
    color-mix(in srgb, var(--q-primary) 4%, #ffffff);
}
.auth-bg--dark {
  background:
    radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--q-primary) 16%, transparent) 0%, transparent 45%),
    radial-gradient(circle at 88% 82%, color-mix(in srgb, var(--q-secondary, var(--q-primary)) 12%, transparent) 0%, transparent 45%),
    var(--q-dark-page, #121212);
}
</style>
