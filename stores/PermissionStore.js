import { createBaseStore } from '../base/base_store'
import { HTTPAuth, url } from '../services/api'

export const usePermissionStore = createBaseStore(
  'permission',
  { app: 'auth', model: 'Permission' },
  {
    // the permission search of the group editor survives F5 (UX only: the
    // permissions themselves are never persisted - base/persistence.js)
    persist: {
      include: ['search'],
      scope: 'user',
      ttl: 7 * 24 * 60 * 60 * 1000
    },

    state: () => ({
      allPermissions: [],
      groupPermissions: [],
      originalGroupPermissions: [],
      group: null,
      apps: {},
      search: '',
      loadingPermission: false,
      dirty: false
    }),

    actions: {
      initPermissions(all, groupPerms, group) {
        this.allPermissions = [...(all || [])]
        this.groupPermissions = [...(groupPerms || [])]
        this.originalGroupPermissions = [...(groupPerms || [])]
        this.group = group || null
        this.loadingPermission = false
        this.dirty = false
        this.buildApps()
      },

      buildApps() {
        const search = (this.search || '').toLowerCase()

        const grouped = this.allPermissions
          .filter((permission) => {
            if (!search) return true

            const label = (
              permission.content_type?.label || ''
            ).toLowerCase()

            const codename = (
              permission.codename || ''
            ).toLowerCase()

            return label.includes(search) || codename.includes(search)
          })
          .reduce((apps, permission) => {
            const [app = 'No App', model = 'No Model'] = (
              permission.content_type?.label || 'No App | No Model'
            )
              .split('|')
              .map((value) => value.trim())

            apps[app] ||= {}
            apps[app][model] ||= []
            apps[app][model].push(permission)

            return apps
          }, {})

        this.apps = Object.fromEntries(
          Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([app, models]) => [
              app,
              Object.fromEntries(
                Object.entries(models).sort(([a], [b]) =>
                  a.localeCompare(b)
                )
              )
            ])
        )
      },

      hasPermission(id) {
        return this.groupPermissions.some(
          (permission) => String(permission.id) === String(id)
        )
      },

      permissionState(permissions) {
        const total = permissions.length
        const checked = permissions.filter((permission) =>
          this.hasPermission(permission.id)
        ).length

        return {
          checked: total > 0 && checked === total,
          indeterminate: checked > 0 && checked < total
        }
      },

      appState(models) {
        return this.permissionState(Object.values(models).flat())
      },

      modelState(permissions) {
        return this.permissionState(permissions)
      },

      toggle(permission) {
        if (!permission) return

        this.groupPermissions = this.hasPermission(permission.id)
          ? this.groupPermissions.filter(
              (item) => String(item.id) !== String(permission.id)
            )
          : [...this.groupPermissions, permission]

        this.updateDirtyState()
      },

      toggleModel(permissions, state) {
        this.toggleMany(permissions, state)
      },

      toggleApp(models, state) {
        this.toggleMany(Object.values(models).flat(), state)
      },

      toggleMany(permissions, state) {
        const selected = new Map(
          this.groupPermissions.map((permission) => [
            String(permission.id),
            permission
          ])
        )

        for (const permission of permissions || []) {
          const id = String(permission.id)
          state ? selected.set(id, permission) : selected.delete(id)
        }

        this.groupPermissions = [...selected.values()]
        this.updateDirtyState()
      },

      updateDirtyState() {
        const ids = (permissions) =>
          permissions.map(({ id }) => String(id)).sort()

        const current = ids(this.groupPermissions)
        const original = ids(this.originalGroupPermissions)

        this.dirty =
          current.length !== original.length ||
          current.some((id, index) => id !== original[index])
      },

      resetChanges() {
        this.groupPermissions = [...this.originalGroupPermissions]
        this.dirty = false
      },

      async saveGroupPermissions() {
        if (!this.group?.id) return false
        if (!this.dirty) return true

        this.loadingPermission = true

        try {
          const permissions = [
            ...new Set(
              this.groupPermissions.map((permission) => permission.id)
            )
          ]

          await HTTPAuth.post(
            url({
              type: 'u',
              url: 'auth/permissions/setGroupPermissions/'
            }),
            {
              group: this.group.id,
              permissions
            }
          )

          this.originalGroupPermissions = [...this.groupPermissions]
          this.group.permissions = [...this.groupPermissions]
          this.dirty = false

          return true
        } catch (error) {
          console.error('Error saving group permissions:', error)
          throw error
        } finally {
          this.loadingPermission = false
        }
      }
    }
  }
)