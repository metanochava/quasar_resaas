<template>
  <div
    class="left-menu q-pa-none"
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
      <q-list class="left-menu-list q-pa-none">

        <q-expansion-item
          v-for="App in User.Menus"
          :key="App"
          dense
          class="left-menu-item q-pa-none"
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
          :header-style="
            isMini
              ? {
                  padding: '0',
                  minWidth: '0'
                }
              : {}
          "
          :expand-icon-class="
            isMini
              ? 'mini-expand-icon'
              : 'text-white'
          "
          expand-icon="chevron_right"
        >

          <template #header>

            <q-item-section
              avatar
              :class="{ 'mini-avatar': isMini }"
            >
              <q-icon :name="App.icon" />

              <s-tooltip
                v-if="isMini"
                anchor="center right"
                self="center left"
              >
                {{ tdc(App.menu) }}
              </s-tooltip>
            </q-item-section>

            <q-item-section
              v-if="!isMini"
              class="left-menu-label"
            >
              {{ tdc(App.menu) }}
            </q-item-section>

          </template>

          <q-separator />

          <SubMenu :Dados="App.submenu" />

          <q-separator />

        </q-expansion-item>

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
    }
  }
})
</script>

<style>
/*
 * O QDrawer é responsável pela largura.
 *
 * Não usamos width: 100% nem sidebarWidth aqui.
 * left + right fazem o menu ocupar exactamente
 * a largura disponível no drawer.
 */
.left-menu {
  position: absolute;

  top: 94px;
  bottom: 48px;

  left: 0;
  right: 0;

  min-width: 0;
  max-width: 100%;

  margin: 0;
  padding: 0;

  box-sizing: border-box;

  overflow-x: hidden !important;
  overflow-y: hidden;
}


/* Scroll Area */
.left-menu .q-scrollarea {
  min-width: 0 !important;
  max-width: 100% !important;

  overflow-x: hidden !important;
}

.left-menu .q-scrollarea__container {
  min-width: 0 !important;
  max-width: 100% !important;

  overflow-x: hidden !important;
}

.left-menu .q-scrollarea__content {
  min-width: 0 !important;
  max-width: 100% !important;

  overflow-x: hidden !important;
}


/* Lista principal */
.left-menu-list {
  min-width: 0 !important;
  max-width: 100% !important;

  margin: 0 !important;
  padding: 0 !important;

  box-sizing: border-box;
}


/* Expansion Item */
.left-menu-item {
  min-width: 0 !important;
  max-width: 100% !important;

  margin: 0 !important;
  padding: 0 !important;

  box-sizing: border-box;
}


/* Header interno do QExpansionItem */
.left-menu .q-item {
  min-width: 0 !important;
  max-width: 100% !important;

  margin: 0;
  box-sizing: border-box;
}


/* Evita que labels grandes aumentem a largura */
.left-menu-label {
  min-width: 0 !important;

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}


/*
 * Esconde o chevron do QExpansionItem
 * quando o drawer está mini.
 */
.mini-expand-icon {
  display: none !important;
}


/*
 * No modo mini, o avatar passa a ocupar
 * o espaço disponível e centraliza o ícone.
 */
.mini-avatar {
  min-width: 0 !important;

  padding-left: 0 !important;
  padding-right: 0 !important;

  margin: 0 !important;

  align-items: center !important;
  justify-content: center !important;
}


/*
 * Remove padding adicional que o Quasar
 * possa aplicar à secção avatar.
 */
.left-menu .mini-avatar.q-item__section--avatar {
  min-width: 0 !important;
  padding: 0 !important;
}


/*
 * Segurança adicional contra overflow
 * causado por elementos internos.
 */
.left-menu * {
  box-sizing: border-box;
}
</style>