import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'

// the Form Engine's layers page: who sees the platform layers, saving makes a
// new version, only a draft is published, invalid JSON is never sent
const { perms, http } = vi.hoisted(() => ({ perms: new Set(), http: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../../services/api', () => ({ HTTPAuth: http, url: ({ url }) => url }))
vi.mock('../../services/translation', () => ({ tdc: s => s }))
vi.mock('../../stores/UserStore', () => ({ useUserStore: () => ({ can: p => perms.has(p) }) }))
vi.mock('../../utils/apiContract', () => ({ errorMessage: e => e?.message || '' }))

import FormDefinitionsPage from './FormDefinitionsPage.vue'

const row = { id: 'f1', key: 'school.enrolment', level: 'entity', version: 1, status: 'draft',
  definition: { schema_version: '1.0', key: 'school.enrolment', sections: [{ key: 'm', fields: [{ name: 'n', type: 'text' }] }] } }

const stubs = {
  's-card': { template: '<div><slot /></div>' },
  's-btn': { props: ['label'], emits: ['click'], template: '<button @click="$emit(\'click\')">{{ label }}<slot /></button>' },
  's-tooltip': { template: '<span><slot /></span>' },
  's-input': { props: ['modelValue'], emits: ['update:modelValue'], template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' },
  's-select': { props: ['options'], template: '<div class="sel">{{ (options || []).map(o => o.value).join(",") }}</div>' },
  's-dynamic-form': { template: '<div class="preview" />' },
  'q-page': { template: '<div><slot /></div>' }
}

function mountPage () {
  return mount(FormDefinitionsPage, { global: { plugins: [Quasar], stubs } })
}

beforeEach(() => {
  perms.clear()
  vi.clearAllMocks()
  http.get.mockResolvedValue({ data: [row] })
})

describe('FormDefinitionsPage', () => {
  it('offers the platform layers only to who keeps the platform', async () => {
    perms.add('add_formdefinition')
    const w = mountPage()
    await flushPromises()
    await w.find('[data-test="fd-new"]').trigger('click')
    expect(w.find('[data-test="fd-level"]').text()).toBe('entity,branch')

    perms.add('manage_platform_formdefinition')
    const root = mountPage()
    await flushPromises()
    await root.find('[data-test="fd-new"]').trigger('click')
    expect(root.find('[data-test="fd-level"]').text()).toBe('platform,entity_type,entity,branch')
  })

  it('saves a new version and publishes only a draft', async () => {
    perms.add('add_formdefinition').add('publish_formdefinition')
    http.post.mockResolvedValue({ data: { ...row, id: 'f2', version: 2 } })
    const w = mountPage()
    await flushPromises()
    await w.find('[data-test="fd-list"] .q-item').trigger('click')
    expect(w.find('[data-test="fd-publish"]').exists()).toBe(true)

    await w.find('[data-test="fd-save"]').trigger('click')
    await flushPromises()
    expect(http.post.mock.calls[0][0]).toBe('django_resaas/formdefinitions/')
    expect(http.post.mock.calls[0][1]).toMatchObject({ key: 'school.enrolment', level: 'entity', definition: row.definition })

    await w.find('[data-test="fd-publish"]').trigger('click')
    await flushPromises()
    expect(http.post.mock.calls[1][0]).toBe('django_resaas/formdefinitions/f2/publish/')
  })

  it('never sends invalid JSON', async () => {
    perms.add('add_formdefinition')
    const w = mountPage()
    await flushPromises()
    await w.find('[data-test="fd-list"] .q-item').trigger('click')
    await w.find('textarea').setValue('{ not json')
    expect(w.text()).toContain('Invalid JSON.')
    await w.find('[data-test="fd-save"]').trigger('click')
    expect(http.post).not.toHaveBeenCalled()
  })
})
