import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

import HeaderSite from './HeaderSite.vue'
import BtnComponent from '../engine/BtnComponent.vue'
import TooltipComponent from '../engine/TooltipComponent.vue'
import { useUserStore } from '../../stores/UserStore'

const SITE = 'https://docodela.dev.mytech.co.mz/'
let open

const mountButton = () => mount(HeaderSite, {
  global: { plugins: [Quasar], components: { 's-btn': BtnComponent, 's-tooltip': TooltipComponent } }
})

beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
  open = vi.spyOn(window, 'open').mockImplementation(() => null)
})

afterEach(() => {
  vi.useRealTimers()
  open.mockRestore()
})

describe('HeaderSite - the Entity website button', () => {
  it('is hidden when the Entity has no site', () => {
    useUserStore().Entity = { name: 'X' }

    expect(mountButton().find('[data-test="header-site"]').exists()).toBe(false)
  })

  it('is hidden for a site that is not an http(s) URL', () => {
    useUserStore().Entity = { name: 'X', site: 'javascript:alert(1)' }

    expect(mountButton().find('[data-test="header-site"]').exists()).toBe(false)
  })

  it('uses a globe icon and opens the site in this tab on one click', async () => {
    useUserStore().Entity = { name: 'Docodela', site: SITE }
    const button = mountButton().find('[data-test="header-site"]')

    expect(button.text()).toContain('public')
    await button.trigger('click')
    vi.advanceTimersByTime(300)

    expect(open).toHaveBeenCalledWith(SITE, '_self')
  })

  it('opens only a new tab on a double click', async () => {
    useUserStore().Entity = { name: 'Docodela', site: SITE }
    const button = mountButton().find('[data-test="header-site"]')

    await button.trigger('click')
    await button.trigger('click')
    await button.trigger('dblclick')
    vi.advanceTimersByTime(300)

    expect(open).toHaveBeenCalledTimes(1)
    expect(open).toHaveBeenCalledWith(SITE, '_blank', 'noopener')
  })
})
