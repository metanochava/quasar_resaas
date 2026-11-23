import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'

vi.mock('../../stores/UserStore', () => ({ useUserStore: () => ({ ps: {}, can: () => true }) }))
vi.mock('../../services/translation', () => ({ tdc: t => t }))
vi.mock('vue-router', () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }))
vi.mock('../engine/FormComponent.vue', () => ({ default: { template: '<div class="form-stub" />' } }))
vi.mock('../../components/auto/ActionForm.vue', () => ({ default: { props: ['store', 'reform', 'buttons'], template: '<div data-test="action-form" />' } }))

import FormTwo from './FormTwo.vue'

const stubs = { 's-card': { template: '<div><slot /></div>' }, 's-btn': { template: '<button />' } }
const store = { model: 'Printer', form: {} }
const mountForm = (slots = {}) => mount(FormTwo, { props: { store }, slots, global: { plugins: [Quasar], stubs } })

describe('FormTwo: the buttons in one place', () => {
  it('with the bottom bar (ActionForm) there are no buttons at the top', () => {
    const w = mountForm()
    expect(w.find('[data-test="action-form"]').exists()).toBe(true)
    expect(w.find('[data-test="form-two-top-buttons"]').exists()).toBe(false)
  })

  it('a page with its own footer keeps them at the top', () => {
    const w = mountForm({ footer: '<div class="own-footer" />' })
    expect(w.find('[data-test="action-form"]').exists()).toBe(false)
    expect(w.find('[data-test="form-two-top-buttons"]').exists()).toBe(true)
  })
})
