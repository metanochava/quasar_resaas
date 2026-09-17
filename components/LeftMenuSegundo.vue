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
        <q-expansion-item
          v-for="App in User.Menus"
          :key="App"
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
          :header-style="
            isMini
              ? {
                  padding: '0',
                  minWidth: '0',
                  width: '100%'
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

            <q-item-section v-if="!isMini">
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
.left-menu {
  position: absolute;

  top: 94px;
  bottom: 38px;

  /*
   * Ocupa a largura disponível do drawer,
   * deixando 10px livres do lado direito.
   */
  left: 0;
  right: 10px;

  padding: 0;
  margin: 0;

  min-width: 0;

  overflow-x: hidden;
  overflow-y: hidden;

  box-sizing: border-box;
}

/* QScrollArea */
.left-menu .q-scrollarea__container,
.left-menu .q-scrollarea__content {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;

  box-sizing: border-box;
}

/* Evita que a lista ultrapasse o menu */
.left-menu .q-list {
  min-width: 0 !important;
  max-width: 100% !important;

  box-sizing: border-box;
}

/* Evita overflow do QExpansionItem */
.left-menu .q-expansion-item {
  min-width: 0 !important;
  max-width: 100% !important;

  box-sizing: border-box;
}

/* Esconde o chevron no modo mini */
.mini-expand-icon {
  display: none !important;
}

/* Centraliza o ícone no modo mini */
.mini-avatar {
  min-width: 0 !important;
  width: 100% !important;

  padding: 0 !important;
  margin: 0 !important;

  align-items: center !important;
  justify-content: center !important;
}
</style>