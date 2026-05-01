import { createBaseStore } from '../base/base_store'
import { HTTPClient, url } from '../boot/api'

export const usePermissionStore = createBaseStore(
  'permission',
  {
    url: 'api/auth/permissions',
    app: 'auth',
    model: 'Permission'
  },
  {
    state: () => ({
      allPermissions: [],
      groupPermissions: [],
      group: null,

      apps: {},
      search: '',
      loadingPermission: false
    }),

    actions: {

      // INIT
      initPermissions(all, groupPerms, group) {
        this.allPermissions = all || []
        this.groupPermissions = groupPerms || []
        this.group = group || null

        this.buildApps()
      },

      // 🔥 BUILD CORRIGIDO (USA content_type.label)
      buildApps() {
        const search = (this.search || '').toLowerCase()

        const list = this.allPermissions.filter(p => {
          const label = (p.content_type?.label || '').toLowerCase()
          const codename = (p.codename || '').toLowerCase()

          if (!search) return true

          return label.includes(search) || codename.includes(search)
        })

        const grouped = list.reduce((acc, item) => {

          // 🔥 EXTRAI APP E MODEL DO LABEL
          const label = item.content_type?.label || 'Sem App | Sem Modelo'
          const [app, model] = label.split('|').map(s => s.trim())

          const appName = app || 'Sem App'
          const modelName = model || 'Sem Modelo'

          if (!acc[appName]) acc[appName] = {}
          if (!acc[appName][modelName]) acc[appName][modelName] = []

          acc[appName][modelName].push(item)

          return acc
        }, {})

        // 🔥 ordenar apps e models
        this.apps = Object.fromEntries(
          Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([app, models]) => [
              app,
              Object.fromEntries(
                Object.entries(models).sort(([a], [b]) => a.localeCompare(b))
              )
            ])
        )
      },

      hasPermission(id) {
        return this.groupPermissions.some(p => p.id === id)
      },

      appState(models) {
        const all = Object.values(models).flat()
        const total = all.length
        const checked = all.filter(p => this.hasPermission(p.id)).length

        return {
          checked: checked === total && total > 0,
          indeterminate: checked > 0 && checked < total
        }
      },

      modelState(perms) {
        const total = perms.length
        const checked = perms.filter(p => this.hasPermission(p.id)).length

        return {
          checked: checked === total && total > 0,
          indeterminate: checked > 0 && checked < total
        }
      },

      toggleApp(models, state) {
        Object.values(models).forEach(perms => {
          perms.forEach(p => {
            const has = this.hasPermission(p.id)

            if (state && !has) this.toggle(p)
            if (!state && has) this.toggle(p)
          })
        })
      },

      async toggle(permission) {
        if (!this.group) return

        const exists = this.hasPermission(permission.id)
        this.loadingPermission = true

        const backup = [...this.groupPermissions]

        try {
          if (!exists) {
            await HTTPClient.post(
              url({ type: 'u', url: `api/auth/permissions/${permission.id}/addToGroup/` }),
              { id: this.group.id }
            )

            this.groupPermissions = [...this.groupPermissions, permission]

          } else {
            await HTTPClient.post(
              url({ type: 'u', url: `api/auth/permissions/${permission.id}/removeFromGroup/` }),
              { id: this.group.id }
            )

            this.groupPermissions = this.groupPermissions.filter(
              p => p.id !== permission.id
            )
          }

        } catch (e) {
          console.error(e)
          this.groupPermissions = backup
        }

        this.loadingPermission = false
      }
    }
  }
)