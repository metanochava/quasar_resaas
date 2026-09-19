import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const httpGet = vi.fn()

vi.mock('../services/api', () => ({
  HTTPAuth: { get: (...args) => httpGet(...args) },
  url: ({ url: path }) => `/api/${path}`
}))

import { useRelationSearch, toRow } from './useRelationSearch'

const config = { endpoint: 'django_resaas/persons/' }

const page = (rows, next = null) => ({ data: { results: rows, next } })
const row = (id, label, preview = null) => ({ id, value: id, label, preview })

// a request the test resolves by hand, to interleave answers
function deferred() {
  let resolve
  const promise = new Promise(r => { resolve = r })
  return { promise, resolve }
}

beforeEach(() => {
  httpGet.mockReset()
  vi.useFakeTimers()
})

afterEach(() => vi.useRealTimers())

describe('useRelationSearch', () => {
  it('asks the related endpoint for a select-mode page with previews', async () => {
    httpGet.mockResolvedValue(page([row('1', 'Ana', { title: 'Ana', subtitle: ['a@x.com'] })]))
    const s = useRelationSearch(config)

    await s.searchNow('an')

    const [target, options] = httpGet.mock.calls[0]
    expect(target).toBe('/api/django_resaas/persons/')
    expect(options.params).toMatchObject({ select: 'true', preview: 'true', search: 'an', page_size: 10 })
    expect(s.results.value).toEqual([{ value: '1', id: '1', label: 'Ana', preview: { title: 'Ana', subtitle: ['a@x.com'] } }])
    expect(s.searched.value).toBe(true)
  })

  it('debounces typing into a single request', async () => {
    httpGet.mockResolvedValue(page([]))
    const s = useRelationSearch(config, { debounce: 300 })

    s.search('a')
    s.search('an')
    s.search('ana')
    await vi.advanceTimersByTimeAsync(299)
    expect(httpGet).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(2)
    expect(httpGet).toHaveBeenCalledTimes(1)
    expect(httpGet.mock.calls[0][1].params.search).toBe('ana')
  })

  it('drops a stale response that arrives after a newer search', async () => {
    const slow = deferred()
    httpGet
      .mockReturnValueOnce(slow.promise)
      .mockResolvedValueOnce(page([row('2', 'Bruno')]))
    const s = useRelationSearch(config)

    const first = s.searchNow('a')
    await s.searchNow('b')
    slow.resolve(page([row('1', 'Ana')]))
    await first

    expect(s.results.value.map(r => r.label)).toEqual(['Bruno'])
    expect(s.loading.value).toBe(false)
  })

  it('cancels the in-flight request through an abort signal', async () => {
    httpGet.mockReturnValue(new Promise(() => {}))
    const s = useRelationSearch(config)

    s.searchNow('a')
    const { signal } = httpGet.mock.calls[0][1]
    s.cancel()

    expect(signal.aborted).toBe(true)
  })

  it('loads the next page and appends it', async () => {
    httpGet
      .mockResolvedValueOnce(page([row('1', 'Ana')], '/api/django_resaas/persons/?page=2'))
      .mockResolvedValueOnce(page([row('2', 'Bruno')]))
    const s = useRelationSearch(config)

    await s.searchNow('')
    expect(s.hasMore.value).toBe(true)

    await s.loadMore()

    expect(httpGet.mock.calls[1][0]).toBe('/api/django_resaas/persons/?page=2')
    expect(s.results.value.map(r => r.label)).toEqual(['Ana', 'Bruno'])
    expect(s.hasMore.value).toBe(false)
  })

  it('reports a failed search without leaving stale results', async () => {
    httpGet.mockResolvedValueOnce(page([row('1', 'Ana')])).mockRejectedValueOnce(new Error('boom'))
    const s = useRelationSearch(config)

    await s.searchNow('a')
    await s.searchNow('b')

    expect(s.failed.value).toBe(true)
    expect(s.results.value).toEqual([])
  })

  it('does nothing without an endpoint', async () => {
    const s = useRelationSearch({})
    await s.searchNow('a')

    expect(httpGet).not.toHaveBeenCalled()
  })

  it('fetchOne looks a single record up by id and tolerates a hidden one', async () => {
    const s = useRelationSearch(config)

    httpGet.mockResolvedValueOnce(page([row('7', 'Zed', { title: 'Zed' })]))
    expect(await s.fetchOne('7')).toMatchObject({ value: '7', preview: { title: 'Zed' } })
    expect(httpGet.mock.calls[0][1].params).toMatchObject({ id: '7', select: 'true', preview: 'true' })

    httpGet.mockResolvedValueOnce(page([]))
    expect(await s.fetchOne('8')).toBeNull()

    httpGet.mockRejectedValueOnce(new Error('403'))
    expect(await s.fetchOne('9')).toBeNull()
  })

  it('toRow keeps the option shape every relation select already uses', () => {
    expect(toRow({ id: 5, label: 'Five' })).toEqual({ value: 5, id: 5, label: 'Five', preview: null })
  })
})
