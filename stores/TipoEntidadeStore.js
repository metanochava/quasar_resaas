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

    // ===============================
    // STATE
    // ===============================
    state: () => ({
      Theme: {},
      LayoutSettings: {},
      AnimationSettings: {},
      Typography: {},

      // 🔥 LEGADO (mantido)
      Modulos: [],
      Modelos: [],

      // 🔥 PERMISSION MANAGER (AGRUPADO)
      permissions: {
        apps: [],
        filteredApps: [],
        selected: [],
        permissionSearch: '',
        loadingPermissions: false,
        autoSaveTimer: null,
        autoSaveDelay: 700,
        savingPermissions: false,
        status: 'idle', // idle | saving | saved | error
        lastSavedAt: null
      }
    }),

    // ===============================
    // GETTERS
    // ===============================
    getters: {

      groupedApps(state) {
        const groups = {}

        state.permissions.filteredApps.forEach(item => {
          if (!groups[item.app_label]) {
            groups[item.app_label] = []
          }
          groups[item.app_label].push(item)
        })

        return groups
      },

      isSelected: (state) => (id) => {
        return state.permissions.selected.some(p => p.id === id)
      }

    },

    // ===============================
    // ACTIONS
    // ===============================
    actions: {

      // ===============================
      // 🔥 INIT PERMISSIONS
      // ===============================
      async initPermissions(tipoId) {
        try {
          const id = tipoId || this.row?.id
          if (!id) return

          this.permissions.loadingPermissions = true

          const [all, selected] = await Promise.all([
            HTTPClient.get(url({
              type: 'u',
              url: 'api/django_resaas/modelos'
            })),
            HTTPClient.get(url({
              type: 'u',
              url: `api/django_resaas/tipoentidades/${id}/modelos`
            }))
          ])

          this.permissions.apps = all.data || []
          this.permissions.filteredApps = all.data || []
          this.permissions.selected = selected.data || []

        } catch (e) {
          console.error('initPermissions error', e)
        } finally {
          this.permissions.loadingPermissions = false
        }
      },

      // ===============================
      // 🔍 FILTER
      // ===============================
      filterPermissions(val) {
        this.permissions.permissionSearch = val

        if (!val) {
          this.permissions.filteredApps = this.permissions.apps
          return
        }

        const needle = (val || '').toLowerCase()

        this.permissions.filteredApps = this.permissions.apps.filter(v =>
          v.model.toLowerCase().includes(needle) ||
          v.app_label.toLowerCase().includes(needle)
        )
      },

      // ===============================
      // 🔁 TOGGLE + AUTO SAVE
      // ===============================
     togglePermission(item) {
        const exists = this.permissions.selected.some(p => p.id === item.id)

        this.permissions.selected = exists
          ? this.permissions.selected.filter(p => p.id !== item.id)
          : [...this.permissions.selected, item]

        // 🔥 status UX
        this.permissions.status = 'idle'

        // 🔥 auto-save
        this.scheduleSavePermissions()
      },

      // ===============================
      // ⏱ AUTO SAVE (DEBOUNCE)
      // ===============================
      scheduleSavePermissions(tipoId = null) {
        clearTimeout(this.permissions.autoSaveTimer)

        this.permissions.autoSaveTimer = setTimeout(async () => {

          if (this.permissions.savingPermissions) return // 🔥 PROTEÇÃO

          await this.savePermissions(tipoId)

        }, this.permissions.autoSaveDelay)
      },

      // ===============================
      // 💾 SAVE PERMISSIONS (SYNC)
      // ===============================
      async savePermissions(tipoId) {
        try {
          const id = tipoId || this.row?.id
          if (!id) return

          this.permissions.savingPermissions = true
          this.permissions.status = 'saving'

          await HTTPClient.post(url({
            type: 'u',
            url: `api/django_resaas/tipoentidades/${id}/syncModelos/`
          }), {
            ids: this.permissions.selected.map(i => i.id)
          })

          this.permissions.status = 'saved'
          this.permissions.lastSavedAt = new Date()

        } catch (e) {
          console.error('savePermissions error', e)
          this.permissions.status = 'error'
        } finally {
          this.permissions.savingPermissions = false
        }
      },


      // ===============================
      // 🎨 LAYOUT / THEME (mantido)
      // ===============================
      async getLayoutSettings(tipoEntidade) {
        try {
          const id = tipoEntidade || this.row?.id
          if (!id) return

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

          setStorage('l', 'tipoEntidadeTheme', JSON.stringify(this.Theme))
          setStorage('l', 'tipoEntidadeLayoutsettings', JSON.stringify(this.LayoutSettings))
          setStorage('l', 'tipoEntidadeTypography', JSON.stringify(this.Typography))
          setStorage('l', 'tipoEntidadeAnimationSettings', JSON.stringify(this.AnimationSettings))

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
      // 📦 LISTA (mantido)
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