import { describe, it, expect, vi, beforeEach } from 'vitest'
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
    const w = mountBrand({ to: { name: 'dashboard' } })

    await w.find('[data-test="header-brand"]').trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'dashboard' })
  })

  it('the logo and the name are part of the same clickable brand', async () => {
    const w = mountBrand({ to: { name: 'dashboard' } })

    await w.find('img').trigger('click')
    await w.find('label').trigger('click')

    expect(push).toHaveBeenCalledTimes(2)
  })

  it('is keyboard accessible (link role, focusable, Enter)', async () => {
    const w = mountBrand({ to: { name: 'dashboard' } })
    const brand = w.find('[data-test="header-brand"]')

    expect(brand.attributes('role')).toBe('link')
    expect(brand.attributes('tabindex')).toBe('0')

    await brand.trigger('keydown.enter')
    expect(push).toHaveBeenCalledWith({ name: 'dashboard' })
  })

  it('shows the entity type instead when there is no entity', () => {
    const user = useUserStore()
    user.Entity = null
    user.EntityType = { name: 'Hospital', icon: { url: 'http://x/i.png' } }

    const w = mountBrand({ to: { name: 'dashboard' } })

    expect(w.text()).toContain('Hospital')
  })

  it('without `to` (login layout) it is a plain, non-interactive brand', async () => {
    const w = mountBrand()
    const brand = w.find('[data-test="header-brand"]')

    await brand.trigger('click')

    expect(push).not.toHaveBeenCalled()
    expect(brand.attributes('role')).toBeUndefined()
    expect(brand.classes()).not.toContain('cursor-pointer')
  })

  it('a long name stays on one line with an ellipsis (header height unchanged)', () => {
    useUserStore().Entity = { name: '[DEMO] Farmácia Demo Chandkheda com um nome muito comprido' }

    const name = mountBrand({ to: { name: 'dashboard' } }).find('[data-test="header-brand-name"]')

    expect(name.classes()).toContain('ellipsis')
    expect(name.text()).toContain('[DEMO] Farmácia Demo Chandkheda com um nome muito comprido')
  })
})
