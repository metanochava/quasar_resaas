<template>
  <div
    class="left-menu"
    :class="
      $q.dark.isActive
        ? 'bg-transparent text-white'
        : 'bg-transparent text-white'
    "
  >
    <q-scroll-area
      :thumb-style="thumbStyle"
      :bar-style="barStyle"
      class="fit"
    >
      <q-list class="fit q-pa-none">

        <!-- ========================= -->
        <!-- MODO MINI                 -->
        <!-- ========================= -->

        <template v-if="isMini">
          <q-item
            v-for="App in User.Menus"
            :key="App.menu"
            clickable
            v-ripple
            class="mini-menu-item"
            :class="
              $q.dark.isActive
                ? 'bg-dark text-white'
                : 'bg-primary text-white'
            "
          >
            <q-item-section
              avatar
              class="mini-avatar"
            >
              <q-icon
                :name="App.icon"
                size="22px"
              />
            </q-item-section>

            <!-- Tooltip -->
            <s-tooltip
              style="font-size:15px;"
              anchor="center right"
              self="center left"
            >
              {{ tdc(App.menu) }}
            </s-tooltip>

            <!-- Menu lateral -->
            <q-menu
              anchor="top right"
              self="top left"
              :offset="[5, 0]"
              transition-show="jump-right"
              transition-hide="jump-left"
            >
              <div
                class="mini-popup"
                :class="
                  $q.dark.isActive
                    ? 'bg-dark text-white'
                    : 'bg-white text-dark'
                "
              >
                <!-- Nome da aplicação -->
                <div class="row items-center no-wrap q-pa-sm">

                  <q-icon
                    :name="App.icon"
                    size="20px"
                    class="q-mr-sm"
                  />

                  <div class="text-subtitle2 ellipsis">
                    {{ tdc(App.menu) }}
                  </div>

                </div>

                <q-separator />

                <!-- Submenus -->
                <SubMenu :Dados="App.submenu" />

              </div>
            </q-menu>

          </q-item>
        </template>


        <!-- ========================= -->
        <!-- MODO NORMAL               -->
        <!-- ========================= -->

        <template v-else>
          <q-expansion-item
            v-for="App in User.Menus"
            :key="App.menu"
            dense
            class="q-pa-none full-width"
            :class="
              $q.dark.isActive
                ? 'bg-dark-saas text-subtitle1 text-white'
                : 'text-subtitle1 text-white'
            "
            :header-class="
              $q.dark.isActive
                ? 'bg-dark text-white'
                : 'bg-primary text-white'
            "
            expand-icon="chevron_right"
            expand-icon-class="white"
          >

            <template #header>

              <q-item-section avatar>
                <q-icon :name="App.icon"  color=""/>
              </q-item-section>

              <q-item-section>
                <div class="ellipsis">
                  {{ tdc(App.menu) }}
                </div>
              </q-item-section>

            </template>

            <q-separator />

            <SubMenu :Dados="App.submenu" />

            <q-separator />

          </q-expansion-item>
        </template>

      </q-list>
    </q-scroll-area>
  </div>
</template>


<script>
import { defineComponent } from 'vue'

import { useUserStore } from '../stores/UserStore'
import { useEntityTypeStore } from '../stores/EntityTypeStore'

import SubMenu from './SubMenu.vue'

import {
  barStyle,
  thumbStyle
} from '../services/app'

import {
  tdc,
  toPlural
} from '../services/translation'


export default defineComponent({
  name: 'LeftMenuSegundo',

  components: {
    SubMenu
  },

  setup () {
    const EntityType = useEntityTypeStore()
    const User = useUserStore()

    return {
      EntityType,
      User,

      tdc,
      toPlural,

      barStyle,
      thumbStyle
    }
  },

  computed: {

    isMini () {
      return !!this.User.ps?.layout?.sidebar?.mini
    },

    sidebarWidth () {
      return this.isMini
        ? (this.User.ps?.layout?.sidebar?.mini_width || 70)
        : (this.User.ps?.layout?.sidebar?.width || 300)
    }

  }
})
</script>


<style>

/* =========================================================
   CONTAINER PRINCIPAL
   ========================================================= */

.left-menu {
  position: absolute;

  top: 94px;
  bottom: 38px;

  /*
   * Deixa 10px livres no lado direito.
   * Drawer 300px -> menu ~290px
   * Drawer 70px  -> menu ~60px
   */
  left: 0;
  right: 10px;

  min-width: 0;

  padding: 0;
  margin: 0;

  box-sizing: border-box;

  overflow-x: hidden;
  overflow-y: hidden;
}


/* =========================================================
   QSCROLLAREA
   ========================================================= */

.left-menu .q-scrollarea__container,
.left-menu .q-scrollarea__content {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;

  box-sizing: border-box;
}


/* =========================================================
   QLIST
   ========================================================= */

.left-menu .q-list {
  width: 100%;
  min-width: 0 !important;
  max-width: 100% !important;

  padding: 0;
  margin: 0;

  box-sizing: border-box;
}


/* =========================================================
   MODO NORMAL
   ========================================================= */

.left-menu .q-expansion-item {
  width: 100%;
  min-width: 0 !important;
  max-width: 100% !important;

  box-sizing: border-box;
}

.left-menu .q-item {
  min-width: 0 !important;
  max-width: 100% !important;

  box-sizing: border-box;
}


/* =========================================================
   MODO MINI
   ========================================================= */

.mini-menu-item {
  width: 100%;

  min-width: 0 !important;
  max-width: 100% !important;

  padding: 0 !important;
  margin: 0 !important;

  box-sizing: border-box;

  justify-content: center;
}


/*
 * O avatar ocupa todo o espaço disponível
 * no drawer mini.
 */

.mini-menu-item .mini-avatar {
  width: 100% !important;

  min-width: 0 !important;
  max-width: 100% !important;

  padding: 12px 0 !important;
  margin: 0 !important;

  align-items: center !important;
  justify-content: center !important;

  box-sizing: border-box;
}


/*
 * Remove o comportamento padrão do Quasar
 * para q-item-section avatar.
 */

.mini-menu-item .q-item__section--avatar {
  min-width: 0 !important;
  padding: 0 !important;

  align-items: center !important;
}


/* =========================================================
   POPUP DO MENU MINI
   ========================================================= */

.mini-popup {
  min-width: 220px;
  max-width: 320px;

  padding: 0;

  box-sizing: border-box;
}


/* =========================================================
   SEGURANÇA CONTRA OVERFLOW
   ========================================================= */

.left-menu * {
  box-sizing: border-box;
}

</style>