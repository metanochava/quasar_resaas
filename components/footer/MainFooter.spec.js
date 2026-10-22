import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

// Comments pulls in the boot files (quasar/wrappers), not needed here
vi.mock('./Comments.vue', () => ({ default: { template: '<div />' } }))

import MainFooter from './MainFooter.vue'
import { useUserStore } from '../../stores/UserStore'

function mountFooter () {
  return mount(MainFooter, {
    global: {
      plugins: [[Quasar, {}]],
      stubs: { 'q-footer': { template: '<footer><slot /></footer>' }, Comments: true }
    }
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('MainFooter - one line, a long name is cut with an ellipsis', () => {
  it('the copyright stays on one line with the full text as its title', () => {
    useUserStore().Entity = {
      name: '[DEMO] Farmácia Demo Chandkheda com um nome muito comprido',
      created_at: '2024',
      entityType: { name: 'Farmacia' }
    }
    const copyright = mountFooter().find('[data-test="footer-copyright"]')

    expect(copyright.classes()).toEqual(expect.arrayContaining(['col', 'ellipsis']))
    expect(copyright.attributes('title')).toBe(
      `© 2024 - ${new Date().getFullYear()} Farmacia: [DEMO] Farmácia Demo Chandkheda com um nome muito comprido`
    )
    expect(copyright.element.parentElement.classList.contains('no-wrap')).toBe(true)
  })

  it('works without an entity (2020 and no name)', () => {
    const copyright = mountFooter().find('[data-test="footer-copyright"]')

    expect(copyright.text()).toBe(`© 2020 - ${new Date().getFullYear()}`)
  })
})
