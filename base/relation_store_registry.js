import { createBaseStore } from './base_store'

// A relation "quick create" dialog (SelectComponent.vue's + button)
// needs a fully schema-aware BaseStore for whatever model the relation
// points to - which could be ANY model in the app, discovered only at
// render time from the field's own relation_config (app/model). That
// rules out a hand-written store per model (the whole point is this
// stays generic/metadata-driven), so a store is built on the fly with
// the same createBaseStore() every other store already uses.
//
// Deliberately its OWN store per related model (id
// `relation_quickcreate_<app>.<Model>`), never the app's existing
// dedicated store for that model (e.g. useEmployeeStore) - reusing that
// one here would stomp on whatever .form/.row it's currently holding
// for its own page, the exact session-corruption bug UserAdminStore
// was split out to fix earlier (see stores/UserAdminStore.js).
const registry = new Map()

export function getRelationStore(app, model) {
  const key = `${app}.${model}`

  if (!registry.has(key)) {
    registry.set(
      key,
      createBaseStore(`relation_quickcreate_${key}`, { app, model })
    )
  }

  return registry.get(key)()
}
