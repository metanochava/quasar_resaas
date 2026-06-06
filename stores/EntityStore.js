import { createBaseStore } from '../base/base_store'
import { HTTPAuth, HTTPClient, url } from '../boot/api'
import { useBranchStore } from './BranchStore'
import { useUserStore } from './UserStore'
import { profileSplint, tdc } from '../boot/base'
import { getStorage, setStorage } from '../boot/storage'

export const useEntityStore = createBaseStore(
  'entity',
  {
    app: 'django_resaas',
    model: 'Entity'
  },
  {
    state: () => ({
      Theme: {},
      LayoutSettings: {},
      AnimationSettings: {},
      Typography: {},
      Apps: [],
      Modelos: [],
      userEntitys: [],


      groups: [],
      selectedGroups: [],
      loadingGroups: false,
      groupSearch: '',
      groupFilter: 'all' // all | active | inactive
    }),

    getters: {
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

      // ===============================
      // SETTINGS GLOBAIS
      // ===============================
      async getSettings() {
        const User = useUserStore()
        try {
          const { data } = await HTTPClient.get(url({ type: "u", url: "site" }))

          this.Theme = data.theme || {}
          this.LayoutSettings = data.layout_settings || {}
          this.AnimationSettings = data.animation_settings || {}
          this.Typography = data.typography || {}
          User.Entity = data.entity || null

          

          Object.assign(User, {
            Theme: this.Theme,
            AnimationSettings: this.AnimationSettings,
            Typography: this.Typography,
            LayoutSettings: this.LayoutSettings
          })

          User.setSettings()

        } catch (e) {
          console.error('getSettings error', e)
        }
      },

            async loadGroups(EntityId) {
              try {
                const id = this.row?.id || EntityId  
                if (!id) return
      
                this.loadingGroups = true
      
                const [all, selected] = await Promise.all([
                  HTTPAuth.get(url({
                    type: 'u',
                    url: `django_resaas/entitytypes/${this.row?.entity_type?.id}/groups/`
                  })),
                  HTTPAuth.get(url({
                    type: 'u',
                    url: `django_resaas/entitys/${id}/groups/`
                  }))
                ])
      
                const merged = [
                  ...(all.data || []),
                  ...(selected.data || [])
                ]

                // remover duplicados por id
                this.groups = Object.values(
                  merged.reduce((acc, g) => {
                    acc[g.id] = g
                    return acc
                  }, {})
                ).sort((a, b) =>
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
      
                await HTTPAuth.post(
                  url({
                    type: 'u',
                    url: `django_resaas/entitys/${id}/${endpoint}/`
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
      
                const res = await HTTPAuth.post(
                  url({
                    type: 'u',
                    url: `django_resaas/entitys/${id}/createGroup/`
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
      // MODELOS
      // ===============================
      async setEntityModelos(entityId) {
        const User = useUserStore()
        try {
          const id = entityId || User.Entity?.id
          if (!id) return

          const { data } = await HTTPAuth.get(
            url({ type: 'u', url: `django_resaas/entitys/${id}/models` })
          )

          this.Modelos = data || []

          if (entityId) {
            useUserStore().EntityModelos = this.Modelos
          }

        } catch (e) {
          console.error('setEntityModelos error', e)
        }
      },

      // ===============================
      // MODULOS
      // ===============================
      async setEntityApps(entityId) {
        const User = useUserStore()
        try {
          const id = entityId || User.Entity?.id
          if (!id) return

          const { data } = await HTTPAuth.get(
            url({ type: 'u', url: `django_resaas/entitys/${id}/apps/` })
          )

          this.Apps = data || []

          if (entityId) {
            const User = useUserStore()
            User.Apps = this.Apps
            setStorage('l', 'entityApps', JSON.stringify(data))
          }

        } catch (e) {
          console.error('setEntityApps error', e)
        }
      },

      // ===============================
      // LAYOUT / THEME
      // ===============================
      async getLayoutSettings(entityId) {
        const User = useUserStore()
        try {
          const id = entityId || User.Entity?.id
          if (!id) return

          const [theme, layout, typography, animation] = await Promise.all([
            HTTPAuth.get(url({ type: 'u', url: `django_resaas/entitys/${id}/themeGet/` })),
            HTTPAuth.get(url({ type: 'u', url: `django_resaas/entitys/${id}/layoutSettingsGet/` })),
            HTTPAuth.get(url({ type: 'u', url: `django_resaas/entitys/${id}/typographyGet/` })),
            HTTPAuth.get(url({ type: 'u', url: `django_resaas/entitys/${id}/animationSettingsGet/` }))
          ])

          this.Theme = theme.data || {}
          this.LayoutSettings = layout.data || {}
          this.Typography = typography.data || {}
          this.AnimationSettings = animation.data || {}

          setStorage('l', 'EntityTheme', JSON.stringify(this.Theme))
          setStorage('l', 'EntityLayoutsettings', JSON.stringify(this.LayoutSettings))
          setStorage('l', 'EntityTypography', JSON.stringify(this.Typography))
          setStorage('l', 'EntityAnimationSettings', JSON.stringify(this.AnimationSettings))

          if (entityId) {
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
      },

      // ===============================
      // USER ENTIDADES
      // ===============================
      async getUserEntitys(userId) {
        if (!userId) return

        try {
          const { data } = await HTTPAuth.get(
            url({ type: 'u', url: `django_resaas/users/${userId}/userEntitys/` })
          )

          this.userEntitys = data || []
          setStorage('l', 'userEntitys', JSON.stringify(data))

        } catch (e) {
          console.error('getUserEntitys error', e)
        }
      },

      // ===============================
      // SELECT ENTIDADE
      // ===============================
      async select(entity) {
        if (!entity) return

        const User = useUserStore()
        const Branch = useBranchStore()

        User.Entity = entity

        setStorage('l', 'userEntity', JSON.stringify(entity))

        await this.getLayoutSettings(entity.id)
        await Branch.getUserBranchs()
      },


      // ===============================
      // LOAD DIRETO
      // ===============================
      async getApps() {
        const User = useUserStore()
        if (!User.Entity?.id) return

        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `django_resaas/entitys/${User.Entity.id}/resaasapps/` })
        )

        this.Apps = data || []
      },

      async getModelos() {
        const User = useUserStore()
        if (!User.Entity?.id) return

        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `django_resaas/entitys/${User.Entity.id}/models` })
        )

        this.Modelos = data || []
      },
      

      async select_ (entity, q) {
        const User = useUserStore()
        const Branch = useBranchStore()
        User.Entity = entity
        await this.getLayoutSettings(entity.id)
        setStorage('l', 'userEntity', JSON.stringify(entity))
        Branch.getUserBranchs_(q)
      },

      async select (entity) {
        const User = useUserStore()
        const Branch = useBranchStore()
        User.Entity = entity
        await this.getLayoutSettings(entity.id)
        setStorage('l', 'userEntity', JSON.stringify(entity))
        Branch.getUserBranchs()
      },

      async getUserEntitys_ (UserId, q) {
        const User = useUserStore()
        if (!UserId) return

        try {
          const res = await HTTPAuth.get(
            url({
              type: 'u',
              url: `django_resaas/users/${UserId}/userEntitys/`,
              params: {}
            })
          )

          setStorage('l', 'userEntitys', JSON.stringify(res.data))
          this.s = res.data

          if (res.data.length === 1) {
            this.select_(res.data[0], q)
          } else {
            if (res.data.length === 0) {

              User.redirect = 'welcome'
              return
            }
            const entitys = res.data.map(e => ({
              label: profileSplint(e.name),
              value: e
            }))

            q.dialog({
              title: tdc('Seleccione a Entity'),
              options: {
                type: 'radio',
                model: 'opt1',
                items: entitys
              },
              cancel: true,
              persistent: true
            }).onOk(data => this.select_(data, q))
            .onCancel(() => {

              User.redirect = 'welcome'
            })
          }
        } catch (err) {
          console.error(err)
        }
      },


    }
  }
)
