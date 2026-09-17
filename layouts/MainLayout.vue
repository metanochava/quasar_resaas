<template>
  <q-layout view="hHh LpR fFf" > 
    <!-- -------------------- DIALOGS -------------------- -->
    <q-dialog v-model="permissoes" persistent>
      <!-- <UserPermissoes /> -->
    </q-dialog>

    <q-dialog v-model="pagepermissoes" persistent>
      <PagePermissoes />
    </q-dialog>

    <!-- logged-in user's own account (profile/security) -->
    <q-dialog v-model="User.Settings" full-width full-height>
      <UserAccountModal />
    </q-dialog>

    <!-- entity-wide layout/branding (Theme Studio) -->
    <q-dialog v-model="User.ThemeStudio" full-width full-height>
      <s-card class="q-pa-md">
        <ThemeStudioEngine
          v-model:scope="themeStudioScope"
          allow-scope-select
          :entity-type="EntityType.row"
          :entity="User.Entity"
          :user="User.data"
          :entity-type-store="EntityType"
          :entity-store="Entity"
          :user-store="User"
          :themes="Theme.rows"
          :layouts="LayoutSetting.rows"
          @saved="Entity.getLayoutSettings(User.Entity?.id)"
        />
      </s-card>
    </q-dialog>

    <q-dialog v-model="api_retorno_modal" full-width full-height>
      <s-card>
        <q-bar :class="$q.dark.isActive ? 'bg-dark text-white' : ' bg-primary text-white'">
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
    <q-header
      bordered
      :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'"
      :style="headerStyle"
    >
      <div v-if="headerOverlayStyle" :style="headerOverlayStyle" />
      <q-toolbar
        class="no-wrap q-px-md"
        :class="{ 'menu-ltr_': !menuRtl, 'menu-rtl_': menuRtl }"
      >
        <!-- Menu Esquerdo -->
        <s-btn dense flat round icon="menu" @click="User.toggleLeftTop()" />

        <!-- Marca (logo + name) -->
        <HeaderBrand />

        <q-space />

        <!-- Dark Mode -->
        <HeaderDarkMode />

        <!-- Full Screen -->
        <HeaderFullScreen />

        <!-- Languages -->
        <HeaderLanguage />

        <!-- Services -->
        <Servicos />

        <!-- Notifications -->
        <Notificacoes /> &nbsp;

        <!-- User Menu -->
        <HeaderUser />

        <!-- Menu Direito -->
        <s-btn dense flat round icon="menu" @click="User.toggleRightTop()" />
      </q-toolbar>
      <q-bar  v-show="!User.LeftTop && !['authwelcome','welcome'].includes($route.name)">
        <TopMenu ></TopMenu>
      </q-bar>
    </q-header>

    <!-- -------------------- LEFT DRAWER -------------------- -->
    <!-- menu_rtl (LayoutSetting, User > Entity > EntityType) troca o
         lado do menu - ver User.ps.layout.menu_rtl / menuRtl abaixo.
         sidebar_mini/sidebar_mini_width (LayoutSetting.to_dict()'s
         nested "sidebar" object, saas/models/layout_setting.py) drive
         QDrawer's own native mini-drawer mode (icon-only rail) - a
         tenant-wide layout choice, same category as menu_rtl/
         header_position/content_width, not a personal runtime toggle
         (no toggle_sidebar_mini action exists server-side, unlike
         toggle_menu_rtl). LeftMenuSegundo.vue reads the same
         User.ps.layout.sidebar to match its own width and hide labels
         when mini, since QDrawer's mini mode only resizes the drawer
         itself, not arbitrary content inside it. -->
    <q-drawer
      v-model="User.LeftTop"
      :side="menuRtl ? 'right' : 'left'"
      :width="User.ps?.layout?.sidebar?.width || 300"
      :mini="!!User.ps?.layout?.sidebar?.mini"
      :mini-width="User.ps?.layout?.sidebar?.mini_width || 70"
      :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-saas bg-primary '"
    >
      <q-bar class="full-height q-pa-0" >
        <LeftMenu />
      </q-bar>
    </q-drawer>


    <q-drawer v-model="User.RightTop" :side="menuRtl ? 'left' : 'right'"  :width="User.ps?.layout?.sidebar?.width || 300" :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-saas bg-primary '">
      <q-bar class="full-height q-pa-0">
        <q-scroll-area class="fit q-pa-0" :thumb-style="thumbStyle" :bar-style="barStyle">
          <RightMenu />
        </q-scroll-area>
      </q-bar>
    </q-drawer>

    <!-- -------------------- PAGE CONTAINER -------------------- -->

   <q-page-container
      class="page-container full-height"
      :class="$q.dark.isActive ? 'bg-dark-saas text-white' : 'bg-saass'"
    >

      <router-view v-slot="{ Component }">

        <transition
          v-if="ps.animation?.enable_animations"
          :name="ps.animation?.page_transition?.value || 'fade'"
          mode="out-in"
        >
          <component :is="Component" />
        </transition>

        <component v-else :is="Component" />

      </router-view>

    </q-page-container>


    <!-- -------------------- FOOTER -------------------- -->

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
import { useEntityTypeStore } from '../stores/EntityTypeStore'
import { useEntityStore } from '../stores/EntityStore'
import { useThemeStore } from '../stores/ThemeStore'
import { useLayoutSettingStore } from '../stores/LayoutSettingStore'

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
import { barStyle, thumbStyle } from '../services/app'
import { surfaceToStyle, surfaceOverlayStyle } from '../theme/surfaceToStyle'
import UserPermissioes from '../components/UserPermissioes.vue'
import PagePermissoes from '../components/PagePermissoes.vue'
import { ThemeStudioEngine } from '../components/theme/index.js'
import UserAccountModal from '../components/UserAccountModal.vue'

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
    ThemeStudioEngine,
    UserAccountModal
  },

  setup() {
    const EntityType = useEntityTypeStore()
    const Entity = useEntityStore()
    const User = useUserStore()
    const Theme = useThemeStore()
    const LayoutSetting = useLayoutSettingStore()

    return {
      EntityType,
      Entity,
      User,
      Theme,
      LayoutSetting,
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
      themeStudioScope: 'entity',
      miniState: false,
    }
  },

  computed:{
    ps(){
      return this.User.ps || {}
    },

    // LayoutSetting.menu_rtl, resolvido User > Entity > EntityType
    // (User.get_effective_layout(), ver /me/'s ui_config.layout em
    // User.ps.layout - nunca UserThemeOverride nem outro campo
    // paralelo). Troca o lado dos drawers e a direcção do header.
    menuRtl(){
      return !!this.ps.layout?.menu_rtl
    },

    // Header personalizado - fonte única de aparência de área agora é
    // theme.surfaces.header (ThemeSurface), já resolvido User > Entity
    // > EntityType em User.ps.theme (HeaderVisualFields/
    // InterfaceConfigService foram removidos - CLAUDE.md secção 5/21).
    // Antes do primeiro /me/ responder, ps.theme ainda não existe - a
    // classe bg-primary/bg-dark do template cobre esse instante.
    headerStyle(){
      const style = surfaceToStyle(this.ps.theme?.surfaces?.header)

      if (this.ps.theme?.header_text) {
        style.color = this.ps.theme.header_text
      }

      return style
    },

    headerOverlayStyle(){
      return surfaceOverlayStyle(this.ps.theme?.surfaces?.header)
    }
  },

  // 🔥 WATCH GLOBAL (route + UI)
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
    },

    // 🔥 Theme Studio: carrega os catálogos (Theme/LayoutSetting) e o
    // EntityType actual só quando o dialog abre.
    //
    // User.EntityType (singular) nunca é preenchido em lado nenhum da
    // store (só User.EntityTypes, a lista, é) - o EntityType real da
    // Entity actual tem de vir de EntityType.getById(), a partir do
    // FK `entity_type` que já vem em User.Entity (serializado como
    // {id, value, label} - ver RepresentationMixin no backend, não com
    // os campos de tema já expandidos).
    //
    // typography/animation ainda não têm endpoint de listagem no
    // backend actual (ver stores/ThemeStore.js e
    // stores/LayoutSettingStore.js).
    async 'User.ThemeStudio'(val) {
      if (!val) return

      try {
        const entityTypeRef = this.User.Entity?.entity_type
        const entityTypeId = entityTypeRef?.id || entityTypeRef?.value || entityTypeRef

        await Promise.all([
          this.Theme.loadData({ page_size: 100 }),
          this.LayoutSetting.loadData({ page_size: 100 }),
          entityTypeId ? this.EntityType.getById(entityTypeId) : Promise.resolve()
        ])
      } catch (e) {
        console.error('ThemeStudio catalog load error', e)
      }
    }
  },

  // Restoring User.Entity/Branch/Group (localStorage) has to happen
  // before any CHILD route component mounts, not after - Vue mounts
  // children bottom-up and only then runs the parent's own mounted(),
  // so putting loadFromStorage() there (as it was) meant a child like
  // HomeDashboards.vue (mounted at '/home') read a still-empty
  // User.Entity on a fresh page load. Works fine navigating to '/home' a
  // second time within the same SPA session (MainLayout itself doesn't
  // remount, so loadFromStorage() already ran once) - only breaks on a
  // hard reload. beforeMount() still runs after MainLayout's OWN setup,
  // but before any of its children mount.
  //
  // The X-RESAAS-Context token itself (services/tenantContext.js) lives
  // in SEPARATE sessionStorage, can be missing/stale independently of
  // Entity/Branch/Group, and loadFromStorage() only ever re-reads
  // whatever's already there - it never re-establishes it. Re-fetching
  // it (User.refreshResaasContext(), the same call Group.select() makes
  // when switching profile) deliberately does NOT happen here: it
  // belongs to whichever component actually needs fresh data gated by
  // it, sequenced right before that component's own fetch (see
  // HomeDashboards.vue/DashboardRenderer.vue's onMounted) - triggering
  // it here too raced a SECOND, independent refresh + list-fetch
  // against HomeDashboards.vue's own, and whichever response resolved
  // last (not necessarily the correct one) won.
  beforeMount() {
    this.User?.loadFromStorage()
  },

  async mounted(){
    // 🔥 RESTORE USER + SETTINGS (your original code)
    if(this.User){
      // The left/top navigation menu (User.Menus/AllMenus) starts empty
      // ([]) and User.getMenus() was previously only ever called
      // reactively (GroupStore.js's own group-switch flow, a couple of
      // one-off pages) - never once on a normal app boot, so the menu
      // was empty on every fresh page load until the user happened to
      // switch group/profile. The backend action itself
      // (UserAPIView.menus(), saas/data/user/views/user.py) also 200s
      // an empty [] outright when request.entity_type_id is missing -
      // it reads the SAME X-RESAAS-Context-derived tenant context as
      // the dashboard endpoints, so this needs a fresh
      // refreshResaasContext() first too (see HomeDashboards.vue's own
      // onMounted for the identical reasoning re: sessionStorage vs
      // localStorage). This is a separate refresh call from the
      // dashboard's own (not shared/reused) - each writes to unrelated
      // state (User.Menus here, Dashboard.dashboards there), so there's
      // no race between them like there would be if two call sites
      // wrote the SAME state from possibly-stale vs. fresh responses.
      await this.User.refreshResaasContext().catch(() => {})

      if (this.User.data?.id) {
        await this.User.getMenus()
      }

      await this.Entity.getLayoutSettings(this.User?.Entity?.id)
    }

    // 🔥 RESTORE ROUTE
    const lastRoute = localStorage.getItem('last_route')
    if (lastRoute && lastRoute !== this.$route.fullPath) {
      this.$router.replace(lastRoute)
    }



    // 🔥 RESTORE SCROLL
    const scroll = localStorage.getItem('scroll_position')
    if (scroll) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(scroll))
      }, 100)
    }

    // 🔥 your original behavior
    if (['authwelcome','welcome'].includes(this.$route.name)){
      this.User.LeftTop = false
    }else{
      // 🔥 RESTORE MENUS
      const left = localStorage.getItem('ui_left_menu')
      const right = localStorage.getItem('ui_right_menu')

      if (left !== null) this.User.LeftTop = JSON.parse(left)
      if (right !== null) this.User.RightTop = JSON.parse(right)
    }

    // 🔥 SAVE SCROLL ON EXIT
    window.addEventListener('beforeunload', () => {
      localStorage.setItem('scroll_position', window.scrollY)
    })
  },

  methods: {}
})
</script>

<style>

/* menu_rtl (LayoutSetting) - troca a direcção do header; os drawers
   trocam de lado via :side em vez de CSS (ver menuRtl no script). */
.menu-rtl {
  flex-direction: row-reverse;
}

.menu-ltr {
  flex-direction: row;
}



html, body, #q-app {
  height: 100%;
  /* overflow: hidden; 🔥 locks global scroll */
}

/* 🔥 main container */
.page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 🔥 page content */
/* .page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
} */

.page-content {
   height: 100%;
  flex: 1;
  overflow-y: auto;  /* 🔥 THIS IS WHERE SCROLL COMES BACK */
}

</style>
