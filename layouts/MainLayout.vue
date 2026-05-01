<template>
  <q-layout view="hHh lpR fFf">
    <!-- -------------------- DIALOGS -------------------- -->
    <q-dialog v-model="permissoes" persistent>
      <!-- <UserPermissoes /> -->
    </q-dialog>

    <q-dialog v-model="pagepermissoes" persistent>
      <PagePermissoes />
    </q-dialog>

    <q-dialog v-model="User.Settings" full-width full-height>
      <DefinicoesLayout />
    </q-dialog>

    <q-dialog v-model="api_retorno_modal" full-width full-height>
      <s-card>
        <q-bar class="bg-primary text-white">
          <q-toolbar-title>
            <span class="text-weight-bold">API</span>
          </q-toolbar-title>
          <q-space />
          <s-btn dense flat icon="close" v-close-popup />
        </q-bar>

        <q-separator />

        <q-card-section class="scroll">
          <!-- <ApiRetorno /> -->
        </q-card-section>
      </s-card>
    </q-dialog>

    <!-- -------------------- HEADER -------------------- -->
    <q-header bordered :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
      <q-toolbar class="no-wrap q-px-md">
        <!-- Menu Esquerdo -->
        <s-btn dense flat round icon="menu" @click="User.toggleLeftTop()" />

        <!-- Marca (logo + nome) -->
        <HeaderBrand />

        <q-space />

        <!-- Dark Mode -->
        <HeaderDarkMode />

        <!-- Full Screen -->
        <HeaderFullScreen />

        <!-- Idiomas -->
        <HeaderLanguage />

        <!-- Serviços -->
        <Servicos />

        <!-- Notificações -->
        <Notificacoes /> &nbsp;

        <!-- User Menu -->
        <HeaderUser />

        <!-- Menu Direito -->
        <s-btn dense flat round icon="menu" @click="User.toggleRightTop()" />
      </q-toolbar>
      <TopMenu v-show="!User.LeftTop && !['authwelcome','welcome'].includes($route.name)"></TopMenu>
    </q-header>

    <!-- -------------------- LEFT DRAWER -------------------- -->
    <q-drawer
      v-model="User.LeftTop"
      show-if-above
      side="left"
      bordered
      class="q-pr-0"
      :width="300"
    >
      <q-scroll-area class="fit" :thumb-style="thumbStyle" :bar-style="barStyle">
        <LeftMenu />
      </q-scroll-area>
    </q-drawer>

    <!-- -------------------- RIGHT DRAWER -------------------- -->
    <q-drawer v-model="User.RightTop" side="right" bordered :width="300">
      <q-scroll-area class="fit" :thumb-style="thumbStyle" :bar-style="barStyle">
        <RightMenu />
      </q-scroll-area>
    </q-drawer>

    <!-- -------------------- PAGE CONTAINER -------------------- -->

    <q-page-container class="page-container full-height">

      <router-view v-slot="{ Component }">

        <transition
          v-if="ps.animation?.enable_animations"
          :name="ps.animation?.page_transition || 'fade'"
          mode="out-in"
          :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-saas-premium'"
        >
          <component :is="Component" class="page-content"/>
        </transition>

        <component v-else :is="Component" class="page-content"/>

      </router-view>
    </q-page-container>


    <!-- -------------------- RODAPÉ -------------------- -->

    <Rodape />

    <!-- -------------------- PAGE SCROLLER -------------------- -->
    <q-page-scroller position="bottom-right" :scroll-offset="50" :offset="[18, -10]">
      <s-btn icon="keyboard_arrow_up" color="primary" round />
    </q-page-scroller>
  </q-layout>
</template>

<script>
/* -------------------- IMPORT STORES -------------------- */

import { useUserStore } from '../stores/UserStore'
import { useTipoEntidadeStore } from '../stores/TipoEntidadeStore'
import { useEntidadeStore } from '../stores/EntidadeStore'

/* -------------------- IMPORT COMPONENTS -------------------- */
import HeaderBrand from '../components/header/HeaderBrand.vue'
import HeaderUser from '../components/header/HeaderUser.vue'
import HeaderDarkMode from '../components/header/HeaderDarkMode.vue'
import HeaderLanguage from '../components/header/HeaderLanguage.vue'
import HeaderFullScreen from '../components/header/HeaderFullScreen.vue'
import Servicos from '../components/header/HeaderServices.vue'
import Notificacoes from '../components/header/HeaderNotifications.vue'

import LeftMenu from '../components/LeftMenu.vue'
import TopMenu from '../components/TopMenu.vue'
import RightMenu from '../components/RightMenu.vue'
import Rodape from '../components/footer/MainFooter.vue'

import { defineComponent } from 'vue'
import { barStyle, thumbStyle } from '../boot/app'
import UserPermissioes from '../components/UserPermissioes.vue'
import PagePermissoes from '../components/PagePermissoes.vue'
import DefinicoesLayout from '../components/DefinicoesLayout.vue'

export default defineComponent({
  components: {
    HeaderBrand,
    HeaderUser,
    HeaderDarkMode,
    HeaderLanguage,
    HeaderFullScreen,
    Servicos,
    Notificacoes,
    LeftMenu,
    TopMenu,
    RightMenu,
    Rodape,
    UserPermissioes,
    PagePermissoes,
    DefinicoesLayout
  },

  setup() {
    const TipoEntidade = useTipoEntidadeStore()
    const Entidade = useEntidadeStore()
    const User = useUserStore()

    return {
      TipoEntidade,
      Entidade,
      User,
      barStyle,
      thumbStyle
    }
  },

  data() {
    return {
      permissoes: false,
      pagepermissoes: false,
      api_retorno_modal: false,
      visibilidadeLoad: false,
      comments: false,
      miniState: false,
    }
  },

  computed:{
    ps(){
      return this.User.ps || {}
    }
  },

  // 🔥 WATCH GLOBAL (rota + UI)
  watch: {
    $route(to) {
      const ignore = ['authwelcome','welcome','login']

      if (!ignore.includes(to.name)) {
        localStorage.setItem('last_route', to.fullPath)
      }
    },

    // 🔥 persist menu
    'User.LeftTop'(val) {
      localStorage.setItem('ui_left_menu', JSON.stringify(val))
    },

    'User.RightTop'(val) {
      localStorage.setItem('ui_right_menu', JSON.stringify(val))
    }
  },

  async mounted(){

    // 🔥 RESTORE USER + SETTINGS (teu código original)
    if(this.User){
      this.User?.loadFromStorage()
      await this.Entidade.getLayoutSettings(this.User?.Entidade?.id)
    }

    // 🔥 RESTORE ROTA
    const lastRoute = localStorage.getItem('last_route')
    if (lastRoute && lastRoute !== this.$route.fullPath) {
      this.$router.replace(lastRoute)
    }

    // 🔥 RESTORE MENUS
    const left = localStorage.getItem('ui_left_menu')
    const right = localStorage.getItem('ui_right_menu')

    if (left !== null) this.User.LeftTop = JSON.parse(left)
    if (right !== null) this.User.RightTop = JSON.parse(right)

    // 🔥 RESTORE SCROLL
    const scroll = localStorage.getItem('scroll_position')
    if (scroll) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(scroll))
      }, 100)
    }

    // 🔥 teu comportamento original
    if (['authwelcome','welcome'].includes(this.$route.name)){
      this.User.LeftTop = false
    }

    // 🔥 SAVE SCROLL AO SAIR
    window.addEventListener('beforeunload', () => {
      localStorage.setItem('scroll_position', window.scrollY)
    })
  },

  methods: {}
})
</script>

<style>



html, body, #q-app {
  height: 100%;
  /* overflow: hidden; 🔥 trava scroll global */
}

/* 🔥 container principal */
.page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 🔥 conteúdo da página */
/* .page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
} */

.page-content {
   height: 100%;
  flex: 1;
  overflow-y: auto;  /* 🔥 AQUI VOLTA O SCROLL */
}

</style>
