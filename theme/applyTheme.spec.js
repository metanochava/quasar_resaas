import { describe, it, expect } from 'vitest'
import { applyTheme } from './applyTheme'

// the site's colours reach <html> too: the page's scrollbar (--scrollbar-accent,
// css/theme_engine.css) is resolved there, not on <body> where Quasar's
// setCssVar() writes by default
describe('applyTheme - the colours on <html> and <body>', () => {
  it('sets --q-primary on both', () => {
    applyTheme({ primary: '#0f766e' })

    expect(document.documentElement.style.getPropertyValue('--q-primary')).toBe('#0f766e')
    expect(document.body.style.getPropertyValue('--q-primary')).toBe('#0f766e')
  })
})
