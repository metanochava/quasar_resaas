// The routes of a RESAAS layout scroll INSIDE their own area (<s-route-scroll>,
// between header, footer and drawers), not the page: window.scrollY stays 0
// and window 'scroll' never fires. Code that needs the scroll asks here - it
// falls back to the window when no layout area is mounted (a page alone).

let target = null
const listeners = new Set()

export function setRouteScrollTarget (el) {
  if (target === el) return
  const previous = target
  target = el || null
  // listeners follow the area (a new layout mounted)
  for (const listener of listeners) {
    ;(previous || window).removeEventListener('scroll', listener)
    ;(target || window).addEventListener('scroll', listener, { passive: true })
  }
}

// the element that scrolls the routes, or window
export function routeScrollTarget () {
  return target || window
}

// how far the routes are scrolled
export function routeScrollY () {
  return target ? target.scrollTop : (window.scrollY || 0)
}

// the scrollable height left (scrollHeight - clientHeight)
export function routeScrollMax () {
  if (target) return Math.max(0, target.scrollHeight - target.clientHeight)
  const doc = document.documentElement
  return Math.max(0, doc.scrollHeight - window.innerHeight)
}

// window.scrollTo() for the routes' area: { top, behavior }
export function scrollRouteTo (options = { top: 0 }) {
  routeScrollTarget().scrollTo(options)
}

// window.addEventListener('scroll') for the routes' area; returns the unsubscribe
export function onRouteScroll (listener) {
  listeners.add(listener)
  routeScrollTarget().addEventListener('scroll', listener, { passive: true })
  return () => {
    listeners.delete(listener)
    routeScrollTarget().removeEventListener('scroll', listener)
  }
}

export function useRouteScroll () {
  return { routeScrollTarget, routeScrollY, routeScrollMax, scrollRouteTo, onRouteScroll }
}
