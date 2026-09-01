import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const httpGet = vi.fn()
const httpAuthBlobGet = vi.fn()

vi.mock('../services/api', () => ({
  url: ({ url }) => url,
  HTTPAuth: { get: (...args) => httpGet(...args) },
  HTTPAuthBlob: { get: (...args) => httpAuthBlobGet(...args) },
}))

vi.mock('../utils/autoForm', () => ({
  buildFormFromSchema: vi.fn(),
}))

const { buildFormFromSchema } = await import('../utils/autoForm')
const { createBaseStore } = await import('./base_store')

beforeEach(() => {
  setActivePinia(createPinia())
  httpGet.mockReset()
  httpAuthBlobGet.mockReset()
  buildFormFromSchema.mockReset()
})

function makeBlobResponse() {
  return { data: new Blob(['%PDF-1.4'], { type: 'application/pdf' }) }
}

describe('createBaseStore - safeUrl authority', () => {
  it('falls back to the {app}/{model}s convention before the schema loads', () => {
    const useProductStore = createBaseStore('product-url-fallback', {
      app: 'demo',
      model: 'Product',
    })
    const store = useProductStore()

    expect(store.safeUrl).toBe('demo/products')
  })

  it('prefers schema.model.endpoint once loadSchema() resolves', async () => {
    buildFormFromSchema.mockResolvedValue({
      fields: [], actions: [], config: {}, permissions: {}, pdf: {},
      schema: { model: { endpoint: 'demo/products/' } },
    })

    const useProductStore = createBaseStore('product-url-schema', {
      app: 'demo',
      model: 'Product',
    })
    const store = useProductStore()

    await store.loadSchema()

    // trailing slash from the backend's convention is normalized away so
    // every action's own `${safeUrl}/...` concatenation stays correct
    expect(store.safeUrl).toBe('demo/products')
  })

  it('a differently-shaped schema endpoint is honored verbatim (minus trailing slash)', async () => {
    buildFormFromSchema.mockResolvedValue({
      fields: [], actions: [], config: {}, permissions: {}, pdf: {},
      schema: { model: { endpoint: 'custom/path/products/' } },
    })

    const useProductStore = createBaseStore('product-url-custom', {
      app: 'demo',
      model: 'Product',
    })
    const store = useProductStore()

    await store.loadSchema()

    expect(store.safeUrl).toBe('custom/path/products')
  })

  it('keeps the convention fallback when the schema response has no model.endpoint', async () => {
    buildFormFromSchema.mockResolvedValue({
      fields: [], actions: [], config: {}, permissions: {}, pdf: {},
    })

    const useProductStore = createBaseStore('product-url-no-schema-field', {
      app: 'demo',
      model: 'Product',
    })
    const store = useProductStore()

    await store.loadSchema()

    expect(store.safeUrl).toBe('demo/products')
  })
})

describe('createBaseStore - schema-derived permissions/pdf config', () => {
  it('loadSchema captures permissions and pdf config from the schema response', async () => {
    buildFormFromSchema.mockResolvedValue({
      fields: [{ name: 'name' }],
      actions: [],
      config: { crud: true, routes: {} },
      permissions: { change: 'change_product', add: 'add_product' },
      pdf: {
        detail_endpoint: 'demo/products/{id}/pdf/',
        list_endpoint: 'demo/products/pdflist/',
      },
    })

    const useProductStore = createBaseStore('product-a', {
      app: 'demo',
      model: 'Product',
    })
    const store = useProductStore()

    await store.loadSchema()

    expect(store.permissions).toEqual({
      change: 'change_product',
      add: 'add_product',
    })
    expect(store.pdfConfig.detail_endpoint).toBe('demo/products/{id}/pdf/')
  })

  it('loadSchemaOnce only calls buildFormFromSchema a single time', async () => {
    buildFormFromSchema.mockResolvedValue({
      fields: [], actions: [], config: {}, permissions: {}, pdf: {},
    })

    const useProductStore = createBaseStore('product-b', {
      app: 'demo',
      model: 'Product',
    })
    const store = useProductStore()

    await store.loadSchemaOnce()
    await store.loadSchemaOnce()

    expect(buildFormFromSchema).toHaveBeenCalledTimes(1)
  })
})

describe('createBaseStore - getPdf/getPdfList prefer the schema endpoint', () => {
  it('getPdf uses schema.pdf.detail_endpoint (with {id} resolved) when available', async () => {
    httpAuthBlobGet.mockResolvedValue(makeBlobResponse())

    const useProductStore = createBaseStore('product-c', {
      app: 'demo',
      model: 'Product',
    })
    const store = useProductStore()
    store.pdfConfig = { detail_endpoint: 'demo/products/{id}/pdf/' }

    await store.getPdf('42')

    expect(httpAuthBlobGet).toHaveBeenCalledWith('demo/products/42/pdf/')
    expect(store.showPdf).toBe(true)
  })

  it('getPdf falls back to the computed safeUrl when the schema has no pdf config', async () => {
    httpAuthBlobGet.mockResolvedValue(makeBlobResponse())

    const useProductStore = createBaseStore('product-d', {
      app: 'demo',
      model: 'Product',
    })
    const store = useProductStore()

    await store.getPdf('42')

    expect(httpAuthBlobGet).toHaveBeenCalledWith('demo/products/42/pdf')
  })

  it('getPdfList uses schema.pdf.list_endpoint when available', async () => {
    httpAuthBlobGet.mockResolvedValue(makeBlobResponse())

    const useProductStore = createBaseStore('product-e', {
      app: 'demo',
      model: 'Product',
    })
    const store = useProductStore()
    store.pdfConfig = { list_endpoint: 'demo/products/pdflist/' }

    await store.getPdfList()

    expect(httpAuthBlobGet).toHaveBeenCalledWith('demo/products/pdflist/')
    expect(store.showPdf).toBe(true)
  })
})
