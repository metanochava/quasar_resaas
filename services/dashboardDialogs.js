// Dialogs opened by dashboard actions of type "dialog" (services/dashboardActions.js).
//
// A module registers the component once, by name:
//   registerDashboardDialog('saude.record_vital_signs', VitalSignsDialog)
// and its dashboard.py declares the action:
//   {"type": "dialog", "dialog": "saude.record_vital_signs", "permissions": [...]}
//
// DashboardDialogHost.vue (inside DashboardRenderer) renders the open one with
// props { modelValue, context, action }: `context` is the row/item the action
// was run on. When the dialog emits "saved", the dashboard's widgets reload.
// Opening a dialog is navigation only: the backend already filtered the action
// by permission and still authorizes whatever the dialog sends.
import { markRaw, shallowRef } from 'vue'

// One registry and one "open dialog" per page, whatever copy of this module
// is running: the app may import quasar_resaas through Vite's prebundle
// while the dashboard components come from the source files (auto-imports),
// two module instances. Same Symbol.for pattern as services/dashboardRegistry.js.
const DIALOGS_KEY = Symbol.for('quasar_resaas.dashboardDialogs')
const OPEN_KEY = Symbol.for('quasar_resaas.dashboardDialogs.open')

if (!globalThis[DIALOGS_KEY]) globalThis[DIALOGS_KEY] = {}
if (!globalThis[OPEN_KEY]) globalThis[OPEN_KEY] = shallowRef(null)

const dialogs = globalThis[DIALOGS_KEY]

export function registerDashboardDialog(name, component) {
  dialogs[name] = markRaw(component)
}

export function getDashboardDialog(name) {
  return dialogs[name] || null
}

// the dialog on screen: { component, action, context, onSaved } | null
export const openDialog = globalThis[OPEN_KEY]

export function openDashboardDialog(action, { context = null, onSaved = null } = {}) {
  const component = getDashboardDialog(action?.dialog)
  if (!component) {
    console.warn(`[DashboardDialogs] no dialog registered as '${action?.dialog}'`)
    return false
  }
  openDialog.value = { component, action, context, onSaved }
  return true
}

export function closeDashboardDialog() {
  openDialog.value = null
}
