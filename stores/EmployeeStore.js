import { createBaseStore } from '../base/base_store'
import { HTTPAuth, HTTPClient, url } from '../boot/api'
import { useBranchStore } from './BranchStore'
import { useUserStore } from './UserStore'
import { perfilSplint, tdc } from '../boot/base'
import { getStorage, setStorage } from '../boot/storage'

export const useEmployeeStore = createBaseStore(
  'employee',
  {
    app: 'django_resaas',
    model: 'Employee'
  },
  {
    state: () => ({
      Theme: {},
      LayoutSettings: {},
      AnimationSettings: {},
      Typography: {},
      Apps: [],
      Modelos: [],
      userEmployees: [],


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
          const { data } = await HTTPClient.get(url({ type: "u", url: "api/site" }))

          this.Theme = data.theme || {}
          this.LayoutSettings = data.layout_settings || {}
          this.AnimationSettings = data.animation_settings || {}
          this.Typography = data.typography || {}
          User.Employee = data.employee || null

          

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

            async loadGroups(EmployeeId) {
              try {
                const id = EmployeeId || this.row?.id
                if (!id) return
      
                this.loadingGroups = true
      
                const [all, selected] = await Promise.all([
                  HTTPClient.get(url({
                    type: 'u',
                    url: `api/django_resaas/employeetypes/${this.row?.employee_type?.id}/groups/`
                  })),
                  HTTPClient.get(url({
                    type: 'u',
                    url: `api/django_resaas/employees/${id}/groups/`
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
      
                await HTTPClient.post(
                  url({
                    type: 'u',
                    url: `api/django_resaas/employees/${id}/${endpoint}/`
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
                    url: `api/django_resaas/employees/${id}/createGroup/`
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
      async setEmployeeModelos(employeeId) {
        const User = useUserStore()
        try {
          const id = employeeId || User.Employee?.id
          if (!id) return

          const { data } = await HTTPAuth.get(
            url({ type: 'u', url: `api/django_resaas/employees/${id}/models` })
          )

          this.Modelos = data || []

          if (employeeId) {
            useUserStore().EmployeeModelos = this.Modelos
          }

        } catch (e) {
          console.error('setEmployeeModelos error', e)
        }
      },

      // ===============================
      // MODULOS
      // ===============================
      async setEmployeeApps(employeeId) {
        const User = useUserStore()
        try {
          const id = employeeId || User.Employee?.id
          if (!id) return

          const { data } = await HTTPAuth.get(
            url({ type: 'u', url: `api/django_resaas/employees/${id}/apps/` })
          )

          this.Apps = data || []

          if (employeeId) {
            const User = useUserStore()
            User.Apps = this.Apps
            setStorage('l', 'employeeApps', JSON.stringify(data))
          }

        } catch (e) {
          console.error('setEmployeeApps error', e)
        }
      },

      // ===============================
      // LAYOUT / THEME
      // ===============================
      async getLayoutSettings(employeeId) {
        const User = useUserStore()
        try {
          const id = employeeId || User.Employee?.id
          if (!id) return

          const [theme, layout, typography, animation] = await Promise.all([
            HTTPAuth.get(url({ type: 'u', url: `api/django_resaas/employees/${id}/themeGet/` })),
            HTTPAuth.get(url({ type: 'u', url: `api/django_resaas/employees/${id}/layoutSettingsGet/` })),
            HTTPAuth.get(url({ type: 'u', url: `api/django_resaas/employees/${id}/typographyGet/` })),
            HTTPAuth.get(url({ type: 'u', url: `api/django_resaas/employees/${id}/animationSettingsGet/` }))
          ])

          this.Theme = theme.data || {}
          this.LayoutSettings = layout.data || {}
          this.Typography = typography.data || {}
          this.AnimationSettings = animation.data || {}

          setStorage('l', 'EmployeeTheme', JSON.stringify(this.Theme))
          setStorage('l', 'EmployeeLayoutsettings', JSON.stringify(this.LayoutSettings))
          setStorage('l', 'EmployeeTypography', JSON.stringify(this.Typography))
          setStorage('l', 'EmployeeAnimationSettings', JSON.stringify(this.AnimationSettings))

          if (employeeId) {
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
      async getUserEmployees(userId) {
        if (!userId) return

        try {
          const { data } = await HTTPAuth.get(
            url({ type: 'u', url: `api/django_resaas/users/${userId}/userEmployees/` })
          )

          this.userEmployees = data || []
          setStorage('l', 'userEmployees', JSON.stringify(data))

        } catch (e) {
          console.error('getUserEmployees error', e)
        }
      },

      // ===============================
      // SELECT ENTIDADE
      // ===============================
      async select(employee) {
        if (!employee) return

        const User = useUserStore()
        const Branch = useBranchStore()

        User.Employee = employee

        setStorage('l', 'userEmployee', JSON.stringify(employee))

        await this.getLayoutSettings(employee.id)
        await Branch.getUserBranchs()
      },


      // ===============================
      // LOAD DIRETO
      // ===============================
      async getApps() {
        const User = useUserStore()
        if (!User.Employee?.id) return

        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/employees/${User.Employee.id}/resaasapps/` })
        )

        this.Apps = data || []
      },

      async getModelos() {
        const User = useUserStore()
        if (!User.Employee?.id) return

        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/employees/${User.Employee.id}/models` })
        )

        this.Modelos = data || []
      },
      

      async select_ (employee, q) {
        const User = useUserStore()
        const Branch = useBranchStore()
        User.Employee = employee
        await this.getLayoutSettings(employee.id)
        setStorage('l', 'userEmployee', JSON.stringify(employee))
        Branch.getUserBranchs_(q)
      },

      async select (employee) {
        const User = useUserStore()
        const Branch = useBranchStore()
        User.Employee = employee
        await this.getLayoutSettings(employee.id)
        setStorage('l', 'userEmployee', JSON.stringify(employee))
        Branch.getUserBranchs()
      },

      async getUserEmployees_ (UserId, q) {
        const User = useUserStore()
        if (!UserId) return

        try {
          const res = await HTTPAuth.get(
            url({
              type: 'u',
              url: `api/django_resaas/users/${UserId}/userEmployees/`,
              params: {}
            })
          )

          setStorage('l', 'userEmployees', JSON.stringify(res.data))
          this.s = res.data

          if (res.data.length === 1) {
            this.select_(res.data[0], q)
          } else {
            if (res.data.length === 0) {

              User.redirect = 'welcome'
              return
            }
            const employees = res.data.map(e => ({
              label: perfilSplint(e.name),
              value: e
            }))

            q.dialog({
              title: tdc('Seleccione a Employee'),
              options: {
                type: 'radio',
                model: 'opt1',
                items: employees
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
