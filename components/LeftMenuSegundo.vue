<template>
  <div
    class="left-menu"
    :class="
      $q.dark.isActive
        ? 'bg-transparent text-white'
        : 'bg-transparent text-white'
    "
    :style="
      menuRtl
        ? { left: '10px', right: '0' }
        : { left: '0', right: '10px' }
    "
  >
    <q-scroll-area
      :thumb-style="thumbStyle"
      :bar-style="barStyle"
      class="fit"
    >
      <q-list class="fit q-pa-none">

        <!-- ============================================= -->
        <!-- MINI MENU                                     -->
        <!-- ============================================= -->

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
            <!-- ICON -->
            <q-item-section
              avatar
              class="mini-avatar"
            >
              <q-icon
                :name="App.icon || 'menu'"
                size="22px"
              />
            </q-item-section>

            <!-- TOOLTIP -->
            <s-tooltip
              :anchor="
                menuRtl
                  ? 'center left'
                  : 'center right'
              "
              :self="
                menuRtl
                  ? 'center right'
                  : 'center left'
              "
            >
              {{ tdc(App.menu) }}
            </s-tooltip>

            <!-- MINI POPUP -->
            <q-menu
              :anchor="
                menuRtl
                  ? 'top left'
                  : 'top right'
              "
              :self="
                menuRtl
                  ? 'top right'
                  : 'top left'
              "
              :offset="
                menuRtl
                  ? [-5, 0]
                  : [5, 0]
              "
              :transition-show="
                menuRtl
                  ? 'jump-left'
                  : 'jump-right'
              "
              :transition-hide="
                menuRtl
                  ? 'jump-right'
                  : 'jump-left'
              "
            >
              <div
                class="mini-popup"
                :class="
                  $q.dark.isActive
                    ? 'bg-dark text-white'
                    : 'bg-white text-dark'
                "
              >

                <!-- POPUP HEADER -->
                <div
                  class="row items-center no-wrap q-pa-sm"
                  :class="{ 'row-reverse': menuRtl }"
                >
                  <q-icon
                    :name="App.icon || 'menu'"
                    size="20px"
                    :class="
                      menuRtl
                        ? 'q-ml-sm'
                        : 'q-mr-sm'
                    "
                  />

                  <div
                    class="col text-subtitle2 ellipsis"
                    :class="
                      menuRtl
                        ? 'text-right'
                        : 'text-left'
                    "
                  >
                    {{ tdc(App.menu) }}
                  </div>
                </div>

                <q-separator />

                <!-- SUBMENU -->
                <SubMenu
                  :Dados="App.submenu"
                  :menu-rtl="menuRtl"
                />

              </div>
            </q-menu>

          </q-item>
        </template>


        <!-- ============================================= -->
        <!-- MENU NORMAL                                   -->
        <!-- ============================================= -->

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
            :expand-icon-class="
              menuRtl
                ? 'expand-icon-rtl text-white'
                : 'text-white'
            "
          >

            <!-- CUSTOM HEADER -->
            <template #header>
              <div
                class="row items-center full-width no-wrap"
                :class="{ 'row-reverse': menuRtl }"
              >

                <!-- ICON -->
                <q-icon
                  :name="App.icon || 'menu'"
                  size="24px"
                  :class="
                    menuRtl
                      ? 'q-ml-md'
                      : 'q-mr-md'
                  "
                />

                <!-- TITLE -->
                <div
                  class="col ellipsis"
                  :class="
                    menuRtl
                      ? 'text-right'
                      : 'text-left'
                  "
                >
                  {{ tdc(App.menu) }}
                </div>

              </div>
            </template>

            <q-separator />

            <!-- SUBMENU -->
            <SubMenu
              :Dados="App.submenu"
              :menu-rtl="menuRtl"
            />

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

    menuRtl () {
      return !!this.User.ps?.layout?.menu_rtl
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
   CONTAINER
   ========================================================= */

.left-menu {
  position: absolute;

  top: 94px;
  bottom: 38px;

  min-width: 0;

  padding: 0;
  margin: 0;

  box-sizing: border-box;

  overflow-x: hidden;
  overflow-y: hidden;
}


/* =========================================================
   SCROLL AREA
   ========================================================= */

.left-menu .q-scrollarea__container,
.left-menu .q-scrollarea__content {
  width: 100% !important;

  min-width: 0 !important;
  max-width: 100% !important;

  box-sizing: border-box;
}


/* =========================================================
   LIST
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
   NORMAL MENU
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


/* RTL expansion arrow */
.expand-icon-rtl {
  transform: rotate(180deg);
}


/* =========================================================
   MINI MENU
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


.mini-menu-item .q-item__section--avatar {
  min-width: 0 !important;

  padding: 0 !important;

  align-items: center !important;
  justify-content: center !important;
}


/* =========================================================
   MINI POPUP
   ========================================================= */

.mini-popup {
  min-width: 220px;
  max-width: 320px;

  padding: 0;

  box-sizing: border-box;
}


/* =========================================================
   OVERFLOW
   ========================================================= */

.left-menu * {
  box-sizing: border-box;
}
</style>