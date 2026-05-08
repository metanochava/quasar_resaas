import { createBaseStore } from './../base/base_store'
import { HTTPClient, url } from './../boot/api'
import { useUserStore } from '../stores/UserStore'
import { getStorage, setStorage } from './../boot/storage'

export const useEntityTypeStore = createBaseStore(
  'tipoentity',
  {
    url: 'api/django_resaas/tipoentitys',
    app: 'django_resaas',
    model: 'EntityType'
  },
  {
    state: () => ({
      Theme: {},
      LayoutSettings: {},
      AnimationSettings: {},
      Typography: {},

      Modulos: [],
      Modelos: [],

      modulos: [],
      selectedModulos: [],
      loadingModulos: false,

      models: {
        models: [],
        filteredModels: [],
        selected: [],
        permissionSearch: '',
        loadingModels: false,
        autoSaveTimer: null,
        autoSaveDelay: 700,
        savingPermissions: false,
        status: 'idle',
        lastSavedAt: null
      },


      

      groups: [],
      selectedGroups: [],
      loadingGroups: false,
      groupSearch: '',
      groupFilter: 'all' // all | active | inactive
    }),

    getters: {
      groupedModels(state) {
        const groups = {}

        state.models.filteredModels.forEach(item => {
          if (!groups[item.app_label]) {
            groups[item.app_label] = []
          }
          groups[item.app_label].push(item)
        })

        return groups
      },

      isSelected: (state) => (id) => {
        return state.models.selected.some(p => p.id === id)
      },

      hasGroup: (state) => (id) => {
        return state.selectedGroups.some(g => g.id === id)
      },

      filteredGroups(state) {
        const search = (state.groupSearch || '').toLowerCase()

        return state.groups.filter(group => {
          const name = (group.name || '').toLowerCase()
          const active = state.selectedGroups.some(g => g.id === group.id)

          const matchSearch = !search || name.includes(search)

          const matchFilter =
            state.groupFilter === 'all' ||
            (state.groupFilter === 'active' && active) ||
            (state.groupFilter === 'inactive' && !active)

          return matchSearch && matchFilter
        })
      }
    },

    actions: {

async loadModulos(tipoId) {
  try {
    const id = tipoId || this.row?.id
    if (!id) return

    this.loadingModulos = true

    const [all, selected] = await Promise.all([
      HTTPClient.get(url({
        type: 'u',
        url: 'api/django_resaas/modulos/'
      })),
      HTTPClient.get(url({
        type: 'u',
        url: `api/django_resaas/tipoentitys/${id}/modulos/`
      }))
    ])

    this.modulos = all.data || []
    this.selectedModulos = selected.data || []

  } finally {
    this.loadingModulos = false
  }
},

hasModulo(id) {
  return this.selectedModulos.some(m => m.id === id)
},

async toggleModulo(modulo) {
  const id = this.row?.id
  if (!id) return

  const exists = this.hasModulo(modulo.id)
  const endpoint = exists ? 'removeModulo' : 'addModulo'

  await HTTPClient.post(
    url({
      type: 'u',
      url: `api/django_resaas/tipoentitys/${id}/${endpoint}/`
    }),
    { id: modulo.id }
  )

  if (!exists) {
    this.selectedModulos.push(modulo)
  } else {
    this.selectedModulos = this.selectedModulos.filter(
      m => m.id !== modulo.id
    )
  }
},
      async initModels(tipoId) {
        try {
          const id = tipoId || this.row?.id
          if (!id) return

          this.models.loadingModels = true

          const [all, selected] = await Promise.all([
            HTTPClient.get(url({ type: 'u', url: 'api/django_resaas/modelos', params: {"tipoentity" : this.row?.id} })),
            HTTPClient.get(url({ type: 'u', url: `api/django_resaas/tipoentitys/${id}/modelos` }))
          ])

          this.models.models = all.data || []
          this.models.filteredModels = all.data || []
          this.models.selected = selected.data || []

        } catch (e) {
          console.error('initModels error', e)
        } finally {
          this.models.loadingModels = false
        }
      },

      filterPermissions(val) {
        this.models.permissionSearch = val

        if (!val) {
          this.models.filteredModels = this.models.models
          return
        }

        const needle = (val || '').toLowerCase()

        this.models.filteredModels = this.models.models.filter(v =>
          v.model.toLowerCase().includes(needle) ||
          v.app_label.toLowerCase().includes(needle)
        )
      },

      toggleApp(item) {
        const exists = this.models.selected.some(p => p.id === item.id)

        this.models.selected = exists
          ? this.models.selected.filter(p => p.id !== item.id)
          : [...this.models.selected, item]

        this.models.status = 'idle'
        this.scheduleSavePermissions()
      },

      scheduleSavePermissions(tipoId = null) {
        clearTimeout(this.models.autoSaveTimer)

        this.models.autoSaveTimer = setTimeout(async () => {
          if (this.models.savingPermissions) return
          await this.savePermissions(tipoId)
        }, this.models.autoSaveDelay)
      },

      async savePermissions(tipoId) {
        try {
          const id = tipoId || this.row?.id
          if (!id) return

          this.models.savingPermissions = true
          this.models.status = 'saving'

          await HTTPClient.post(url({
            type: 'u',
            url: `api/django_resaas/tipoentitys/${id}/syncModelos/`
          }), {
            ids: this.models.selected.map(i => i.id)
          })

          this.models.status = 'saved'
          this.models.lastSavedAt = new Date()

        } catch (e) {
          console.error('savePermissions error', e)
          this.models.status = 'error'
        } finally {
          this.models.savingPermissions = false
        }
      },

      async loadGroups(entityTypeId) {
        try {
          const id = entityTypeId || this.row?.id
          if (!id) return

          this.loadingGroups = true

          const [all, selected] = await Promise.all([
            HTTPClient.get(url({
              type: 'u',
              url: 'api/auth/groups/'
            })),
            HTTPClient.get(url({
              type: 'u',
              url: `api/django_resaas/tipoentitys/${id}/groups/`
            }))
          ])

          this.groups = (all.data || []).sort((a, b) =>
            String(a.name || '').localeCompare(String(b.name || ''))
          )

          this.selectedGroups = selected.data || []

        } catch (e) {
          console.error('loadGroups error', e)
        } finally {
          this.loadingGroups = false
        }
      },

      async toggleGroup(group) {
        try {
          const id = this.row?.id
          if (!id) return

          const exists = this.hasGroup(group.id)
          const endpoint = exists ? 'removeGroup' : 'addGroup'

          await HTTPClient.post(
            url({
              type: 'u',
              url: `api/django_resaas/tipoentitys/${id}/${endpoint}/`
            }),
            { group: group.id }
          )

          if (!exists) {
            if (!this.hasGroup(group.id)) {
              this.selectedGroups = [...this.selectedGroups, group]
            }
          } else {
            this.selectedGroups = this.selectedGroups.filter(
              g => g.id !== group.id
            )
          }

        } catch (e) {
          console.error('toggleGroup error', e)
        }
      },

      async createGroup(name) {
        try {
          const id = this.row?.id
          if (!id) return

          const cleanName = String(name || '').trim()
          if (!cleanName) return

          const res = await HTTPClient.post(
            url({
              type: 'u',
              url: `api/django_resaas/tipoentitys/${id}/createGroup/`
            }),
            { name: cleanName }
          )

          const newGroup = res.data

          if (!this.groups.some(g => g.id === newGroup.id)) {
            this.groups = [...this.groups, newGroup].sort((a, b) =>
              String(a.name || '').localeCompare(String(b.name || ''))
            )
          }

          if (!this.hasGroup(newGroup.id)) {
            this.selectedGroups = [...this.selectedGroups, newGroup]
          }

        } catch (e) {
          console.error('createGroup error', e)
        }
      },

      // ===============================
      // 📦 LISTA (mantido)
      // ===============================
      async getEntityTypes() {
        try {
          const { data } = await HTTPClient.get(
            url({ type: "u", url: "api/django_resaas/tipoentitys" })
          )

          this.rows = data || []

          const User = useUserStore()
          User.EntityTypes = this.rows

        } catch (e) {
          console.error('getEntityTypes error', e)
        }
      },

      async getLayoutSettings(entityType) {
        try {
          const id = entityType || this.row?.id
          if (!id) return

          if (!getStorage('l', 'userEntityType')) return

          const [theme, layout, typography, animation] = await Promise.all([
            HTTPClient.get(url({ type: 'u', url: `api/django_resaas/tipoentitys/${id}/themeGet/` })),
            HTTPClient.get(url({ type: 'u', url: `api/django_resaas/tipoentitys/${id}/layoutSettingsGet/` })),
            HTTPClient.get(url({ type: 'u', url: `api/django_resaas/tipoentitys/${id}/typographyGet/` })),
            HTTPClient.get(url({ type: 'u', url: `api/django_resaas/tipoentitys/${id}/animationSettingsGet/` }))
          ])

          this.Theme = theme.data || {}
          this.LayoutSettings = layout.data || {}
          this.Typography = typography.data || {}
          this.AnimationSettings = animation.data || {}

          setStorage('l', 'entityTypeTheme', JSON.stringify(this.Theme))
          setStorage('l', 'entityTypeLayoutsettings', JSON.stringify(this.LayoutSettings))
          setStorage('l', 'entityTypeTypography', JSON.stringify(this.Typography))
          setStorage('l', 'entityTypeAnimationSettings', JSON.stringify(this.AnimationSettings))

          if (entityType) {
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
          console.error('getLayoutSettings error', e)
        }
      }
    }
  }
)