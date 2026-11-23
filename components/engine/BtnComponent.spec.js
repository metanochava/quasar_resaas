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

describe('s-btn: Cancel / Close / Reset carry a suggestive icon', () => {
  const iconOf = w => w.find('.q-icon').exists() ? w.find('.q-icon').text() : null
  it('without an icon of their own', () => {
    expect(iconOf(mountBtn({ label: 'Cancel' }))).toBe('close')
    expect(iconOf(mountBtn({ label: 'Close' }))).toBe('close')
    expect(iconOf(mountBtn({ label: 'Reset' }))).toBe('restart_alt')
  })
  it('an icon given wins; other buttons get none', () => {
    expect(iconOf(mountBtn({ label: 'Cancel', icon: 'arrow_back' }))).toBe('arrow_back')
    expect(iconOf(mountBtn({ label: 'Save' }))).toBe(null)
  })
})

describe('s-btn: the translated label gets the icon too', () => {
  it('"Cancelar" (tdc("Cancel")) still gets close', async () => {
    vi.resetModules()
    vi.doMock('../../services/translation', () => ({ tdc: t => ({ Cancel: 'Cancelar', Reset: 'Repor', Close: 'Fechar' }[t] || t) }))
    const { default: Translated } = await import('./BtnComponent.vue')
    const w = mount(Translated, { attrs: { label: 'Repor' }, global: { plugins: [Quasar] } })
    expect(w.find('.q-icon').text()).toBe('restart_alt')
  })
})
