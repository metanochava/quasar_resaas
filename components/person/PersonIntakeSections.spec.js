import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

import PersonIntakeSections from './PersonIntakeSections.vue'
import { usePersonIntake } from '../../composables/usePersonIntake'

// s-field/s-select/... are covered by their own specs - here only the
// wiring of THIS component to usePersonIntake() matters, so each widget
// is a minimal <input> that honours v-model.
const inputStub = (name) => ({
  name,
  props: ['modelValue', 'label', 'field'],
  emits: ['update:modelValue'],
  template: `<input class="stub-${name}" :data-label="label" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />`
})
const slotStub = (name) => ({ name, template: `<div class="stub-${name}"><slot /></div>` })

const global = {
  plugins: [[Quasar, {}]],
  components: {
    's-field': inputStub('s-field'),
    's-select': inputStub('s-select'),
    's-input': inputStub('s-input'),
    's-btn': { name: 's-btn', props: ['label', 'icon'], emits: ['click'], template: '<button type="button" :data-icon="icon" :data-label="label" @click="$emit(\'click\')"><slot /></button>' },
    's-card': slotStub('s-card'),
    's-tooltip': slotStub('s-tooltip'),
    's-relation-picker': {
      name: 's-relation-picker',
      props: ['modelValue', 'relationConfig', 'label', 'minChars', 'creatable', 'editable'],
      emits: ['update:modelValue'],
      template: '<div class="stub-picker" :data-min="minChars" :data-creatable="creatable" :data-editable="editable">{{ modelValue?.label }}</div>'
    }
  },
  stubs: { AddressLocationPicker: true, PersonMatchDialog: true }
}

let intake

beforeEach(() => {
  setActivePinia(createPinia())
  intake = usePersonIntake()
  intake.reset({ withBlankContact: false })
})

const mountSections = (props = {}) => mount(PersonIntakeSections, { props: { intake, ...props }, global })

const PERSON_CONFIG = { endpoint: 'django_resaas/persons/', permissions: { list: 'list_person' }, preview: { title: 'full_name' } }

describe('PersonIntakeSections', () => {
  it('renders every person section for a new person', () => {
    const text = mountSections().text()
    for (const title of ['Personal data', 'Contacts', 'Documents', 'Emergency contacts']) {
      expect(text).toContain(title)
    }
  })

  it('binds the personal fields to Person.form (v-model both ways)', async () => {
    intake.Person.form = { name: 'Ana' }
    const wrapper = mountSections()

    const nameInput = wrapper.findAll('input.stub-s-field').find(i => i.attributes('data-label') === 'First name')
    expect(nameInput.element.value).toBe('Ana')

    await nameInput.setValue('Beatriz')
    expect(intake.Person.form.name).toBe('Beatriz')
  })

  it('"Add document" / "Add contact" stage rows in the intake state, and remove drops them', async () => {
    const wrapper = mountSections()

    await wrapper.find('button[data-label="Add document"]').trigger('click')
    await wrapper.find('button[data-label="Add contact"]').trigger('click')
    expect(intake.documents.value).toHaveLength(1)
    expect(intake.contacts.value).toHaveLength(1)
    expect(wrapper.text()).not.toContain('No documents added yet.')

    await wrapper.find('button[data-icon="delete"]').trigger('click')
    expect(intake.documents.value.length + intake.contacts.value.length).toBe(1)
  })

  it('renders the document type as a schema-driven field (relation select with its add/edit/view menu)', async () => {
    const wrapper = mountSections()
    await wrapper.find('button[data-label="Add document"]').trigger('click')

    const typeField = wrapper.findAll('input.stub-s-field').find(i => i.attributes('data-label') === 'Document type')
    expect(typeField).toBeTruthy()
  })

  it('shows the matched person summary instead of the personal-data form once one is selected', async () => {
    intake.selectedPerson.value = { id: 'p1', full_name: 'Marta Sitoe', email: 'm@example.com', documents: [] }
    const wrapper = mountSections()

    expect(wrapper.text()).toContain('Marta Sitoe')
    expect(wrapper.text()).not.toContain('Personal data')
  })

  describe('existing-person picker (page passes its Person relation config)', () => {
    it('is not rendered without a relation config (edit pages)', () => {
      expect(mountSections().find('.stub-picker').exists()).toBe(false)
    })

    it('is rendered with the config, without create/edit actions and with a minimum query length', () => {
      const picker = mountSections({ relationConfig: PERSON_CONFIG }).find('.stub-picker')

      expect(picker.exists()).toBe(true)
      expect(picker.attributes('data-min')).toBe('2')
      expect(picker.attributes('data-creatable')).toBe('false')
      expect(picker.attributes('data-editable')).toBe('false')
    })

    it('picking a person reuses it (hides the create form) and clearing brings the form back', async () => {
      const wrapper = mountSections({ relationConfig: PERSON_CONFIG })

      wrapper.findComponent({ name: 's-relation-picker' }).vm.$emit('update:modelValue', {
        value: 'p9', label: 'Zed Quux',
        preview: { title: 'Zed Quux', avatar: null, values: { email: 'zed@example.com', phone: '850000123' } }
      })
      await wrapper.vm.$nextTick()

      expect(intake.selectedPerson.value).toMatchObject({ id: 'p9', full_name: 'Zed Quux', email: 'zed@example.com', phone: '850000123' })
      expect(wrapper.find('.stub-picker').text()).toBe('Zed Quux')
      expect(wrapper.text()).not.toContain('Personal data')
      // the summary card is replaced by the picker, never shown twice
      expect(wrapper.text()).not.toContain('Using existing person')

      wrapper.findComponent({ name: 's-relation-picker' }).vm.$emit('update:modelValue', null)
      await wrapper.vm.$nextTick()

      expect(intake.selectedPerson.value).toBeNull()
      expect(wrapper.text()).toContain('Personal data')
    })
  })
})
