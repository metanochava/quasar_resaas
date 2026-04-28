import { createBaseStore } from '../base/base_store'
import { HTTPAuth, HTTPClient, url } from '../boot/api'
import { useSucursalStore } from './SucursalStore'
import { useUserStore } from './UserStore'
import { perfilSplint, tdc } from '../boot/base'
import { getStorage, setStorage } from '../boot/storage'

export const usePermissionStore = createBaseStore(
  'permission',
  {
    url: 'api/auth/permissions',
    app: 'auth',
    model: 'Permission'
  },
  {
    // ===============================
    // STATE (SEM QUEBRAR PADRÃO)
    // ===============================
    state: () => ({
      allPermissions: [],
      groupPermissions: [],
      group: null,

      apps: {},
      search: '',
      loading: false
    }),

    // ===============================
    // ACTIONS
    // ===============================
    actions: {

      // --------------------------------
      // INIT (dados vindos do backend)
      // --------------------------------
      init(all, groupPerms, group) {
        this.allPermissions = all || []
        this.groupPermissions = groupPerms || []
        this.group = group || null

        this.buildApps()
      },

      // --------------------------------
      // BUILD UI (agrupamento por app)
      // --------------------------------
      buildApps() {
        const list = this.search
          ? this.allPermissions.filter(p =>
              p.content_type_model.toLowerCase().includes(this.search.toLowerCase())
            )
          : this.allPermissions

        this.apps = list.reduce((acc, item) => {
          if (!acc[item.content_type_app]) {
            acc[item.content_type_app] = []
          }
          acc[item.content_type_app].push(item)
          return acc
        }, {})
      },

      // --------------------------------
      // CHECK PERMISSION
      // --------------------------------
      hasPermission(id) {
        return this.groupPermissions.some(p => p.id === id)
      },

      // --------------------------------
      // TOGGLE (AUTO SAVE)
      // --------------------------------
      async toggle(permission) {
        if (!this.group) return

        const exists = this.hasPermission(permission.id)

        this.loading = true

        try {

          if (!exists) {
            await HTTPClient.post(
              url({
                type: 'u',
                url: `permissions/${permission.id}/addToGroup/`
              }),
              { id: this.group.id }
            )

            // update local state
            this.groupPermissions.push(permission)

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
          console.error('Permission toggle error', e)
        }

        this.loading = false
      }

    }
  }
)