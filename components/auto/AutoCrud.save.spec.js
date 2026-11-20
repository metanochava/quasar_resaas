// The form modal saves to `${store.safeUrl}/`: AutoCrud's store must carry the
// endpoint the list reads (it posted to /api/undefined/ - "New customer" on
// list_customer, 2026-11-19).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

const schemaOf = vi.hoisted(() => ({ value: null }))
vi.mock('../../utils/autoForm', () => ({
  buildFormFromSchema: vi.fn(async () => ({ schema: schemaOf.value, fields: [], actions: [], config: {} }))
}))
vi.mock('../../services/api', () => ({
  HTTPAuth: { get: vi.fn(async () => ({ data: { results: [], count: 0 } })), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  HTTPAuthBlob: { get: vi.fn() },
  url: ({ url }) => url
}))

import AutoCrud from './AutoCrud.vue'

const FormModalStub = { name: 'SFormModal', props: ['store', 'modelValue', 'schema', 'ignoreFields'], template: '<div />' }

async function storeOf (schema) {
  schemaOf.value = schema
  const w = mount(AutoCrud, {
    props: { app: 'sales', model: 'Customer' },
    global: { plugins: [Quasar], stubs: { 's-form-modal': FormModalStub, 's-auto-table': true, 's-auto-filter': true } }
  })
  await flushPromises()
  return w.findComponent(FormModalStub).props('store')
}

beforeEach(() => setActivePinia(createPinia()))

describe('AutoCrud - where the form modal saves', () => {
  it("the schema's own endpoint", async () => {
    const store = await storeOf({ model: { endpoint: 'notifications/preferences/' }, permissions: {}, ui: {} })
    expect(store.safeUrl).toBe('notifications/preferences')
  })

  it('else app/models', async () => {
    const store = await storeOf({ model: {}, permissions: {}, ui: {} })
    expect(store.safeUrl).toBe('sales/customers')
  })
})
