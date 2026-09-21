import { Dialog } from 'quasar'

import DialogPrompt from '../components/engine/DialogPrompt.vue'

// Confirmation / choice dialogs in the RESAAS modal pattern (q-bar header,
// static footer). Drop-in for Quasar's `$q.dialog({...})` / `Dialog.create({...})`:
// same options (title, message, persistent, ok, cancel, options), same chain
// (`.onOk(value)`, `.onCancel()`, `.onDismiss()`), but rendered by
// components/engine/DialogPrompt.vue. Never call Quasar's own dialog for a modal.
export function sDialog(options = {}) {
  return Dialog.create({ component: DialogPrompt, componentProps: options })
}
