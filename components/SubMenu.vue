<template>
  <q-list
    dense
    class="submenu-list"
  >

    <q-item
      v-for="item in Dados"
      :key="item.menu"
      clickable
      v-ripple
      :to="resolveRoute(item, 0)"
      class="submenu-item"
      :class="{ 'row-reverse': menuRtl }"
    >

      <!-- ============================================= -->
      <!-- ICON                                          -->
      <!-- ============================================= -->

      <q-item-section
        avatar
        class="submenu-avatar"
        :class="{ 'submenu-avatar-rtl': menuRtl }"
      >
        <q-icon
          :name="item.icon || 'menu'"
          :color="
            $q.dark.isActive
              ? 'white'
              : 'primary'
          "
        />
      </q-item-section>


      <!-- ============================================= -->
      <!-- TITLE                                         -->
      <!-- ============================================= -->

      <q-item-section
        class="submenu-title"
        :class="
          menuRtl
            ? 'text-right'
            : 'text-left'
        "
      >
        <s-tooltip>
          {{ toPlural(tdc(item.menu)) }}
        </s-tooltip>

        {{ toPlural(tdc(item.menu)) }}
      </q-item-section>


      <!-- ============================================= -->
      <!-- ADD BUTTON                                    -->
      <!-- ============================================= -->

      <q-item-section
        v-if="item.add_route"
        side
        class="submenu-side"
        :class="{ 'submenu-side-rtl': menuRtl }"
      >
        <s-btn
          dense
          flat
          icon="add"
          :to="resolveRoute(item, 1)"
          :color="
            $q.dark.isActive
              ? 'white'
              : 'primary'
          "
        />
      </q-item-section>


      <!-- ============================================= -->
      <!-- SUBMENU ARROW                                 -->
      <!-- ============================================= -->

      <q-item-section
        v-if="item.submenu?.length"
        side
        class="submenu-side"
        :class="{ 'submenu-side-rtl': menuRtl }"
      >
        <q-icon
          :name="
            menuRtl
              ? 'chevron_left'
              : 'chevron_right'
          "
        />
      </q-item-section>


      <!-- ============================================= -->
      <!-- RECURSIVE SUBMENU                             -->
      <!-- ============================================= -->

      <q-menu
        v-if="item.submenu?.length"
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

        <!--
          IMPORTANTE:
          menuRtl é passado novamente para o próprio
          SubMenu, permitindo RTL em qualquer profundidade.
        -->

        <SubMenu
          :Dados="item.submenu"
          :menu-rtl="menuRtl"
        />

      </q-menu>

    </q-item>

  </q-list>
</template>


<script>
import { defineComponent } from 'vue'

import { resolveRoute } from '../services/routing'

import {
  tdc,
  toPlural
} from '../services/translation'


export default defineComponent({
  name: 'SubMenu',

  props: {

    Dados: {
      type: Array,
      default: () => []
    },

    menuRtl: {
      type: Boolean,
      default: false
    }

  },

  setup () {
    return {
      tdc,
      toPlural,
      resolveRoute
    }
  }
})
</script>


<style>
/* =========================================================
   LIST
   ========================================================= */

.submenu-list {
  min-width: 0;
  max-width: 100%;

  padding: 0;
  margin: 0;

  box-sizing: border-box;
}


/* =========================================================
   ITEM
   ========================================================= */

.submenu-item {
  width: 100%;

  min-width: 0;
  max-width: 100%;

  box-sizing: border-box;
}


/* =========================================================
   ICON
   ========================================================= */

.submenu-avatar {
  min-width: 0;
}


/* Normal */
.submenu-avatar:not(.submenu-avatar-rtl) {
  padding-right: 16px;
}


/* RTL */
.submenu-avatar-rtl {
  padding-right: 16px !important;
  padding-left: 0 !important;
}


/* =========================================================
   TITLE
   ========================================================= */

.submenu-title {
  display: block;

  min-width: 0;
  max-width: 146px;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;
}


/* =========================================================
   SIDE ELEMENTS
   ========================================================= */

.submenu-side {
  min-width: 0;
}


/* RTL */
.submenu-side-rtl {
  padding-left: 0 !important;
  padding-right: 8px !important;
}


/* =========================================================
   GLOBAL ITEM SAFETY
   ========================================================= */

.submenu-list .q-item,
.submenu-list .q-item__label {
  max-width: 100%;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;
}


/* =========================================================
   OLD UTILITY
   ========================================================= */

.text-14 {
  font-weight: bold;
  font-size: 16px;
}
</style>