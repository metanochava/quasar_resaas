import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const httpGet = vi.fn()
const httpPost = vi.fn()
const httpPut = vi.fn()
const httpPatch = vi.fn()
const httpDelete = vi.fn()
const httpAuthBlobGet = vi.fn()

vi.mock('../services/api', () => ({
  url: ({ url, params }) => {
    const query = new URLSearchParams()
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) query.append(key, value)
    })
    const qs = query.toString()
    return qs ? `${url}?${qs}` : url
  },
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

describe('createBaseStore - custom action refresh lifecycle (FASE 2 - P1.3)', () => {
  /**
   * A custom action (approve/confirm/cancel/payment/...) is executed as
   * a plain HTTP call outside BaseStore itself (see AutoCrud.onRunAction,
   * which does its own HTTPAuth.request(...) then decides what to
   * refresh) - what BaseStore needs to guarantee is that the EXISTING
   * primitives (refreshRow, loadData) correctly refresh row-only,
   * list-only, or both, without ever serving stale cached data. No new
   * "refresh"/"refreshRow"/"refreshList" action metadata is introduced -
   * these tests reuse getById/refreshRow/loadData exactly as they
   * already exist.
   */

  it('a custom action can refresh just the row, leaving the list untouched', async () => {
    httpGet
      .mockResolvedValueOnce({ data: { id: '1', status: 'pending' } }) // getById
      .mockResolvedValueOnce({ data: { id: '1', status: 'confirmed' } }) // refreshRow (forced)

    const useOrderStore = createBaseStore('order-refresh-row-only', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()

    await store.getById('1')
    expect(store.row.status).toBe('pending')

    // ... the action itself would be a plain HTTPAuth.post/request call
    // against the action's own endpoint (out of BaseStore's concern) ...

    await store.refreshRow()

    expect(store.row.status).toBe('confirmed')
    expect(store.rows).toEqual([]) // list was never touched
    expect(httpGet).toHaveBeenCalledTimes(2)
  })

  it('a custom action can refresh just the list, leaving the loaded row untouched', async () => {
    httpGet
      .mockResolvedValueOnce({ data: { id: '1', status: 'pending' } }) // getById
      .mockResolvedValueOnce({
        data: { results: [{ id: '1', status: 'confirmed' }], count: 1 },
      }) // loadData

    const useOrderStore = createBaseStore('order-refresh-list-only', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()

    await store.getById('1')
    await store.loadData()

    // the row cached from getById() is intentionally left as-is - a
    // caller that only needs the table up to date doesn't pay for a
    // second single-row fetch
    expect(store.row.status).toBe('pending')
    expect(store.rows).toEqual([{ id: '1', status: 'confirmed' }])
    expect(store.pagination.rowsNumber).toBe(1)
  })

  it('a custom action can refresh both the row and the list', async () => {
    httpGet
      .mockResolvedValueOnce({ data: { id: '1', status: 'pending' } }) // getById
      .mockResolvedValueOnce({ data: { id: '1', status: 'confirmed' } }) // refreshRow
      .mockResolvedValueOnce({
        data: { results: [{ id: '1', status: 'confirmed' }], count: 1 },
      }) // loadData

    const useOrderStore = createBaseStore('order-refresh-both', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()

    await store.getById('1')
    await Promise.all([store.refreshRow(), store.loadData()])

    expect(store.row.status).toBe('confirmed')
    expect(store.rows).toEqual([{ id: '1', status: 'confirmed' }])
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

    // getPdfList() passes the current page/search/filters along too -
    // the mocked url() now mirrors the real one closely enough to show it
    expect(httpAuthBlobGet).toHaveBeenCalledWith(
      'demo/products/pdflist/?page=1&page_size=10&search='
    )
    expect(store.showPdf).toBe(true)
  })
})

describe('createBaseStore - pagination edge cases (FASE 3 - P2.4/P2.5)', () => {
  it('create() while on an intermediate page reloads that same page from the server (no local unshift)', async () => {
    httpPost.mockResolvedValue({ data: { id: 'new-1', name: 'New' } })
    httpGet.mockResolvedValue({
      data: { results: [{ id: 'p3-row' }], count: 21 },
    })

    const useOrderStore = createBaseStore('order-create-mid-page', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()
    store.pagination.page = 3
    store.form = { name: 'New' }

    await store.create()

    // loadData() was called with the CURRENT page (3), not reset to 1
    const calledUrl = httpGet.mock.calls[0][0]
    expect(calledUrl).toContain('page=3')
    expect(store.pagination.page).toBe(3)
    expect(store.rows).toEqual([{ id: 'p3-row' }])
  })

  it('remove()-ing the last row of a non-first page steps back a page instead of requesting a now-invalid page', async () => {
    httpDelete.mockResolvedValue({})
    httpGet.mockResolvedValue({
      data: { results: [{ id: 'p2-row' }], count: 11 },
    })

    const useOrderStore = createBaseStore('order-remove-last-of-page', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()
    store.pagination.page = 3
    store.rows = [{ id: 'last-on-page-3' }] // exactly one row on this page
    store.form = { id: 'last-on-page-3' }

    await store.remove()

    expect(store.pagination.page).toBe(2)
    const calledUrl = httpGet.mock.calls[0][0]
    expect(calledUrl).toContain('page=2')
    expect(store.rows).toEqual([{ id: 'p2-row' }])
  })

  it('remove()-ing a row while other rows remain on the page does not change the page', async () => {
    httpDelete.mockResolvedValue({})
    httpGet.mockResolvedValue({
      data: { results: [{ id: 'still-here' }], count: 12 },
    })

    const useOrderStore = createBaseStore('order-remove-not-last', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()
    store.pagination.page = 3
    store.rows = [{ id: 'gone' }, { id: 'still-here' }]
    store.form = { id: 'gone' }

    await store.remove()

    expect(store.pagination.page).toBe(3)
    const calledUrl = httpGet.mock.calls[0][0]
    expect(calledUrl).toContain('page=3')
  })

  it('remove()-ing the last row on page 1 stays on page 1 (nowhere to step back to)', async () => {
    httpDelete.mockResolvedValue({})
    httpGet.mockResolvedValue({ data: { results: [], count: 0 } })

    const useOrderStore = createBaseStore('order-remove-last-page-1', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()
    store.pagination.page = 1
    store.rows = [{ id: 'only-row' }]
    store.form = { id: 'only-row' }

    await store.remove()

    expect(store.pagination.page).toBe(1)
  })

  it('changing search resets to page 1', async () => {
    const useOrderStore = createBaseStore('order-search-reset', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()
    store.pagination.page = 5

    store.setSearch('widget')

    expect(store.pagination.page).toBe(1)
  })

  it('changing filters resets to page 1', async () => {
    const useOrderStore = createBaseStore('order-filter-reset', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()
    store.pagination.page = 5

    store.setFilters({ status: 'confirmed' })

    expect(store.pagination.page).toBe(1)
  })

  it('updateFilter/removeFilter/clearFilters also reset to page 1', async () => {
    const useOrderStore = createBaseStore('order-filter-mutations-reset', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()

    store.pagination.page = 5
    store.updateFilter('status', 'confirmed')
    expect(store.pagination.page).toBe(1)

    store.pagination.page = 5
    store.removeFilter('status')
    expect(store.pagination.page).toBe(1)

    store.pagination.page = 5
    store.clearFilters()
    expect(store.pagination.page).toBe(1)
  })

  it('rowsNumber tracks the server count through create/remove/loadData', async () => {
    const useOrderStore = createBaseStore('order-rows-number', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()

    httpGet.mockResolvedValueOnce({ data: { results: [{ id: '1' }], count: 1 } })
    await store.loadData()
    expect(store.pagination.rowsNumber).toBe(1)

    httpPost.mockResolvedValue({ data: { id: '2' } })
    httpGet.mockResolvedValueOnce({
      data: { results: [{ id: '1' }, { id: '2' }], count: 2 },
    })
    store.form = { name: 'X' }
    await store.create()
    expect(store.pagination.rowsNumber).toBe(2)

    httpDelete.mockResolvedValue({})
    httpGet.mockResolvedValueOnce({ data: { results: [{ id: '2' }], count: 1 } })
    store.form = { id: '1' }
    store.rows = [{ id: '1' }, { id: '2' }]
    await store.remove()
    expect(store.pagination.rowsNumber).toBe(1)
  })
})

describe('createBaseStore - HTTP error resilience (FASE 3 - P2.8/P2.9/P2.10)', () => {
  function httpError(status, data) {
    const err = new Error(`Request failed with status ${status}`)
    err.response = { status, data }
    return err
  }

  it('loadData() resets loading to false even when the request fails, and keeps the previous rows', async () => {
    const useOrderStore = createBaseStore('order-error-loaddata', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()
    store.rows = [{ id: 'stale-but-valid' }]

    httpGet.mockRejectedValueOnce(httpError(500, { detail: 'boom' }))

    await expect(store.loadData()).rejects.toThrow()

    expect(store.loading).toBe(false)
    // no silent data loss - the last known-good rows are still there
    expect(store.rows).toEqual([{ id: 'stale-but-valid' }])
  })

  it('getById() resets loading to false on failure and does not cache a broken row', async () => {
    const useOrderStore = createBaseStore('order-error-getbyid', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()

    httpGet.mockRejectedValueOnce(httpError(404, { detail: 'not found' }))

    await expect(store.getById('missing')).rejects.toThrow()

    expect(store.loading).toBe(false)
    expect(store.row).toBeNull()
  })

  it('create() resets loading to false on failure without touching rows/pagination', async () => {
    const useOrderStore = createBaseStore('order-error-create', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()
    store.rows = [{ id: 'existing' }]
    store.pagination.rowsNumber = 1
    store.form = { name: 'Bad' }

    httpPost.mockRejectedValueOnce(httpError(400, { name: ['This field is required.'] }))

    await expect(store.create()).rejects.toThrow()

    expect(store.loading).toBe(false)
    expect(store.rows).toEqual([{ id: 'existing' }])
    expect(store.pagination.rowsNumber).toBe(1)
  })

  it('update() resets saving to false and does NOT pretend the backend accepted the change', async () => {
    const useOrderStore = createBaseStore('order-error-update', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()
    store.row = { id: '1', status: 'draft' }
    store.form = { id: '1', status: 'confirmed' }

    httpPatch.mockRejectedValueOnce(httpError(409, { detail: 'already processed' }))

    await expect(store.update()).rejects.toThrow()

    expect(store.saving).toBe(false)
    // store.row still reflects the last CONFIRMED server state, not the
    // optimistic edit that was rejected
    expect(store.row.status).toBe('draft')
  })

  it('remove() resets saving to false and leaves rows untouched on failure', async () => {
    const useOrderStore = createBaseStore('order-error-remove', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()
    store.rows = [{ id: '1' }]
    store.form = { id: '1' }

    httpDelete.mockRejectedValueOnce(httpError(403, { detail: 'forbidden' }))

    await expect(store.remove()).rejects.toThrow()

    expect(store.saving).toBe(false)
    expect(store.rows).toEqual([{ id: '1' }])
  })

  it('401/403/409 errors reach the caller with status and response data intact, not swallowed or genericized', async () => {
    const useOrderStore = createBaseStore('order-error-shape', {
      app: 'sales', model: 'Order',
    })
    const store = useOrderStore()
    store.form = { id: '1', status: 'confirmed' }

    httpPatch.mockRejectedValueOnce(
      httpError(409, { detail: 'stock insufficient', code: 'stock_conflict' })
    )

    let caught = null
    try {
      await store.update()
    } catch (e) {
      caught = e
    }

    expect(caught).not.toBeNull()
    expect(caught.response.status).toBe(409)
    expect(caught.response.data).toEqual({
      detail: 'stock insufficient', code: 'stock_conflict',
    })
  })
})
