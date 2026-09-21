// Shared test setup for the Account Center specs (not a spec itself).
import { mount } from '@vue/test-utils'
import { Quasar, Dialog } from 'quasar'

import BtnComponent from '../../engine/BtnComponent.vue'
import InputComponent from '../../engine/InputComponent.vue'
import CardComponent from '../../engine/CardComponent.vue'
import TooltipComponent from '../../engine/TooltipComponent.vue'
import ModalCard from '../../engine/ModalCard.vue'

export const selectStub = { name: 's-select', props: ['modelValue', 'options'], template: '<div class="stub-select" />' }

export function globalConfig(pinia, extra = {}) {
  return {
    plugins: [[Quasar, { plugins: { Dialog } }], pinia],
    components: {
      's-btn': BtnComponent,
      's-input': InputComponent,
      's-card': CardComponent,
      's-tooltip': TooltipComponent,
      's-modal-card': ModalCard,
      's-select': selectStub
    },
    ...extra
  }
}

const mounted = []

// unmount everything mounted through mountWith(): dialogs teleport into portals
// that Quasar tears down on unmount - wiping <body> by hand leaves later tests
// rendering into orphaned portals
export function unmountAll() {
  while (mounted.length) mounted.pop().unmount()
  document.body.innerHTML = ''
}

export function mountWith(component, pinia, options = {}) {
  const wrapper = mount(component, {
    global: globalConfig(pinia, options.global),
    attachTo: document.body,
    ...options,
    ...(options.global ? { global: globalConfig(pinia, options.global) } : {})
  })

  mounted.push(wrapper)
  return wrapper
}

// q-dialog teleports to <body>
export const inBody = (selector) => document.body.querySelector(selector)
export const clickInBody = async (selector, flush) => {
  inBody(selector).click()
  await flush()
}
export const setInBody = async (selector, value, flush) => {
  const el = inBody(selector)
  el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
  await flush()
}
