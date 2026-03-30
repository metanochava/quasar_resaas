import { createBaseStore } from './../base/base_store'
import { HTTPAuth, url } from './../boot/api'

export const useEntidadeStore = createBaseStore(
  'entidade',
  { url: 'api/django_resaas/entidades' },

  {
    state: () => ({
      Entidades: [],
      Entidade: null,

      Theme: {},
      LayoutSettings: {},
      AnimationSettings: {},
      Typography: {},

      Modulos: [],
      Modelos: []
    }),

    actions: {

      async getEntidadesByUser(userId) {
        const res = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/users/${userId}/userEntidades/` })
        )

        this.Entidades = res.data
        return res.data
      },

      async selectEntidade(entidade) {
        this.Entidade = entidade

        await Promise.all([
          this.loadTheme(),
          this.loadLayout(),
          this.loadTypography(),
          this.loadAnimation()
        ])
      },

      async loadTheme() {
        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/entidades/${this.Entidade?.id}/themeGet/` })
        )
        this.Theme = data || {}
      },

      async loadLayout() {
        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/entidades/${this.Entidade?.id}/layoutSettingsGet/` })
        )
        this.LayoutSettings = data || {}
      },

      async loadTypography() {
        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/entidades/${this.Entidade?.id}/typographyGet/` })
        )
        this.Typography = data || {}
      },

      async loadAnimation() {
        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/entidades/${this.Entidade?.id}/animationSettingsGet/` })
        )
        this.AnimationSettings = data || {}
      },

      async getModulos() {
        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/entidades/${this.Entidade?.id}/modulos/` })
        )
        this.Modulos = data
      },

      async getModelos() {
        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/entidades/${this.Entidade?.id}/modelos` })
        )
        this.Modelos = data
      }
    }
  }
)
