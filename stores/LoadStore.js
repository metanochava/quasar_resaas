import { createBaseStore } from './../base/base_store'
import { HTTPAuth, url } from './../boot/api'

export const LoadStore = defineStore('load', {
  state: () => ({
    count: 0
  }),
  getters: {
    value: (state) => state.count,
  },
  actions: {
    inc() {
      this.count++
    },
    dec() {
      this.count--
    },
  }
})
