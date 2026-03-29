

import { defineStore } from 'pinia'

export const MenuStore = defineStore('menu', {
  state: () => ({
    rightMenus: {},
    initialized: false
  }),

  actions: {
    registerRightMenu(name, component) {
      this.rightMenus[name] = component
    },

    init() {
      if (this.initialized) return

      this.initialized = true

      // 🔥 carrega menus aqui
      import('src/core/rightMenus').then(({ setupRightMenus }) => {
        setupRightMenus(this)
      })
    }
  }
})


