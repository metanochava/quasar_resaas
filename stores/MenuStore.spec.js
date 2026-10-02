import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { useMenuStore } from './MenuStore'

beforeEach(() => setActivePinia(createPinia()))

describe('MenuStore', () => {
  it('keeps the right menus the application registers', () => {
    const menu = useMenuStore()
    const Component = { name: 'X' }

    menu.registerRightMenu('view_product', Component)
    menu.init()

    expect(menu.initialized).toBe(true)
    expect(menu.rightMenus.view_product).toEqual(Component)
  })

  it('never imports a file of the application (a new app has none)', () => {
    const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'MenuStore.js'), 'utf8')
    expect(source).not.toMatch(/import\(\s*['"]src\//)
  })
})
