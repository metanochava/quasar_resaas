import { tdc } from '../services/translation'
import { profileSplint } from './profile'

// A Group's name is data (Root, Admin, "Registered Nurse", ...) but its
// canonical value is an English key - every place that SHOWS a group
// (selectors, menus, modals, tables, messages) must go through this so it
// appears in the user's language. Never use it for what is sent to the API
// or compared/searched: those keep the raw name.
export function groupLabel(group) {
  const raw = typeof group === 'string'
    ? group
    : (group?.name ?? group?.label ?? group?.value ?? '')

  const name = profileSplint(String(raw ?? ''))

  return name ? tdc(name) : ''
}
