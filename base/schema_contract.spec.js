import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * FASE 2 - P1.2: end-to-end contract test.
 *
 * Pushes a REALISTIC schema fixture - shaped exactly like
 * ResaasSchemaBuilder.build() (see docs/api/schema-contract.md) - through
 * the actual flow a real page goes through:
 *
 *   fixture JSON -> HTTPAuth.get() -> buildFormFromSchema() (real)
 *                -> BaseStore.loadSchema() (real) -> safeUrl/permissions/
 *                   pagination/pdf/actions
 *
 * Only the HTTP layer (services/api.js's HTTPAuth/url) is mocked - every
 * other piece of the chain (normalizeSchema, buildFormFromSchema,
 * createBaseStore) runs for real. utils/autoForm.spec.js already covers
 * buildFormFromSchema in isolation and base/base_store.spec.js covers
 * BaseStore with buildFormFromSchema mocked; this file is the one place
 * that proves the two actually fit together.
 *
 * The fixture deliberately uses "sales/order" with a backend endpoint
 * ("custom/orders/") that does NOT match the app/model convention
 * ("sales/orders") - if BaseStore ever silently fell back to the
 * convention instead of honoring the backend's endpoint, this fixture
 * would catch it (a fixture matching the convention by coincidence
 * wouldn't).
 */

const __dirname = dirname(fileURLToPath(import.meta.url))
const FIXTURE = JSON.parse(
  readFileSync(join(__dirname, '../tests/fixtures/schema-1.0.json'), 'utf-8')
)

const httpGet = vi.fn()
const httpAuthBlobGet = vi.fn()

vi.mock('../services/api', () => ({
  HTTPAuth: { get: (...args) => httpGet(...args) },
  HTTPAuthBlob: { get: (...args) => httpAuthBlobGet(...args) },
  url: ({ url: path }) => path,
}))

vi.mock('../services/translation', () => ({
  tdc: (text) => text,
}))

let createBaseStore

beforeEach(async () => {
  setActivePinia(createPinia())
  httpGet.mockReset()
  httpGet.mockResolvedValue({ data: FIXTURE })
  httpAuthBlobGet.mockReset()
  ;({ createBaseStore } = await import('./base_store'))
})

describe('Schema 1.0 contract: fixture -> buildFormFromSchema -> BaseStore', () => {
  it('the backend endpoint prevails over the app/model convention', async () => {
    const useOrderStore = createBaseStore('order-contract', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()

    await store.loadSchema()

    // NOT "sales/orders" (the convention) - "custom/orders" (the backend's
    // own endpoint, trailing slash normalized away)
    expect(store.safeUrl).toBe('custom/orders')
  })

  it('falls back to the app/model convention when the schema has no model.endpoint', async () => {
    httpGet.mockResolvedValue({
      data: { ...FIXTURE, model: { ...FIXTURE.model, endpoint: undefined } },
    })

    const useOrderStore = createBaseStore('order-contract-fallback', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()

    await store.loadSchema()

    expect(store.safeUrl).toBe('sales/orders')
  })

  it('fields are converted for the form engine with the correct component per type', async () => {
    const useOrderStore = createBaseStore('order-contract-fields', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()

    await store.loadSchema()

    const byName = Object.fromEntries(store.fields.map(f => [f.name, f]))

    expect(byName.reference.ui.isChar).toBe(true)
    expect(byName.confirmed.ui.isNumeric).toBe(false)
    expect(byName.customer.ui.isRelation).toBe(true)
    expect(byName.due_date.type).toBe('DateField')
    expect(byName.total.ui.isNumeric).toBe(true)
    // choices -> select-style props (see utils/autoForm.js)
    expect(byName.status.props.emitValue).toBe(true)
    expect(byName.status.props.options).toEqual([
      { label: 'Draft', value: 'draft' },
      { label: 'Confirmed', value: 'confirmed' },
      { label: 'Cancelled', value: 'cancelled' },
    ])
  })

  it('permissions arrive from the backend, not reconstructed by convention', async () => {
    const useOrderStore = createBaseStore('order-contract-permissions', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()

    await store.loadSchema()

    expect(store.permissions.change).toBe('change_order')
    expect(store.permissions.custom).toEqual({ confirm: 'confirm_order' })
  })

  it('actions are usable by an action renderer: label, method, detail, endpoint, permission, visible, position', async () => {
    const useOrderStore = createBaseStore('order-contract-actions', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()

    await store.loadSchema()

    expect(store.actions).toHaveLength(1)
    const [confirm] = store.actions

    expect(confirm.label).toBe('Confirm')
    expect(confirm.method).toBe('POST')
    expect(confirm.detail).toBe(true)
    expect(confirm.endpoint).toBe('custom/orders/{id}/confirm/')
    expect(confirm.permission).toBe('confirm_order')
    expect(confirm.visible).toBe(true)
    expect(confirm.position).toBe('top')
  })

  it('pagination from the backend is incorporated, not left at the local default', async () => {
    const useOrderStore = createBaseStore('order-contract-pagination', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()

    await store.loadSchema()

    // the fixture deliberately uses 25, not the framework's local default
    // of 10 - proves this came from the backend's schema.pagination, not
    // a hardcoded default that never looked at it
    expect(store.paginationConfig.page_size).toBe(25)
    expect(store.pagination.rowsPerPage).toBe(25)
  })

  it('PDF config from the backend is respected by getPdf/getPdfList', async () => {
    httpAuthBlobGet.mockResolvedValue({
      data: new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
    })

    const useOrderStore = createBaseStore('order-contract-pdf', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()

    await store.loadSchema()
    await store.getPdf('7')

    expect(httpAuthBlobGet).toHaveBeenCalledWith('custom/orders/7/pdf/')
    expect(store.showPdf).toBe(true)
  })
})
