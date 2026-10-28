import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { entityTypeIdOf, entityTypeIconUrl, brandIconUrl, setFavicon } from './useBrandIcon'

describe('entityTypeIdOf', () => {
  it('uses the EntityType of the selected Entity ({id, value, label})', () => {
    expect(entityTypeIdOf({ Entity: { entity_type: { id: 'et-1', value: 'et-1', label: 'Saude' } }, EntityType: { id: 'host' } })).toBe('et-1')
  })

  it('accepts a bare id', () => {
    expect(entityTypeIdOf({ Entity: { entity_type: 'et-2' } })).toBe('et-2')
  })

  it('falls back to the EntityType of the host before an Entity is chosen', () => {
    expect(entityTypeIdOf({ Entity: null, EntityType: { id: 'host' } })).toBe('host')
  })

  it('is null without any EntityType', () => {
    expect(entityTypeIdOf({ Entity: {}, EntityType: {} })).toBe(null)
  })
})

describe('entityTypeIconUrl', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('points at the public app_icon endpoint', () => {
    const href = entityTypeIconUrl('et-1')
    expect(href).toContain('/django_resaas/entitytypes/et-1/app_icon/?')
    expect(href).toContain('size=192')
  })

  it('is null without an id', () => {
    expect(entityTypeIconUrl(null)).toBe(null)
  })
})

describe('brandIconUrl - the logo or the icon, like the header brand', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('is the logo of the active Entity', () => {
    expect(brandIconUrl({ Entity: { id: 'e-1', logo: { url: 'http://x/logo.png' }, entity_type: { id: 'et-1' } } })).toBe('http://x/logo.png')
  })

  it('is the EntityType icon when the Entity has no logo', () => {
    expect(brandIconUrl({ Entity: { id: 'e-1', logo: null, entity_type: { id: 'et-1' } } })).toContain('/entitytypes/et-1/app_icon/')
  })

  it('is the EntityType icon of the host before an Entity is chosen', () => {
    expect(brandIconUrl({ Entity: null, EntityType: { id: 'host' } })).toContain('/entitytypes/host/app_icon/')
  })

  it('is null without Entity and EntityType', () => {
    expect(brandIconUrl({ Entity: null, EntityType: {} })).toBe(null)
  })
})

describe('setFavicon', () => {
  beforeEach(() => {
    document.head.innerHTML = '<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32x32.png"><link rel="icon" type="image/ico" href="favicon.ico">'
  })

  it('points every icon link at the brand icon', () => {
    setFavicon('https://api/logo.jpeg')
    const links = [...document.querySelectorAll('link[rel="icon"]')]
    expect(links.map(l => l.getAttribute('href'))).toEqual(['https://api/logo.jpeg', 'https://api/logo.jpeg'])
    expect(links.map(l => l.getAttribute('type'))).toEqual([null, null])
  })

  it('restores the original icons with null', () => {
    setFavicon('https://api/logo.jpeg')
    setFavicon(null)
    const links = [...document.querySelectorAll('link[rel="icon"]')]
    expect(links.map(l => l.getAttribute('href'))).toEqual(['icons/favicon-32x32.png', 'favicon.ico'])
    expect(links.map(l => l.getAttribute('type'))).toEqual(['image/png', 'image/ico'])
  })

  it('creates an icon link when the page has none', () => {
    document.head.innerHTML = ''
    setFavicon('https://api/logo.png')
    expect(document.querySelector('link[rel="icon"]').getAttribute('href')).toBe('https://api/logo.png')
  })
})
