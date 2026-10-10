import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

import HeaderBrand from './HeaderBrand.vue'
import TooltipComponent from '../engine/TooltipComponent.vue'
import { useUserStore } from '../../stores/UserStore'

let push

function mountBrand(props = {}) {
  push = vi.fn()

  return mount(HeaderBrand, {
    props,
    global: {
      plugins: [[Quasar, {}]],
      components: { 's-tooltip': TooltipComponent },
      mocks: { $router: { push } }
    }
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  useUserStore().Entity = { name: 'Clinica Central', logo: { url: 'http://x/logo.png' } }
})

describe('HeaderBrand - logo and entity name as the way home', () => {
  it('a click on the brand opens the given route', async () => {
    const w = mountBrand({ to: { name: 'home' } })

    await w.find('[data-test="header-brand"]').trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'home' })
  })

  it('the logo and the name are part of the same clickable brand', async () => {
    const w = mountBrand({ to: { name: 'home' } })

    await w.find('img').trigger('click')
    await w.find('label').trigger('click')

    expect(push).toHaveBeenCalledTimes(2)
  })

  it('is keyboard accessible (link role, focusable, Enter)', async () => {
    const w = mountBrand({ to: { name: 'home' } })
    const brand = w.find('[data-test="header-brand"]')

    expect(brand.attributes('role')).toBe('link')
    expect(brand.attributes('tabindex')).toBe('0')

    await brand.trigger('keydown.enter')
    expect(push).toHaveBeenCalledWith({ name: 'home' })
  })

  it('shows the entity type instead when there is no entity', () => {
    const user = useUserStore()
    user.Entity = null
    user.EntityType = { name: 'Hospital', icon: { url: 'http://x/i.png' } }

    const w = mountBrand({ to: { name: 'home' } })

    expect(w.text()).toContain('Hospital')
  })

  it('without `to` and without a site (login layout) it is a plain, non-interactive brand', async () => {
    const w = mountBrand()
    const brand = w.find('[data-test="header-brand"]')

    await brand.trigger('click')

    expect(push).not.toHaveBeenCalled()
    expect(brand.attributes('role')).toBeUndefined()
    expect(brand.classes()).not.toContain('cursor-pointer')
  })

  describe('the Entity has a website', () => {
    const SITE = 'https://docodela.dev.mytech.co.mz/'
    let open

    beforeEach(() => {
      vi.useFakeTimers()
      open = vi.spyOn(window, 'open').mockImplementation(() => null)
      useUserStore().Entity = { name: 'Docodela', site: SITE, logo: { url: 'http://x/logo.png' } }
    })

    afterEach(() => {
      vi.useRealTimers()
      open.mockRestore()
    })

    it('one click opens the site in the same tab (not the home route)', async () => {
      const w = mountBrand({ to: { name: 'home' } })

      await w.find('[data-test="header-brand"]').trigger('click')
      vi.advanceTimersByTime(300)

      expect(open).toHaveBeenCalledWith(SITE, '_self')
      expect(open).toHaveBeenCalledTimes(1)
      expect(push).not.toHaveBeenCalled()
    })

    it('a double click opens the site in a new tab only', async () => {
      const w = mountBrand({ to: { name: 'home' } })
      const brand = w.find('[data-test="header-brand"]')

      await brand.trigger('click')
      await brand.trigger('click')
      await brand.trigger('dblclick')
      vi.advanceTimersByTime(300)

      expect(open).toHaveBeenCalledTimes(1)
      expect(open).toHaveBeenCalledWith(SITE, '_blank', 'noopener')
    })

    it('Enter opens the site in the same tab', async () => {
      const w = mountBrand({ to: { name: 'home' } })

      await w.find('[data-test="header-brand"]').trigger('keydown.enter')

      expect(open).toHaveBeenCalledWith(SITE, '_self')
    })

    it('is a link on the login layout too (no `to`)', async () => {
      const w = mountBrand()
      const brand = w.find('[data-test="header-brand"]')

      expect(brand.attributes('role')).toBe('link')
      await brand.trigger('click')
      vi.advanceTimersByTime(300)
      expect(open).toHaveBeenCalledWith(SITE, '_self')
    })

    it('ignores a site that is not an http(s) URL and falls back to the home route', async () => {
      useUserStore().Entity = { name: 'X', site: 'javascript:alert(1)' }
      const w = mountBrand({ to: { name: 'home' } })

      await w.find('[data-test="header-brand"]').trigger('click')
      await w.find('[data-test="header-brand"]').trigger('dblclick')

      expect(open).not.toHaveBeenCalled()
      expect(push).toHaveBeenCalledWith({ name: 'home' })
    })
  })
})
