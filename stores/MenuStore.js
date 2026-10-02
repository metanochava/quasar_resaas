

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

    // The application registers its own right menus (registerRightMenu)
    // from one of its boot files. The library never imports application
    // files: it used to import src/core/rightMenus here, which made every
    // app without that file fail to build.
    init() {
      this.initialized = true
    }
  }
})



