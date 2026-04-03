
import { createBaseStore } from './../base/base_store'
import { defineStore } from 'pinia'
import { HTTPAuth, HTTPClient, url } from './../boot/api'


import { useUserStore } from '../stores/UserStore'

export const useUserSore = createBaseStore(
  'tipoentidade', 
  {
    url: 'ipa/clinica/tipoentidades',
    app: 'django_resaas',
    model: 'TipoEntidade'
  },
  {

    state: () => ({
      Logeds: [],
      Loged: null,
      LogedModelos: [],
      LogedModulos: [],
      LogedTheme: {},
      LogedLayoutSettings: {},
      LogedAnimationSettings: {},
      LogedTypography: {},
      LogedModulos: [],
      LogedModelos: [],
    }),

    getters: {

    },

    actions: {

      async setLayoutSettings (tipoEntidade) {
        TipoEntidade = tipoEntidade || this.row.id
        if (getStorage('l', 'userTipoEntidade') !== null) {

          const rsp = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/tipoentidades/' + TipoEntidade + '/themeGet/', params: { } }))
            .then(res => {
              setStorage('l', 'tipoEntidadeTheme', JSON.stringify(res.data))
              this.Theme = res.data || {}
            })

          const lay = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/tipoentidades/' + TipoEntidade + '/layoutSettingsGet/', params: { } }))
            .then(res => {
              setStorage('l', 'tipoEntidadeLayoutsettings', JSON.stringify(res.data))
              this.LayoutSettings = res.data || {}

            })

          const tp = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/tipoentidades/' + TipoEntidade + '/typographyGet/', params: { } }))
            .then(res => {
              setStorage('l', 'tipoEntidadeTypography', JSON.stringify(res.data))
              this.Typography = res.data || {}
            })

          const as = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/tipoentidades/' + TipoEntidade + '/animationSettingsGet/', params: { } }))
            .then(res => {
              setStorage('l', 'tipoEntidadeAnimationSettings', JSON.stringify(res.data))
              this.AnimationSettings = res.data || {}
            })

          if( tipoEntidade) {
            const User = useUserStore()
            
            User.Theme = this.LogedTheme
            User.AnimationSettings = this.LogedAnimationSettings
            User.Typography = this.LogedTypography
            User.LayoutSettings = this.LogedLayoutSettings

            User.setSettings()
          }
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
  }
)
