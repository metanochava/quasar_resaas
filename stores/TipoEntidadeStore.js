import { createBaseStore } from './../base/base_store'
import { HTTPClient, url } from './../boot/api'
import { useUserStore } from '../stores/UserStore'
import { getStorage, setStorage } from './../boot/storage'

export const useTipoEntidadeStore = createBaseStore(
  'tipoentidade',
  {
    url: 'api/django_resaas/tipoentidades',
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

    actions: {

      // ===============================
      // LAYOUT / THEME
      // ===============================
      async getLayoutSettings(tipoEntidade) {
        try {
          const id = tipoEntidade || this.row?.id
          if (!id) return

          // 🔥 evita chamada sem contexto
          if (!getStorage('l', 'userTipoEntidade')) return

          const [theme, layout, typography, animation] = await Promise.all([
            HTTPClient.get(url({ type: 'u', url: `api/django_resaas/tipoentidades/${id}/themeGet/` })),
            HTTPClient.get(url({ type: 'u', url: `api/django_resaas/tipoentidades/${id}/layoutSettingsGet/` })),
            HTTPClient.get(url({ type: 'u', url: `api/django_resaas/tipoentidades/${id}/typographyGet/` })),
            HTTPClient.get(url({ type: 'u', url: `api/django_resaas/tipoentidades/${id}/animationSettingsGet/` }))
          ])

          this.Theme = theme.data || {}
          this.LayoutSettings = layout.data || {}
          this.Typography = typography.data || {}
          this.AnimationSettings = animation.data || {}

          // 🔥 persistência
          setStorage('l', 'tipoEntidadeTheme', JSON.stringify(this.Theme))
          setStorage('l', 'tipoEntidadeLayoutsettings', JSON.stringify(this.LayoutSettings))
          setStorage('l', 'tipoEntidadeTypography', JSON.stringify(this.Typography))
          setStorage('l', 'tipoEntidadeAnimationSettings', JSON.stringify(this.AnimationSettings))

          // 🔥 sync com user
          if (tipoEntidade) {
            const User = useUserStore()

            Object.assign(User, {
              Theme: this.Theme,
              LayoutSettings: this.LayoutSettings,
              Typography: this.Typography,
              AnimationSettings: this.AnimationSettings
            })

            User.setSettings()
          }

        } catch (e) {
          console.error('getLayoutSettings TipoEntidade error', e)
        }
      },

      // ===============================
      // LISTA
      // ===============================
      async getTipoEntidades() {
        try {
          const { data } = await HTTPClient.get(
            url({ type: "u", url: "api/django_resaas/tipoentidades" })
          )

          this.rows = data || []

          const User = useUserStore()
          User.TipoEntidades = this.rows

        } catch (e) {
          console.error('getTipoEntidades error', e)
        }
      }

    }
  }
)