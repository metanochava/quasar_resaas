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

      // BUILD (APP → MODEL → PERMS)
      buildApps() {
        const list = this.search
          ? this.allPermissions.filter(p =>
              p.content_type_model
                .toLowerCase()
                .includes(this.search.toLowerCase())
            )
          : this.allPermissions

        this.apps = list.reduce((acc, item) => {
          const app = item.content_type_app
          const model = item.content_type_model

          if (!acc[app]) acc[app] = {}
          if (!acc[app][model]) acc[app][model] = []

          acc[app][model].push(item)

          return acc
        }, {})
      },

      // CHECK
      hasPermission(id) {
        return this.groupPermissions.some(p => p.id === id)
      },

      // 🔥 STATE APP
      appState(models) {
        const all = Object.values(models).flat()

        const total = all.length
        const checked = all.filter(p => this.hasPermission(p.id)).length

        return {
          checked: checked === total,
          indeterminate: checked > 0 && checked < total
        }
      },

      // 🔥 STATE MODEL
      modelState(perms) {
        const total = perms.length
        const checked = perms.filter(p => this.hasPermission(p.id)).length

        return {
          checked: checked === total,
          indeterminate: checked > 0 && checked < total
        }
      },

      // 🔥 TOGGLE APP
      toggleApp(models, state) {
        Object.values(models).forEach(perms => {
          perms.forEach(p => {
            const has = this.hasPermission(p.id)

            if (state && !has) this.toggle(p)
            if (!state && has) this.toggle(p)
          })
        })
      },

      // 🔥 TOGGLE
      async toggle(permission) {
        if (!this.group) return

        const exists = this.hasPermission(permission.id)
        this.loadingPermission = true

        const backup = [...this.groupPermissions]

        try {
          if (!exists) {
            await HTTPClient.post(
              url({
                type: 'u',
                url: `permissions/${permission.id}/addToGroup/`
              }),
              { id: this.group.id }
            )

            this.groupPermissions = [
              ...this.groupPermissions,
              permission
            ]

          } else {
            await HTTPClient.post(
              url({
                type: 'u',
                url: `permissions/${permission.id}/removeFromGroup/`
              }),
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