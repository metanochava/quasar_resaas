import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { installChunkReload, isChunkLoadError } from './chunkReload'

const missing = () => Promise.reject(new TypeError('Failed to fetch dynamically imported module: https://x/assets/WelcomePage-OLD.js'))
const broken = () => Promise.reject(new Error('boom'))

function setup () {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/welcome', name: 'welcome', component: missing },
      { path: '/broken', name: 'broken', component: broken },
    ],
  })
  const reload = vi.fn()
  installChunkReload(router, { reload })
  return { router, reload }
}

beforeEach(() => sessionStorage.clear())

describe('chunkReload', () => {
  it('recognises the browsers\' chunk-load errors only', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: x'))).toBe(true)
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(isChunkLoadError(new Error('error loading dynamically imported module'))).toBe(true)
    expect(isChunkLoadError(new Error('boom'))).toBe(false)
  })

  it('a route chunk of an old build reloads the page once, on that route', async () => {
    const { router, reload } = setup()
    await router.push('/')

    await router.push({ name: 'welcome' }).catch(() => {})
    expect(reload).toHaveBeenCalledTimes(1)

    // the reload did not help (still missing): no loop
    await router.push({ name: 'welcome' }).catch(() => {})
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('other navigation errors are not reloaded', async () => {
    const { router, reload } = setup()
    await router.push('/')

    await router.push({ name: 'broken' }).catch(() => {})
    expect(reload).not.toHaveBeenCalled()
  })
})
