

import { defineStore } from 'pinia'

export const useMenuStore = defineStore('menu', {
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

      // 🔥 load menus here
      import('src/core/rightMenus').then(({ setupRightMenus }) => {
        setupRightMenus(this)
      })
    }
  }
})



