import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'


import { sDialog } from '../../services/dialog'
import { globalConfig } from '../user/account/_helpers'
import { inBody } from '../user/account/_helpers'

let app

beforeEach(() => {
  const pinia = createPinia()
  setActivePinia(pinia)
  // the Dialog plugin needs an installed Quasar app to render into
  app = mount({ template: '<div />' }, { global: globalConfig(pinia), attachTo: document.body })
})

afterEach(() => {
  app.unmount()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

const click = async (selector) => {
  inBody(selector).click()
  await flushPromises()
  // cancel / dismiss fire once the dialog has finished hiding (its transition)
  await new Promise(resolve => setTimeout(resolve, 500))
}

describe('sDialog', () => {
  it('renders the RESAAS modal: q-bar header with the title, message, static footer', async () => {
    sDialog({ title: 'Discard changes?', message: 'You will lose it.', cancel: true })
    await flushPromises()

    expect(inBody('.q-bar [data-test="modal-title"]').textContent).toBe('Discard changes?')
    expect(inBody('[data-test="dialog-message"]').textContent).toBe('You will lose it.')
    expect(inBody('[data-test="modal-footer"] [data-test="dialog-ok"]')).not.toBeNull()
    expect(inBody('[data-test="modal-footer"] [data-test="dialog-cancel"]')).not.toBeNull()
  })

  it('OK resolves onOk, Cancel resolves onCancel', async () => {
    const onOk = vi.fn()
    const onCancel = vi.fn()

    sDialog({ title: 'Sure?', cancel: true }).onOk(onOk).onCancel(onCancel)
    await flushPromises()
    await click('[data-test="dialog-ok"]')
    expect(onOk).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()

    sDialog({ title: 'Sure?', cancel: true }).onCancel(onCancel)
    await flushPromises()
    await click('[data-test="dialog-cancel"]')
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('takes the custom button labels and colours the plugin call sites already pass', async () => {
    sDialog({
      title: 'End session',
      ok: { label: 'End session', color: 'negative', flat: true },
      cancel: { label: 'Keep it', flat: true }
    })
    await flushPromises()

    expect(inBody('[data-test="dialog-ok"]').textContent.trim()).toBe('End session')
    expect(inBody('[data-test="dialog-cancel"]').textContent.trim()).toBe('Keep it')
  })

  it('a choice dialog resolves with the selected model', async () => {
    const onOk = vi.fn()

    sDialog({
      title: 'Select the Branch',
      cancel: true,
      options: { type: 'radio', model: 'a', items: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }] }
    }).onOk(onOk)
    await flushPromises()

    document.body.querySelectorAll('[data-test="dialog-choice"] .q-radio')[1].click()
    await flushPromises()
    await click('[data-test="dialog-ok"]')

    expect(onOk).toHaveBeenCalledWith('b')
  })

  it('a prompt resolves with the typed text and is blocked until it is valid', async () => {
    const onOk = vi.fn()

    sDialog({
      title: 'Reject sample',
      cancel: true,
      prompt: { model: '', type: 'textarea', label: 'Reason', isValid: (v) => !!v?.trim() }
    }).onOk(onOk)
    await flushPromises()

    expect(inBody('[data-test="dialog-ok"]').disabled).toBe(true)
    const input = document.body.querySelector('.q-dialog textarea')
    input.value = 'Haemolysed'
    input.dispatchEvent(new Event('input'))
    await flushPromises()
    await click('[data-test="dialog-ok"]')

    expect(onOk).toHaveBeenCalledWith('Haemolysed')
  })

  it('the bar close button cancels', async () => {
    const onCancel = vi.fn()
    sDialog({ title: 'Sure?' }).onCancel(onCancel)
    await flushPromises()

    await click('[data-test="modal-close"]')

    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
