import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'

const q = vi.hoisted(() => ({ screen: { xs: false } }))
vi.mock('quasar', async (original) => ({ ...(await original()), useQuasar: () => q }))
vi.mock('../../stores/UserStore', () => ({ useUserStore: () => ({ ps: {} }) }))
vi.mock('../../services/translation', () => ({ tdc: t => t }))

import Btn from './BtnComponent.vue'

const mountBtn = (attrs, slots = {}) => mount(Btn, { attrs, slots, global: { plugins: [Quasar], stubs: { 'q-tooltip': { template: '<span class="tip"><slot /></span>' } } } })

beforeEach(() => { q.screen.xs = false })

describe('s-btn on a small screen: icon only', () => {
  it('a large screen keeps the text', () => {
    expect(mountBtn({ label: 'Save', icon: 'save' }).find('.q-btn__content > .block').text()).toBe('Save')
  })

  it('a phone shows only the icon; the text becomes the tooltip', () => {
    q.screen.xs = true
    const w = mountBtn({ label: 'Save', icon: 'save' })
    expect(w.find('.q-btn__content > .block').exists()).toBe(false)   // q-btn's label
    expect(w.find('.tip').text()).toBe('Save')
  })

  it('a button with its own tooltip keeps it; one without an icon keeps its text; keep-label opts out', () => {
    q.screen.xs = true
    const own = mountBtn({ label: 'Save', icon: 'save' }, { default: '<span class="own">Save the record</span>' })
    expect(own.findAll('.tip')).toHaveLength(0)
    expect(own.find('.own').exists()).toBe(true)
    expect(mountBtn({ label: 'Save' }).text()).toContain('Save')
    expect(mountBtn({ label: 'Save', icon: 'save', 'keep-label': '' }).text()).toContain('Save')
  })
})
