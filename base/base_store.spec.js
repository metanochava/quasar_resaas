import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const httpGet = vi.fn()
const httpPost = vi.fn()
const httpPut = vi.fn()
const httpPatch = vi.fn()
const httpDelete = vi.fn()
const httpAuthBlobGet = vi.fn()

vi.mock('../services/api', () => ({
  url: ({ url }) => url,
  HTTPAuth: {
    get: (...args) => httpGet(...args),
    post: (...args) => httpPost(...args),
    put: (...args) => httpPut(...args),
    patch: (...args) => httpPatch(...args),
    delete: (...args) => httpDelete(...args),
  },
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
  httpPost.mockReset()
  httpPut.mockReset()
  httpPatch.mockReset()
  httpDelete.mockReset()
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

describe('createBaseStore - create()/remove() refresh the list from the server', () => {
  it('create() re-fetches the list instead of unshifting the new row locally', async () => {
    httpPost.mockResolvedValue({ data: { id: 'new-1', name: 'New' } })
    httpGet.mockResolvedValue({
      data: { results: [{ id: 'server-1' }, { id: 'new-1' }], count: 2 },
    })

    const useProductStore = createBaseStore('product-create', {
      app: 'demo', model: 'Product',
    })
    const store = useProductStore()
    store.form = { name: 'New' }

    await store.create()

    expect(httpGet).toHaveBeenCalledTimes(1) // the loadData() refresh
    expect(store.rows).toEqual([{ id: 'server-1' }, { id: 'new-1' }])
    expect(store.pagination.rowsNumber).toBe(2)
    expect(store.row).toEqual({ id: 'new-1', name: 'New' })
  })

  it('remove() re-fetches the list instead of filtering the row out locally', async () => {
    httpDelete.mockResolvedValue({})
    httpGet.mockResolvedValue({ data: { results: [{ id: 'server-1' }], count: 1 } })

    const useProductStore = createBaseStore('product-remove', {
      app: 'demo', model: 'Product',
    })
    const store = useProductStore()
    store.form = { id: 'gone-1' }
    store.rows = [{ id: 'gone-1' }, { id: 'server-1' }]

    await store.remove()

    expect(httpGet).toHaveBeenCalledTimes(1) // the loadData() refresh
    expect(store.rows).toEqual([{ id: 'server-1' }])
    expect(store.pagination.rowsNumber).toBe(1)
  })
})

describe('createBaseStore - update() defaults to PATCH', () => {
  it('update() uses PATCH by default', async () => {
    httpPatch.mockResolvedValue({ data: { id: '1', name: 'Patched' } })

    const useProductStore = createBaseStore('product-patch', {
      app: 'demo', model: 'Product',
    })
    const store = useProductStore()
    store.form = { id: '1', name: 'Patched' }

    await store.update()

    expect(httpPatch).toHaveBeenCalledTimes(1)
    expect(httpPut).not.toHaveBeenCalled()
    expect(store.row).toEqual({ id: '1', name: 'Patched' })
  })

  it('update({ method: "put" }) opts into a full replace', async () => {
    httpPut.mockResolvedValue({ data: { id: '1', name: 'Replaced' } })

    const useProductStore = createBaseStore('product-put', {
      app: 'demo', model: 'Product',
    })
    const store = useProductStore()
    store.form = { id: '1', name: 'Replaced' }

    await store.update({ method: 'put' })

    expect(httpPut).toHaveBeenCalledTimes(1)
    expect(httpPatch).not.toHaveBeenCalled()
  })

  it('save() forwards its options to update() for an existing row', async () => {
    httpPut.mockResolvedValue({ data: { id: '1', name: 'Via save' } })

    const useProductStore = createBaseStore('product-save-put', {
      app: 'demo', model: 'Product',
    })
    const store = useProductStore()
    store.form = { id: '1', name: 'Via save' }

    await store.save({ method: 'put' })

    expect(httpPut).toHaveBeenCalledTimes(1)
  })
})

describe('createBaseStore - getById cache / force / invalidateRow / refreshRow', () => {
  it('getById returns the cached row when the id matches and force is not set', async () => {
    httpGet.mockResolvedValue({ data: { id: '1', name: 'First fetch' } })

    const useProductStore = createBaseStore('product-cache', {
      app: 'demo', model: 'Product',
    })
    const store = useProductStore()

    await store.getById('1')
    expect(httpGet).toHaveBeenCalledTimes(1)

    const cached = await store.getById('1')
    expect(httpGet).toHaveBeenCalledTimes(1) // no second request
    expect(cached).toEqual({ id: '1', name: 'First fetch' })
  })

  it('getById(id, { force: true }) bypasses the cache', async () => {
    httpGet
      .mockResolvedValueOnce({ data: { id: '1', name: 'First fetch' } })
      .mockResolvedValueOnce({ data: { id: '1', name: 'Updated server-side' } })

    const useProductStore = createBaseStore('product-force', {
      app: 'demo', model: 'Product',
    })
    const store = useProductStore()

    await store.getById('1')
    const fresh = await store.getById('1', { force: true })

    expect(httpGet).toHaveBeenCalledTimes(2)
    expect(fresh).toEqual({ id: '1', name: 'Updated server-side' })
  })

  it('invalidateRow clears the cached row so the next getById re-fetches', async () => {
    httpGet.mockResolvedValue({ data: { id: '1', name: 'X' } })

    const useProductStore = createBaseStore('product-invalidate', {
      app: 'demo', model: 'Product',
    })
    const store = useProductStore()

    await store.getById('1')
    store.invalidateRow()
    expect(store.row).toBeNull()

    await store.getById('1')
    expect(httpGet).toHaveBeenCalledTimes(2)
  })

  it('refreshRow re-fetches the currently loaded row, forced', async () => {
    httpGet
      .mockResolvedValueOnce({ data: { id: '1', name: 'Stale' } })
      .mockResolvedValueOnce({ data: { id: '1', name: 'Fresh' } })

    const useProductStore = createBaseStore('product-refresh', {
      app: 'demo', model: 'Product',
    })
    const store = useProductStore()

    await store.getById('1')
    const refreshed = await store.refreshRow()

    expect(httpGet).toHaveBeenCalledTimes(2)
    expect(refreshed).toEqual({ id: '1', name: 'Fresh' })
    expect(store.row).toEqual({ id: '1', name: 'Fresh' })
  })

  it('refreshRow is a no-op when no row is loaded', async () => {
    const useProductStore = createBaseStore('product-refresh-empty', {
      app: 'demo', model: 'Product',
    })
    const store = useProductStore()

    const result = await store.refreshRow()

    expect(result).toBeUndefined()
    expect(httpGet).not.toHaveBeenCalled()
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
