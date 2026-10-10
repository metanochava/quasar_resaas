import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import SearchMenu from './SearchMenu.vue'
import { useUserStore } from '../stores/UserStore'

function mountWithMini (mini) {
  useUserStore().LayoutSettings = { sidebar: { mini } }
  return mount(SearchMenu)
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('SearchMenu placeholder follows the menu minimisation', () => {
  it('shows "Search" while the menu is expanded (mini false)', () => {
    expect(mountWithMini(false).find('input').attributes('placeholder')).toBe('Search')
  })

  it('shows no placeholder while the menu is minimised (mini true)', () => {
    expect(mountWithMini(true).find('input').attributes('placeholder')).toBe('')
  })
})
