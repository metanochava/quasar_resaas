
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

    async TipoEntidadeLayoutSettings () {
      const TipoEntidadeStore = useTipoEntidadeStore()
      if (getStorage('l', 'userTipoEntidade') !== null) {

        const rsp = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/tipoentidades/' + this.TipoEntidade?.id + '/themeGet/', params: { } }))
          .then(res => {
            setStorage('l', 'tipoEntidadeTheme', JSON.stringify(res.data))
            TipoEntidadeStore.Theme = res.data || {}
            this.Theme = TipoEntidadeStore.Theme

          }).catch(err => {
            console.log(err)
          })

        const lay = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/tipoentidades/' + this.TipoEntidade?.id + '/layoutSettingsGet/', params: { } }))
          .then(res => {
            setStorage('l', 'tipoEntidadeLayoutsettings', JSON.stringify(res.data))
            TipoEntidadeStore.LayoutSettings = res.data || {}
            this.LayoutSettings = TipoEntidadeStore.LayoutSettings

          }).catch(err => {
            console.log(err)
          })


        const tp = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/tipoentidades/' + this.Entidade?.id + '/typographyGet/', params: { } }))
        .then(res => {
          setStorage('l', 'tipoEntidadeTypography', JSON.stringify(res.data))
          TipoEntidadeStore.Typography = res.data || {}
          this.Typography = TipoEntidadeStore.Typography
        }).catch(err => {
          console.log(err)
        })

      const as = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/tipoentidades/' + this.Entidade?.id + '/animationSettingsGet/', params: { } }))
        .then(res => {
          setStorage('l', 'tipoEntidadeAnimationSettings', JSON.stringify(res.data))
          TipoEntidadeStore.AnimationSettings = res.data || {}
          this.AnimationSettings = TipoEntidadeStore.AnimationSettings
        }).catch(err => {
          console.log(err)
        })

          this.setSettings()
        return lay
      }
    },














    async getTipoEntidades(){
      await HTTPClient.get(url({type: "u", url: "api/django_resaas/tipoentidades", params: {}}) )
      .then(res => {
        this.TipoEntidades = res.data
      }).catch(err => {

      })
    },
  }
})
