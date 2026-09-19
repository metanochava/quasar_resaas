import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

// the real dialog drags in vue-router (not installed in the lib) - it is a
// separate component with its own mechanics, only its wiring matters here
vi.mock('./RelationRecordDialog.vue', () => ({
  default: {
    name: 'RelationRecordDialog',
    props: ['modelValue', 'relationConfig', 'mode', 'recordId'],
    emits: ['update:modelValue', 'saved'],
    template: '<div class="dialog-stub" />'
  }
}))

import RelationPickerComponent from './RelationPickerComponent.vue'
import BtnComponent from './BtnComponent.vue'
import InputComponent from './InputComponent.vue'
import TooltipComponent from './TooltipComponent.vue'
import { HTTPAuth } from '../../services/api'
import { useUserStore } from '../../stores/UserStore'

// Nothing below is specific to one model: the picker is driven purely by a
// relation_config, so the very same component is exercised with a Person-like
// config (rich preview) and a Product-like one (no avatar, other endpoint).
const PERSON = {
  app: 'django_resaas', model: 'Person', endpoint: 'django_resaas/persons/', variant: 'card',
  permissions: { list: 'list_person', add: 'add_person', change: 'change_person', view: 'view_person' },
  preview: { title: 'full_name', subtitle: ['email', 'phone'], avatar: 'photo', meta: ['nationality'] }
}

const PRODUCT = {
  app: 'demo', model: 'Product', endpoint: 'demo/products/', variant: 'card',
  permissions: { list: 'list_product', add: 'add_product', change: 'change_product', view: 'view_product' },
  preview: { subtitle: ['sku'] }
}

const ana = {
  id: 'p1', value: 'p1', label: 'Ana Costa',
  preview: { title: 'Ana Costa', subtitle: ['ana@example.com', '841110000'], avatar: null, meta: [{ field: 'nationality', label: 'Nationality', value: 'MZ' }] }
}
const bruno = { id: 'p2', value: 'p2', label: 'Bruno Dias', preview: { title: 'Bruno Dias', subtitle: ['bruno@example.com'], avatar: { url: 'http://x/b.png' }, meta: [] } }

let pinia

const options = () => ({ plugins: [[Quasar, {}], pinia], components: { 's-btn': BtnComponent, 's-input': InputComponent, 's-tooltip': TooltipComponent } })

let user

function grant(...codes) {
  user.Permissions = new Set(codes)
}

function mountPicker(props = {}) {
  return mount(RelationPickerComponent, {
    props: { relationConfig: PERSON, label: 'Person', ...props },
    global: options(),
    attachTo: document.body
  })
}

function answer(rows, next = null) {
  return { data: { results: rows, next } }
}

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  user = useUserStore()
  grant('list_person')
  vi.spyOn(HTTPAuth, 'get').mockResolvedValue(answer([ana, bruno]))
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('s-relation-picker - search and selection', () => {
  it('lists the results with title, subtitle and an initials fallback when nothing is selected', async () => {
    const w = mountPicker()
    await flushPromises()

    const rows = w.findAll('[data-test="relation-result"]')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Ana Costa')
    expect(rows[0].text()).toContain('ana@example.com · 841110000')
    expect(rows[0].text()).toContain('AC')
    expect(rows[1].find('img').attributes('src')).toBe('http://x/b.png')
  })

  it('selecting a result emits it as the new value and shows it as a card', async () => {
    const w = mountPicker()
    await flushPromises()

    await w.findAll('[data-test="relation-result"]')[0].trigger('click')

    expect(w.emitted('update:modelValue')[0][0]).toMatchObject({ value: 'p1', label: 'Ana Costa' })

    await w.setProps({ modelValue: w.emitted('update:modelValue')[0][0] })

    const card = w.find('[data-test="relation-selected"]')
    expect(card.text()).toContain('Ana Costa')
    expect(card.text()).toContain('ana@example.com')
    expect(card.text()).toContain('Nationality: MZ')
    expect(card.text()).toContain('Selected')
    expect(w.find('[data-test="relation-result"]').exists()).toBe(false)
  })

  it('shows an empty state when the search has no results', async () => {
    HTTPAuth.get.mockResolvedValue(answer([]))
    const w = mountPicker()
    await flushPromises()

    expect(w.find('[data-test="relation-empty"]').text()).toContain('No results found')
  })

  it('works unchanged for a non-Person relation (same component, other config)', async () => {
    HTTPAuth.get.mockResolvedValue(answer([{ id: 9, value: 9, label: 'Widget', preview: { title: 'Widget', subtitle: ['W-1'], avatar: null, meta: [] } }]))
    grant('list_product')

    const w = mountPicker({ relationConfig: PRODUCT, label: 'Product' })
    await flushPromises()

    expect(HTTPAuth.get.mock.calls[0][0]).toContain('demo/products/')
    expect(w.find('[data-test="relation-result"]').text()).toContain('Widget')
    expect(w.find('[data-test="relation-result"]').text()).toContain('W-1')
  })

  it('reads the config from a schema field too (manual forms)', async () => {
    const w = mountPicker({ relationConfig: null, field: { name: 'person', label: 'Person', relation_config: PERSON } })
    await flushPromises()

    expect(w.findAll('[data-test="relation-result"]')).toHaveLength(2)
  })

  it('debounces the query and searches the related endpoint with it', async () => {
    vi.useFakeTimers()
    const w = mountPicker()
    await vi.advanceTimersByTimeAsync(0)
    HTTPAuth.get.mockClear()

    const input = w.find('input[data-test="relation-query"]')
    await input.setValue('br')
    await input.setValue('bru')
    await vi.advanceTimersByTimeAsync(350)

    expect(HTTPAuth.get).toHaveBeenCalledTimes(1)
    expect(HTTPAuth.get.mock.calls[0][1].params.search).toBe('bru')
    vi.useRealTimers()
  })

  it('offers "Load more" when the endpoint has another page', async () => {
    HTTPAuth.get.mockResolvedValueOnce(answer([ana], 'http://api/persons/?page=2')).mockResolvedValueOnce(answer([bruno]))
    const w = mountPicker()
    await flushPromises()

    await w.find('[data-test="relation-more"]').trigger('click')
    await flushPromises()

    expect(w.findAll('[data-test="relation-result"]')).toHaveLength(2)
    expect(w.find('[data-test="relation-more"]').exists()).toBe(false)
  })
})

describe('s-relation-picker - selected value', () => {
  it('looks the preview of a value loaded from the read shape up once', async () => {
    HTTPAuth.get.mockResolvedValue(answer([ana]))

    const w = mountPicker({ modelValue: { id: 'p1', value: 'p1', label: 'Ana Costa' } })
    await flushPromises()

    expect(HTTPAuth.get.mock.calls[0][1].params).toMatchObject({ id: 'p1', select: 'true', preview: 'true' })
    expect(w.find('[data-test="relation-selected"]').text()).toContain('ana@example.com')
  })

  it('falls back to the label when the preview cannot be loaded', async () => {
    HTTPAuth.get.mockRejectedValue(new Error('403'))

    const w = mountPicker({ modelValue: { value: 'p1', label: 'Ana Costa' } })
    await flushPromises()

    expect(w.find('[data-test="relation-selected"]').text()).toContain('Ana Costa')
  })

  it('does not refetch a preview that came with the selection', async () => {
    mountPicker({ modelValue: ana })
    await flushPromises()

    expect(HTTPAuth.get).not.toHaveBeenCalled()
  })

  it('Change reopens the search and Cancel returns to the card', async () => {
    const w = mountPicker({ modelValue: ana })
    await flushPromises()

    await w.find('[data-test="relation-change"]').trigger('click')
    await flushPromises()
    expect(w.find('[data-test="relation-query"]').exists()).toBe(true)

    await w.find('[data-test="relation-cancel"]').trigger('click')
    expect(w.find('[data-test="relation-selected"]').exists()).toBe(true)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('Clear empties the value only when the relation allows null', async () => {
    const required = mountPicker({ modelValue: ana })
    expect(required.find('[data-test="relation-clear"]').exists()).toBe(false)

    const optional = mountPicker({ modelValue: ana, clearable: true })
    await optional.find('[data-test="relation-clear"]').trigger('click')

    expect(optional.emitted('update:modelValue')[0][0]).toBeNull()
    expect(optional.emitted('cleared')).toBeTruthy()
  })

  it('a read-only picker offers no change/clear/edit', async () => {
    grant('list_person', 'change_person', 'view_person')
    const w = mountPicker({ modelValue: ana, clearable: true, readonly: true })
    await flushPromises()

    expect(w.find('[data-test="relation-change"]').exists()).toBe(false)
    expect(w.find('[data-test="relation-clear"]').exists()).toBe(false)
    expect(w.find('[data-test="relation-edit"]').exists()).toBe(false)
    expect(w.find('[data-test="relation-view"]').exists()).toBe(true)
  })
})

describe('s-relation-picker - permission-driven actions', () => {
  it('view/edit/create show only with the matching permission', async () => {
    grant('list_person')
    let w = mountPicker({ modelValue: ana })
    await flushPromises()
    expect(w.find('[data-test="relation-view"]').exists()).toBe(false)
    expect(w.find('[data-test="relation-edit"]').exists()).toBe(false)

    grant('list_person', 'view_person')
    w = mountPicker({ modelValue: ana })
    await flushPromises()
    expect(w.find('[data-test="relation-view"]').exists()).toBe(true)
    expect(w.find('[data-test="relation-edit"]').exists()).toBe(false)

    grant('list_person', 'view_person', 'change_person')
    w = mountPicker({ modelValue: ana })
    await flushPromises()
    expect(w.find('[data-test="relation-edit"]').exists()).toBe(true)
  })

  it('"Create new" needs the add permission', async () => {
    let w = mountPicker()
    await flushPromises()
    expect(w.find('[data-test="relation-create"]').exists()).toBe(false)

    grant('list_person', 'add_person')
    w = mountPicker()
    await flushPromises()
    expect(w.find('[data-test="relation-create"]').exists()).toBe(true)
  })

  it('without the list permission it never searches and says why', async () => {
    grant()
    const w = mountPicker()
    await flushPromises()

    expect(HTTPAuth.get).not.toHaveBeenCalled()
    expect(w.find('[data-test="relation-no-search"]').exists()).toBe(true)
    expect(w.find('[data-test="relation-query"]').exists()).toBe(false)
  })

  it('a record saved in the dialog becomes the selection, preview included', async () => {
    grant('list_person', 'add_person')
    HTTPAuth.get.mockResolvedValueOnce(answer([])).mockResolvedValueOnce(answer([ana]))

    const w = mountPicker()
    await flushPromises()

    w.findComponent({ name: 'RelationRecordDialog' }).vm.$emit('saved', { id: 'p1', label: 'Ana Costa' })
    await flushPromises()

    expect(w.emitted('update:modelValue')[0][0]).toMatchObject({ value: 'p1', preview: { title: 'Ana Costa' } })
  })
})

describe('s-relation-picker - minimum characters', () => {
  it('lists nothing until enough characters are typed', async () => {
    vi.useFakeTimers()
    const w = mountPicker({ minChars: 2 })
    await vi.advanceTimersByTimeAsync(0)

    expect(HTTPAuth.get).not.toHaveBeenCalled()
    expect(w.find('[data-test="relation-min-chars"]').text()).toContain('Type at least 2 characters to search')

    const input = w.find('input[data-test="relation-query"]')
    await input.setValue('a')
    await vi.advanceTimersByTimeAsync(400)
    expect(HTTPAuth.get).not.toHaveBeenCalled()

    await input.setValue('an')
    await vi.advanceTimersByTimeAsync(400)
    expect(HTTPAuth.get).toHaveBeenCalledTimes(1)
    expect(HTTPAuth.get.mock.calls[0][1].params.search).toBe('an')
    vi.useRealTimers()
  })

  it('creatable=false / editable=false hide the create and edit actions even with the permissions', async () => {
    grant('list_person', 'add_person', 'change_person', 'view_person')

    const searching = mountPicker({ creatable: false, minChars: 0 })
    await flushPromises()
    expect(searching.find('[data-test="relation-create"]').exists()).toBe(false)

    const selected = mountPicker({ modelValue: ana, editable: false })
    await flushPromises()
    expect(selected.find('[data-test="relation-edit"]').exists()).toBe(false)
    expect(selected.find('[data-test="relation-view"]').exists()).toBe(true)
  })
})

describe('s-relation-picker - modal mode', () => {
  const mountModal = (props = {}) => mountPicker({ mode: 'modal', minChars: 2, placeholder: 'Search an existing person', ...props })

  it('renders only a compact input; nothing is searched until it is focused', async () => {
    const w = mountModal()
    await flushPromises()

    expect(w.find('[data-test="relation-trigger"]').exists()).toBe(true)
    expect(w.find('[data-test="relation-result"]').exists()).toBe(false)
    expect(HTTPAuth.get).not.toHaveBeenCalled()
  })

  it('focusing the input opens a modal with a search input; typing filters and picking selects', async () => {
    vi.useFakeTimers()
    const w = mountModal()
    await vi.advanceTimersByTimeAsync(0)

    await w.find('input').trigger('click')
    // let the dialog finish showing (its @show resets the query)
    await vi.advanceTimersByTimeAsync(800)

    // the modal hosts the same search panel the inline mode uses
    const panel = w.findComponent({ name: 'RelationSearchPanel' })
    expect(panel.exists()).toBe(true)

    panel.vm.$emit('update:query', 'an')
    await vi.advanceTimersByTimeAsync(400)

    expect(HTTPAuth.get.mock.calls.at(-1)[1].params.search).toBe('an')

    panel.vm.$emit('choose', { value: 'p1', id: 'p1', label: 'Ana Costa', preview: null })
    await vi.advanceTimersByTimeAsync(0)

    expect(w.emitted('update:modelValue')[0][0]).toMatchObject({ value: 'p1' })
    vi.useRealTimers()
  })

  it('shows the selected value in the input and clears it from there', async () => {
    const w = mountModal({ modelValue: ana, clearable: true })
    await flushPromises()

    expect(w.find('input').element.value).toBe('Ana Costa')

    await w.find('[data-test="relation-clear"]').trigger('click')
    expect(w.emitted('update:modelValue')[0][0]).toBeNull()
  })

  it('keyboard focus (tabbing into the input) opens it too', async () => {
    const w = mountModal()
    await w.find('input').trigger('focusin')
    await flushPromises()

    expect(document.body.querySelector('input[data-test="relation-query"]')).toBeTruthy()
  })

  it('does nothing when locked', async () => {
    const w = mountModal({ readonly: true })
    await w.find('input').trigger('click')
    await flushPromises()

    expect(document.body.querySelector('input[data-test="relation-query"]')).toBeNull()
  })
})
