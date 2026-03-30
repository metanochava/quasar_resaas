import { defineStore } from 'pinia'

export const SettingsStore = defineStore('settings', {
  state: () => ({
    Settings: { layout: 'main' } 
  }),
  actions: {
    increment() {
      this.count++
    },
  }
})

