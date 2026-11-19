// One request for many callers (the login boot used to fire the same GETs
// several times: entitytypes/ up to 9 times, the Entity look's 4 endpoints
// 3-5 times each, me/, menus/, translations...).
//
// shared(key, fn, { ttl }) runs fn() once: callers with the same key while it
// is in flight get the same promise; for `ttl` ms after it settles they get
// its answer again (0 = only while in flight). A failed request is never
// kept. forgetShared(prefix) drops what was kept (all of it without a
// prefix) - signing out does, and so does anything that changes the data.
const entries = new Map()

export function shared (key, fn, { ttl = 0 } = {}) {
  const hit = entries.get(key)
  if (hit && (hit.pending || Date.now() - hit.at < ttl)) return hit.promise

  const entry = { pending: true, at: Date.now() }
  entry.promise = Promise.resolve().then(fn)
  entries.set(key, entry)

  entry.promise.then(
    () => {
      entry.pending = false
      entry.at = Date.now()
      if (!ttl && entries.get(key) === entry) entries.delete(key)
    },
    () => { if (entries.get(key) === entry) entries.delete(key) }
  )

  return entry.promise
}

export function forgetShared (prefix = '') {
  for (const key of [...entries.keys()]) {
    if (!prefix || key.startsWith(prefix)) entries.delete(key)
  }
}
