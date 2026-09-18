import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

import PersonProfilePanel from './PersonProfilePanel.vue'
import BtnComponent from '../engine/BtnComponent.vue'
import TooltipComponent from '../engine/TooltipComponent.vue'
import CardComponent from '../engine/CardComponent.vue'
import { usePersonContactStore } from '../../stores/PersonContactStore'
import { useDocumentStore } from '../../stores/DocumentStore'

const globalOptions = {
  plugins: [[Quasar, {}]],
  components: { 's-btn': BtnComponent, 's-tooltip': TooltipComponent, 's-card': CardComponent }
}

const person = {
  id: 'p1', name: 'Metano', surname: 'Chavana', full_name: 'Metano Chavana',
  gender: { id: 'M', value: 'M', label: 'Masculine' },
  marital_status: { id: null, value: null, label: null },
  date_of_birth: '1990-05-20', age: 36, country_of_birth: 'India',
  blood_type: { id: 'O+', value: 'O+', label: 'O+' },
  email: 'metano@example.com', address: null, photo: null
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.spyOn(usePersonContactStore(), 'loadData').mockImplementation(async function () {
    this.rows = [{ id: 'c1', name: 'Irmao Chavana', relationship: 'Sibling', phone: '841234567', is_emergency: true }]
  })
  vi.spyOn(useDocumentStore(), 'loadData').mockImplementation(async function () {
    this.rows = [{ id: 'd1', tipo_data: { name: 'ID Card' }, numero: 'AB123', data_validade: '2020-01-01' }]
  })
})

describe('PersonProfilePanel - aside slot', () => {
  it('renders business-specific cards passed in the aside slot under the identity card', async () => {
    const w = mount(PersonProfilePanel, {
      props: { person },
      slots: { aside: '<div class="patient-card">Patient data</div>' },
      global: globalOptions
    })
    await flushPromises()

    expect(w.find('.patient-card').exists()).toBe(true)
    expect(w.text()).toContain('Metano Chavana')
  })
})

describe('PersonProfilePanel - address map', () => {
  it('shows a small map inside the address card when the address has coordinates', async () => {
    const withAddress = { ...person, address: { formatted_address: 'Av. 24 de Julho, Maputo', latitude: '-25.9655', longitude: '32.5832' } }
    const w = mount(PersonProfilePanel, { props: { person: withAddress }, global: globalOptions })
    await flushPromises()

    expect(w.text()).toContain('Av. 24 de Julho, Maputo')
    expect(w.find('.address-mini-map').exists()).toBe(true)
  })

  it('shows no map (only the empty state) when there is no address', async () => {
    const w = mount(PersonProfilePanel, { props: { person }, global: globalOptions })
    await flushPromises()

    expect(w.find('.address-mini-map').exists()).toBe(false)
    expect(w.text()).toContain('No address on file.')
  })
})

describe('PersonProfilePanel', () => {
  it('shows what the database has: name, gender label, country, initials fallback', async () => {
    const w = mount(PersonProfilePanel, { props: { person }, global: globalOptions })
    await flushPromises()
    const text = w.text()
    expect(text).toContain('Metano Chavana')
    expect(text).toContain('Masculine')
    expect(text).toContain('India')
    expect(text).toContain('O+')
    expect(text).toContain('Blood type')
    expect(text).toContain('metano@example.com')
    expect(w.find('.identity-initials').text()).toBe('MC')
  })

  it('never prints a raw object: {id,value,label} choices show the label, all-null shows nothing', async () => {
    const w = mount(PersonProfilePanel, { props: { person }, global: globalOptions })
    await flushPromises()
    expect(w.text()).not.toContain('[object Object]')
    expect(w.text()).not.toContain('"label"')
    expect(w.html()).not.toContain('null')
  })

  it('renders missing address as an empty state and empty fields as a dash', async () => {
    const w = mount(PersonProfilePanel, { props: { person }, global: globalOptions })
    await flushPromises()
    expect(w.text()).toContain('No address on file.')
    expect(w.find('.field-value.is-empty').exists()).toBe(true)
  })

  it('loads documents (with expiry status) and emergency contacts', async () => {
    const w = mount(PersonProfilePanel, { props: { person }, global: globalOptions })
    await flushPromises()
    expect(w.text()).toContain('ID Card')
    expect(w.text()).toContain('Expired')
    expect(w.text()).toContain('Irmao Chavana')
  })

  it('a denied list (no permission) does not break the panel', async () => {
    useDocumentStore().loadData.mockRejectedValue(new Error('403'))
    const w = mount(PersonProfilePanel, { props: { person }, global: globalOptions })
    await flushPromises()
    expect(w.text()).toContain('No documents on file.')
  })
})
