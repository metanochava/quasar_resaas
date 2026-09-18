import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

import EmployeePersonalPanel from './EmployeePersonalPanel.vue'
import BtnComponent from '../../../components/engine/BtnComponent.vue'
import TooltipComponent from '../../../components/engine/TooltipComponent.vue'
import CardComponent from '../../../components/engine/CardComponent.vue'
import { usePersonContactStore } from '../../../stores/PersonContactStore'
import { useDocumentStore } from '../../../stores/DocumentStore'

const globalOptions = {
  plugins: [[Quasar, {}]],
  components: { 's-btn': BtnComponent, 's-tooltip': TooltipComponent, 's-card': CardComponent }
}

const person = {
  id: 'p1', name: 'Metano', surname: 'Chavana', full_name: 'Metano Chavana',
  gender: { id: 'M', value: 'M', label: 'Masculine' },
  marital_status: { id: null, value: null, label: null },
  date_of_birth: '1990-05-20', age: 36, country_of_birth: 'India',
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

describe('EmployeePersonalPanel', () => {
  it('shows what the database has: name, gender label, country, initials fallback', async () => {
    const w = mount(EmployeePersonalPanel, { props: { person }, global: globalOptions })
    await flushPromises()
    const text = w.text()
    expect(text).toContain('Metano Chavana')
    expect(text).toContain('Masculine')
    expect(text).toContain('India')
    expect(text).toContain('metano@example.com')
    expect(w.find('.identity-initials').text()).toBe('MC')
  })

  it('never prints a raw object: {id,value,label} choices show the label, all-null shows nothing', async () => {
    const w = mount(EmployeePersonalPanel, { props: { person }, global: globalOptions })
    await flushPromises()
    expect(w.text()).not.toContain('[object Object]')
    expect(w.text()).not.toContain('"label"')
    expect(w.html()).not.toContain('null')
  })

  it('renders missing address as an empty state and empty fields as a dash', async () => {
    const w = mount(EmployeePersonalPanel, { props: { person }, global: globalOptions })
    await flushPromises()
    expect(w.text()).toContain('No address on file.')
    expect(w.find('.field-value.is-empty').exists()).toBe(true)
  })

  it('loads documents (with expiry status) and emergency contacts', async () => {
    const w = mount(EmployeePersonalPanel, { props: { person }, global: globalOptions })
    await flushPromises()
    expect(w.text()).toContain('ID Card')
    expect(w.text()).toContain('Expired')
    expect(w.text()).toContain('Irmao Chavana')
  })

  it('a denied list (no permission) does not break the panel', async () => {
    useDocumentStore().loadData.mockRejectedValue(new Error('403'))
    const w = mount(EmployeePersonalPanel, { props: { person }, global: globalOptions })
    await flushPromises()
    expect(w.text()).toContain('No documents on file.')
  })
})
