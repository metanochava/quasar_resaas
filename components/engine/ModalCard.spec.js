import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { h } from 'vue'

import ModalCard from './ModalCard.vue'
import { mountWith, unmountAll, inBody, clickInBody } from '../user/account/_helpers'

let pinia

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
})

afterEach(() => {
  vi.restoreAllMocks()
  unmountAll()
})

function open(props = {}, slots = {}) {
  const Wrapper = {
    render() {
      return h(ModalCard, { title: 'Change password', icon: 'key', ...props }, { default: () => h('p', { 'data-test': 'content' }, 'Body text'), ...slots })
    }
  }

  return mountWith(Wrapper, pinia)
}

describe('ModalCard', () => {
  it('always has the static q-bar header with the title and an icon', () => {
    const wrapper = open()

    expect(wrapper.find('.q-bar').exists()).toBe(true)
    expect(wrapper.find('[data-test="modal-title"]').text()).toBe('Change password')
    expect(wrapper.find('.q-bar .q-icon').text()).toBe('key')
  })

  it('has no footer unless one is given, and a static footer when it is', () => {
    expect(open().find('[data-test="modal-footer"]').exists()).toBe(false)

    const withFooter = open({}, { footer: () => h('span', { 'data-test': 'footer-btn' }, 'Save') })
    expect(withFooter.find('[data-test="modal-footer"] [data-test="footer-btn"]').exists()).toBe(true)
  })

  it('the header and the footer sit OUTSIDE the scrolling body', () => {
    const wrapper = open({}, { footer: () => h('span', 'Save') })
    const body = wrapper.find('[data-test="modal-body"]').element

    expect(body.contains(wrapper.find('.q-bar').element)).toBe(false)
    expect(body.contains(wrapper.find('[data-test="modal-footer"]').element)).toBe(false)
    expect(body.contains(wrapper.find('[data-test="content"]').element)).toBe(true)
  })

  it('emits close when the close button is used (the parent then decides)', async () => {
    const onClose = vi.fn()
    const wrapper = open({ onClose })

    await wrapper.find('[data-test="modal-close"]').trigger('click')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('a step that must not be dismissed has no close button', () => {
    expect(open({ closable: false }).find('[data-test="modal-close"]').exists()).toBe(false)
  })

  it('the close button can be disabled while busy', () => {
    expect(open({ closeDisable: true }).find('[data-test="modal-close"]').attributes('disabled')).toBeDefined()
  })

  it('fullscreen fills the dialog; otherwise the height is capped so header and footer stay reachable', () => {
    expect(open({ fullscreen: true }).find('[data-test="modal-card"]').attributes('style')).toContain('height: 100%')
    expect(open({ width: '520px' }).find('[data-test="modal-card"]').attributes('style')).toContain('max-height: 94vh')
  })

  it('form wraps body and footer so a footer submit button submits it', async () => {
    const onSubmit = vi.fn()
    const wrapper = open({ form: true, onSubmit }, { footer: () => h('button', { type: 'submit', 'data-test': 'go' }, 'Go') })

    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('form [data-test="modal-footer"]').exists()).toBe(true)
    expect(wrapper.find('form .q-bar').exists()).toBe(false)

    await wrapper.find('form').trigger('submit')
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
