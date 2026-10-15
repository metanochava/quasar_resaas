import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

import EntityTypeDefaultSite from './EntityTypeDefaultSite.vue'
import { registerEntityTypeSiteContent, clearEntityTypeSites } from '../../services/entityTypeSites'

// the content of the site comes from the application's registry (code), not
// from the EntityType record returned by the API
function render (entityType, entityTypes = []) {
  return mount(EntityTypeDefaultSite, {
    props: { entityType, entityTypes },
    global: { plugins: [[Quasar, {}]], stubs: { 's-btn': true } }
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  clearEntityTypeSites()
})

describe('EntityTypeDefaultSite', () => {
  it('draws the content registered for the type name', () => {
    registerEntityTypeSiteContent('Saude', {
      layout: 'split',
      hero: { title: 'Care for your patients' },
      faq: { title: 'Questions', items: [{ question: 'Q?', answer: 'A.' }] }
    })

    const w = render({ id: 1, name: 'saude' })

    expect(w.find('[data-test="site-title"]').text()).toBe('Care for your patients')
    expect(w.find('[data-test="entity-type-default-site"]').attributes('data-layout')).toBe('split')
    expect(w.find('[data-test="site-faq"]').exists()).toBe(true)
  })

  it('ignores a `site` on the API record: without registered content only the name shows', () => {
    const w = render({ id: 2, name: 'Seguradora', label: 'Seguradora', site: { hero: { title: 'From the database' } } })

    expect(w.find('[data-test="site-title"]').text()).toBe('Welcome to Seguradora')
    expect(w.find('[data-test="entity-type-default-site"]').attributes('data-layout')).toBe('orbit')
  })

  it('lists the other sectors with the hero title of their registered content', () => {
    registerEntityTypeSiteContent('SaaS', { show_sectors: true })
    registerEntityTypeSiteContent('Farmacia', { hero: { title: 'Your pharmacy, under control' } })

    const w = render({ id: 1, name: 'SaaS' }, [{ id: 1, name: 'SaaS' }, { id: 3, name: 'Farmacia', label: 'Farmacia' }])

    const sectors = w.findAll('[data-test="site-sector"]')
    expect(sectors).toHaveLength(1)
    expect(sectors[0].text()).toContain('Your pharmacy, under control')
  })
})
