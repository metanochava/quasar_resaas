import { createBaseStore } from './../base/base_store'
import { HTTPAuth, url } from './../boot/api'
import { defineStore } from 'pinia'

export const useLoadStore = defineStore('load', {
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
