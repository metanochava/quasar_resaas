
import { createBaseStore } from './../base/base_store'
// import { defineStore } from 'pinia'
import { HTTPAuth, HTTPClient, url } from './../boot/api'
import { useUserStore } from '../stores/UserStore'
import { getStorage, setStorage } from './../boot/storage'


export const useTipoEntidadeStore = createBaseStore(
  'tipoentidade', 
  {
    url: 'ipa/clinica/tipoentidades',
    app: 'django_resaas',
    model: 'TipoEntidade'
  },
  {

    state: () => ({
      Theme: {},
      LayoutSettings: {},
      AnimationSettings: {},
      Typography: {},
      Modulos: [],
      Modelos: [],
    }),

    getters: {

    },

    actions: {

      async getLayoutSettings (tipoEntidade) {
        let TipoEntidade = tipoEntidade || this.row?.id
        if (getStorage('l', 'userTipoEntidade') !== null) {

          const rsp = await HTTPClient.get(url({ type: 'u', url: 'api/django_resaas/tipoentidades/' + TipoEntidade + '/themeGet/', params: { } }))
            .then(res => {
              setStorage('l', 'tipoEntidadeTheme', JSON.stringify(res.data))
              this.Theme = res.data || {}
            })

          const lay = await HTTPClient.get(url({ type: 'u', url: 'api/django_resaas/tipoentidades/' + TipoEntidade + '/layoutSettingsGet/', params: { } }))
            .then(res => {
              setStorage('l', 'tipoEntidadeLayoutsettings', JSON.stringify(res.data))
              this.LayoutSettings = res.data || {}

            })

          const tp = await HTTPClient.get(url({ type: 'u', url: 'api/django_resaas/tipoentidades/' + TipoEntidade + '/typographyGet/', params: { } }))
            .then(res => {
              setStorage('l', 'tipoEntidadeTypography', JSON.stringify(res.data))
              this.Typography = res.data || {}
            })

          const as = await HTTPClient.get(url({ type: 'u', url: 'api/django_resaas/tipoentidades/' + TipoEntidade + '/animationSettingsGet/', params: { } }))
            .then(res => {
              setStorage('l', 'tipoEntidadeAnimationSettings', JSON.stringify(res.data))
              this.AnimationSettings = res.data || {}
            })

          if( tipoEntidade) {
            const User = useUserStore()
            
            User.Theme = this.Theme
            User.AnimationSettings = this.AnimationSettings
            User.Typography = this.Typography
            User.LayoutSettings = this.LayoutSettings

            User.setSettings()
          }
          return lay
        }
      },

      async getTipoEntidades(){
        await HTTPClient.get(url({type: "u", url: "api/django_resaas/tipoentidades", params: {}}) )
        .then(res => {
          this.rows = res.data
        }).catch(err => {

        })
      },
    }
  }
)
