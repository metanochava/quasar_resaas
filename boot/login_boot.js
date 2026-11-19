import { useEntityStore } from "../stores/EntityStore"
import { useBranchStore } from "../stores/BranchStore"
import { useGroupStore } from "../stores/GroupStore"
import { useUserStore } from "../stores/UserStore"
import { HTTPAuth, url } from "../services/api"
import { getStorage, setStorage, deleteStorage } from "../services/storage"
import { storeResaasContext } from "../services/tenantContext"
import { entityTypeKey } from "../utils/entityTypeHost"
import { JSONSafeParse } from "../utils/json"

const storedId = key => JSONSafeParse(getStorage('l', key))?.id || null

function keepContext (User, context) {
  if (!context?.token) return
  storeResaasContext(context, { user: User.data, entity: User.Entity, branch: User.Branch, group: User.Group })
  User.ResaasContext = context.token
}

// The sign-in boot in ONE request (django_resaas resaas/boot/): the Entities
// of this site, and - when there is nothing to ask (the last choice made on
// this site, still allowed, else the only option) - the Branch, the profile,
// the context, permissions, menus and phone tabs. It replaces the chain of
// about ten requests in series (userEntitys -> context -> me -> userBranchs
// -> context -> userGroups -> context -> permissions -> menus). When a
// choice remains, the usual step takes over from there (its dialog).
// Returns false when it did nothing (the step-by-step chain then runs).
export async function bootSession (q) {
  const User = useUserStore()
  const Entity = useEntityStore()
  const Branch = useBranchStore()
  const Group = useGroupStore()

  let data
  try {
    ({ data } = await HTTPAuth.post(url({ type: 'u', url: 'resaas/boot/' }), {
      entity_type_name: entityTypeKey() || null,
      entity_id: storedId('userEntity'),
      branch_id: storedId('userBranch'),
      group_id: storedId('userGroup')
    }))
  } catch {
    return false
  }

  // no Entity, or several to choose from: the Entity step (and its dialog)
  if (!data?.entity) return false

  setStorage('l', 'userEntitys', JSON.stringify(data.entities || []))
  Entity.s = data.entities || []
  User.Entity = data.entity
  setStorage('l', 'userEntity', JSON.stringify(data.entity))
  const look = Entity.getLayoutSettings(data.entity.id)

  if (!data.branch) {
    User.Branch = null
    User.Group = null
    deleteStorage('l', 'userBranch')
    deleteStorage('l', 'userGroup')
    keepContext(User, data.context)
    // /me/'s look follows the context (User > Entity > EntityType)
    await Promise.all([look, User.me()])
    await Branch.getUserBranchs_(q)
    return true
  }

  setStorage('l', 'userBranchs', JSON.stringify(data.branches || []))
  Branch.row = data.branch
  User.Branch = data.branch
  setStorage('l', 'userBranch', JSON.stringify(data.branch))

  if (!data.group) {
    User.Group = null
    deleteStorage('l', 'userGroup')
    keepContext(User, data.context)
    await Promise.all([look, User.me()])
    await Group.getGroups_(q)
    return true
  }

  const groups = data.groups || []
  setStorage('l', 'userGroups', JSON.stringify(groups))
  Group.rows = groups
  User.Groups = groups
  Group.row = data.group
  User.Group = data.group
  setStorage('l', 'userGroup', JSON.stringify(data.group))
  keepContext(User, data.context)

  const permissions = data.permissions || []
  User.Permissions = new Set(permissions)
  setStorage('l', 'userPermissions', JSON.stringify(permissions))
  User.AllMenus = data.menus || []
  User.Menus = User.AllMenus
  User.MobileTabs = data.mobile_tabs || []

  await Promise.all([look, User.me()])
  User.redirect = 'welcome'
  return true
}

export async function loadUserSaas (q) {

  const User = useUserStore()
  const Entity = useEntityStore()

  // startSession() (its only callers: the login form and the SSO callback)
  // has just loaded /me/: asking again only cost a request
  if (!User.data?.id) await User.me()

  if (!User.data?.id) return

  if (await bootSession(q)) return

  await Entity.getUserEntitys_(User.data?.id, q)
}
