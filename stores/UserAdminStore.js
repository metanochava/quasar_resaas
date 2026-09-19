import { groupLabel } from '../utils/groupLabel'
import { createBaseStore } from '../base/base_store'
import { HTTPAuth, url } from '../services/api'

// Generic CRUD store for admin management of ARBITRARY User records
// (list_user/add_user/change_user/view_user) - deliberately separate
// from stores/UserStore.js, which is the singleton holding the
// LOGGED-IN user's own session (access/refresh tokens, Entity, Branch,
// Group, Permissions). UserSEPage.vue/UserVPage.vue and
// GroupManagerUser.vue used to reuse useUserStore()'s generic
// createBaseStore .form/.row for this, which meant editing someone
// else's user record overwrote the admin's own session-shaped state
// on the same singleton. Every other rich model (Entity, Branch,
// Group, Permission) already has its own dedicated store - this
// follows the same convention for User.
export const useUserAdminStore = createBaseStore(
  'user_admin',
  {
    app: 'django_resaas',
    model: 'User'
  },
  {
    state: () => ({
      groups: [],
      selectedGroups: [],
      loadingGroups: false,
      groupSearch: ''
    }),

    getters: {
      hasGroup: (state) => (id) => {
        return state.selectedGroups.some(g => g.id === id)
      },

      filteredGroups(state) {
        const search = (state.groupSearch || '').toLowerCase()

        return state.groups.filter(group =>
          !search || `${group.name || ''} ${groupLabel(group)}`.toLowerCase().includes(search)
        )
      }
    },

    actions: {
      // Mirrors EntityStore.loadGroups()/toggleGroup() - same shape,
      // but against UserAPIView's own userGroups/addGroup/removeGroup
      // actions (django_resaas/saas/data/user/views/user.py), which
      // are scoped to the admin's CURRENT branch context
      // (request.branch_id), not a param - same tenant-scoping the
      // rest of this session's Group/Permission fixes rely on.
      async loadGroups(userId) {
        try {
          const id = this.row?.id || userId

          if (!id) return

          this.loadingGroups = true

          const [all, selected] = await Promise.all([
            HTTPAuth.get(
              url({ type: 'u', url: 'auth/groups/', params: { page_size: 0 } })
            ),
            HTTPAuth.get(
              url({ type: 'u', url: `${this.safeUrl}/${id}/userGroups/` })
            )
          ])

          this.groups = (all.data?.results || []).sort((a, b) =>
            String(a.name || '').localeCompare(String(b.name || ''))
          )

          this.selectedGroups = selected.data || []
        } catch (e) {
          console.error('UserAdminStore.loadGroups error', e)
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
            url({ type: 'u', url: `${this.safeUrl}/${id}/${endpoint}/` }),
            { group: group.id }
          )

          if (exists) {
            this.selectedGroups = this.selectedGroups.filter(g => g.id !== group.id)
          } else if (!this.hasGroup(group.id)) {
            this.selectedGroups = [...this.selectedGroups, group]
          }
        } catch (e) {
          console.error('UserAdminStore.toggleGroup error', e)
        }
      }
    }
  }
)
