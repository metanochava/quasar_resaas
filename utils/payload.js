// A record loaded with BaseStore.getById() holds the API's READ shape:
// choices/relations as {id, value, label}, files as {url, name, ...}, plus
// computed/read-only extras (label, age, *_data, ...). The backend
// serializers do not accept that shape back, so an edit page must send a
// WRITE payload instead - the same normalisation FormComponent.vue's own
// buildPayload() applies before it PATCHes, built here from the store's
// schema so it works for any model.
//
//   fields       store.fields (buildFormFromSchema output)
//   passthrough  nested objects the serializer accepts as-is (e.g. a
//                Person's `address`) that are not schema model fields
//   exclude      names to leave out (e.g. locked or server-generated)
const isFileType = (type) => ['FileField', 'ImageField'].includes(type)

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize)

  if (value && typeof value === 'object' && !(value instanceof File)) {
    if ('value' in value) return value.value
    if ('id' in value) return value.id
  }

  return value
}

export function buildWritePayload(form, fields, { passthrough = [], exclude = [] } = {}) {
  const payload = {}
  const skipped = new Set(exclude)

  for (const field of fields || []) {
    const { name } = field

    if (skipped.has(name) || field.read_only || !(name in (form || {}))) continue

    const value = form[name]

    // A FileField only ever accepts a real upload; the {url, ...} it was
    // loaded as (or nothing) means "unchanged".
    if (isFileType(field.type)) {
      if (value instanceof File) payload[name] = value
      continue
    }

    if (value === undefined) continue

    payload[name] = normalize(value)
  }

  for (const name of passthrough) {
    if (!skipped.has(name) && form?.[name] !== undefined) payload[name] = form[name]
  }

  return payload
}

// Runs store.update() with `payload` (plus the record id) as the request
// body: BaseStore.update() always sends store.form, so the loaded form is
// swapped for the payload for the call and put back if it fails (on
// success update() itself replaces the form with the fresh response).
export async function updateWithPayload(store, payload) {
  const loaded = store.form

  store.form = { id: loaded.id, ...payload }

  try {
    return await store.update()
  } catch (error) {
    store.form = loaded
    throw error
  }
}

// Shallow copy without `keys` (the rest-destructure idiom trips
// no-unused-vars for the omitted names).
export function omit(source, keys) {
  return Object.fromEntries(Object.entries(source || {}).filter(([key]) => !keys.includes(key)))
}
