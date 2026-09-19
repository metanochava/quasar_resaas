import { ref, onBeforeUnmount, getCurrentInstance } from 'vue'
import { HTTPAuth, url } from '../services/api'

// Search behind a relation picker (<s-relation-picker>): whatever model a
// relation field points at, its OWN list endpoint (relationConfig.endpoint)
// is queried in select mode - so tenant scope, list permission and the
// model's RESAAS.search_fields are enforced by the backend, exactly like
// every other list call - and `preview=true` asks it for the bounded
// display data the related model declared (RESAAS.preview).
//
// Nothing here knows which model that is. It only takes care of what a
// high-frequency search needs: debounce, cancelling/ignoring stale
// responses, pagination ("load more") and a by-id lookup for showing a value
// that was loaded without its preview.
//
//   relationConfig  ref/getter -> schema field's relation_config
const DEFAULT_PAGE_SIZE = 10
const DEFAULT_DEBOUNCE = 300

export function toRow(row) {
  return {
    value: row.value ?? row.id,
    id: row.id ?? row.value,
    label: row.label ?? String(row.value ?? row.id ?? ''),
    preview: row.preview || null
  }
}

export function useRelationSearch(relationConfig, { pageSize = DEFAULT_PAGE_SIZE, debounce = DEFAULT_DEBOUNCE } = {}) {
  const config = () => (typeof relationConfig === 'function' ? relationConfig() : relationConfig?.value ?? relationConfig)

  const results = ref([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const hasMore = ref(false)
  const searched = ref(false)
  const failed = ref(false)

  let next = null
  let timer = null
  let controller = null
  let sequence = 0
  let lastQuery = null

  function endpoint() {
    return config()?.endpoint || null
  }

  function cancel() {
    clearTimeout(timer)
    timer = null
    controller?.abort()
    controller = null
    // any response still in flight is now stale
    sequence += 1
  }

  async function request(target, params) {
    controller?.abort()
    controller = typeof AbortController !== 'undefined' ? new AbortController() : null

    const { data } = await HTTPAuth.get(target, { params, signal: controller?.signal })

    return data
  }

  function firstPageUrl() {
    return url({ type: 'u', url: endpoint(), params: {} })
  }

  async function load(query, { more = false } = {}) {
    if (!endpoint()) return

    const mine = ++sequence

    if (more) loadingMore.value = true
    else loading.value = true

    failed.value = false

    try {
      const data = more
        ? await request(next, {})
        : await request(firstPageUrl(), { select: 'true', preview: 'true', search: query || '', page_size: pageSize })

      // a newer search (or a cancel) started meanwhile - drop this answer
      if (mine !== sequence) return

      const rows = (data?.results ?? data ?? []).map(toRow)

      results.value = more ? [...results.value, ...rows] : rows
      next = data?.next ?? null
      hasMore.value = !!next
      searched.value = true
    } catch (error) {
      if (mine !== sequence || error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') return

      failed.value = true
      results.value = more ? results.value : []
      hasMore.value = false
    } finally {
      if (mine === sequence) {
        loading.value = false
        loadingMore.value = false
      }
    }
  }

  // Debounced: typing never fires a request per keystroke.
  function search(query) {
    clearTimeout(timer)

    timer = setTimeout(() => {
      timer = null
      lastQuery = query || ''
      load(lastQuery)
    }, debounce)
  }

  // Immediate (opening the picker, retry).
  function searchNow(query = '') {
    clearTimeout(timer)
    timer = null
    lastQuery = query || ''
    return load(lastQuery)
  }

  function loadMore() {
    if (!next || loadingMore.value || loading.value) return
    return load(lastQuery, { more: true })
  }

  // One record with its preview, e.g. to show a value that was loaded from
  // the read shape ({id, value, label}). null when it is not visible to the
  // user (other tenant, no permission) - callers keep showing the label.
  async function fetchOne(id) {
    if (!endpoint() || id === null || id === undefined || id === '') return null

    try {
      const data = await HTTPAuth.get(firstPageUrl(), {
        params: { select: 'true', preview: 'true', id, page_size: 1 }
      }).then(response => response.data)

      const row = (data?.results ?? data ?? [])[0]

      return row ? toRow(row) : null
    } catch {
      return null
    }
  }

  function reset() {
    cancel()
    results.value = []
    next = null
    hasMore.value = false
    searched.value = false
    failed.value = false
    loading.value = false
    loadingMore.value = false
  }

  if (getCurrentInstance()) onBeforeUnmount(cancel)

  return { results, loading, loadingMore, hasMore, searched, failed, search, searchNow, loadMore, fetchOne, reset, cancel }
}
