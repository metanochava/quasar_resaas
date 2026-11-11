import { describe, it, expect, vi, afterEach } from 'vitest'
import { setRouteScrollTarget, routeScrollTarget, routeScrollY, scrollRouteTo, onRouteScroll } from './useRouteScroll'

// the routes scroll inside the layout's area (s-route-scroll): code that used
// the window's scroll asks here, and falls back to the window without one
afterEach(() => setRouteScrollTarget(null))

describe('useRouteScroll', () => {
  it('uses the window until a layout area is mounted', () => {
    expect(routeScrollTarget()).toBe(window)
  })

  it('reads and moves the layout area, and the scroll listeners follow it', () => {
    const area = document.createElement('div')
    area.scrollTo = vi.fn()
    const listener = vi.fn()
    const stop = onRouteScroll(listener)

    setRouteScrollTarget(area)
    area.scrollTop = 120
    expect(routeScrollY()).toBe(120)

    scrollRouteTo({ top: 0 })
    expect(area.scrollTo).toHaveBeenCalledWith({ top: 0 })

    area.dispatchEvent(new Event('scroll'))
    expect(listener).toHaveBeenCalledTimes(1)
    window.dispatchEvent(new Event('scroll'))
    expect(listener).toHaveBeenCalledTimes(1)   // no longer on the window

    stop()
    area.dispatchEvent(new Event('scroll'))
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
