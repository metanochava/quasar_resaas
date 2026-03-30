
import { createBaseStore } from './../base/base_store'
import { defineStore } from 'pinia'
import { HTTPAuth, HTTPClient, url } from './../boot/api'

export const useTipoEntidadeStore = defineStore('tipoentidade', {
  state: () => ({
    TipoEntidades: [],
    TipoEntidade: { },
    LayoutSettings: { },
    Theme: { },
    AnimationSettings: { },
    Typography: { },
    Idiomas: [ ]
  }),

  getters: {

  },

  actions: {
    async getTipoEntidades(){
      await HTTPClient.get(url({type: "u", url: "api/django_resaas/tipoentidades", params: {}}) )
      .then(res => {
        this.TipoEntidades = res.data
      }).catch(err => {

      })
    },
  }
})
