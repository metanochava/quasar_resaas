import { defineStore } from 'pinia'

export const AlertStore = defineStore('alert', { 
  state: () => ({
    data: []
  }),
  actions: {
    add(alert) {
      this.data.push(alert)
    },
    remove(alert) {
      this.data = this.data.filter(a => a.id !== alert.id)
    },
    clear() {
      this.data = []
    },
  }
})
