import { shallowReactive } from 'vue'

// The public site shown at '/' of the app, one per EntityType.
//
// quasar_resaas only keeps the registry and the page that picks the site
// (pages/EntityTypeSitePage.vue); the application registers the body of the
// site of each of its entity types:
//
//   registerEntityTypeSite('Saude', () => import('./saude/SaudeSite.vue'))
//
// or, keeping the generic body, only its content (texts, layout, icons):
//
//   registerEntityTypeSiteContent('Saude', { layout: 'orbit', hero: {...}, ... })
//
// The content is code of the application, never stored in the database. Its
// texts are canonical English, translated by the generic body with tdc()
// (static lang files of the backend).
//
// The key is the EntityType name (case-insensitive) - the same name the
// subdomain carries (saude.example.com -> "Saude"). A type without a
// registered site gets the generic one (components/site/EntityTypeDefaultSite),
// with its registered content or, without one, its name and icon.
//
// Symbol.for: every bundle/instance of quasar_resaas shares one registry
// (same reason as services/dashboardRegistry.js).
const REGISTRY_KEY = Symbol.for('quasar_resaas.entityTypeSites')

if (!globalThis[REGISTRY_KEY]) {
  globalThis[REGISTRY_KEY] = shallowReactive(new Map())
}

const sites = globalThis[REGISTRY_KEY]

const CONTENT_KEY = Symbol.for('quasar_resaas.entityTypeSiteContents')

if (!globalThis[CONTENT_KEY]) {
  globalThis[CONTENT_KEY] = shallowReactive(new Map())
}

const contents = globalThis[CONTENT_KEY]

const keyOf = (name) => String(name || '').trim().toLowerCase()

// loader: a function returning the component's import() (lazy, so a site
// costs nothing to the app pages)
export function registerEntityTypeSite (name, loader) {
  if (!keyOf(name) || typeof loader !== 'function') {
    console.warn('[RESAAS Site] registerEntityTypeSite needs a name and a loader:', name)
    return
  }
  sites.set(keyOf(name), loader)
}

export function getEntityTypeSite (name) {
  return sites.get(keyOf(name)) || null
}

// content: plain object read by EntityTypeDefaultSite - layout ('orbit',
// 'centered', 'split', 'mosaic'), hero, stats, features, steps, faq, cta,
// show_sectors (see docs/quasar-resaas/features/entity-type-sites.md)
export function registerEntityTypeSiteContent (name, content) {
  if (!keyOf(name) || !content || typeof content !== 'object' || Array.isArray(content)) {
    console.warn('[RESAAS Site] registerEntityTypeSiteContent needs a name and an object:', name)
    return
  }
  contents.set(keyOf(name), content)
}

export function getEntityTypeSiteContent (name) {
  return contents.get(keyOf(name)) || null
}

export function clearEntityTypeSites () {
  sites.clear()
  contents.clear()
}
