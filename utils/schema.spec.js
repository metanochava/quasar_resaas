import { describe, it, expect } from 'vitest'
import {
  RESAAS_SCHEMA_VERSION,
  DEFAULT_UI,
  DEFAULT_FILTERS,
  DEFAULT_PAGINATION,
  DEFAULT_PDF,
  normalizeSchema,
  schemaPermission,
  canSchema,
  resolveActionEndpoint,
  resolvePdfDetailEndpoint
} from './schema.js'

describe('normalizeSchema', () => {
  it('exposes the current schema version', () => {
    expect(RESAAS_SCHEMA_VERSION).toBe('1.0')
  })

  it('normalizes an empty payload into the documented default shape', () => {
    const schema = normalizeSchema({})
    expect(schema.schema_version).toBe('1.0')
    expect(schema.model).toEqual({
      app: '',
      name: '',
      class_name: '',
      label: '',
      label_plural: '',
      pk: 'id',
      endpoint: '',
    })
    expect(schema.ui).toEqual(DEFAULT_UI)
    expect(schema.filters).toEqual(DEFAULT_FILTERS)
    expect(schema.pagination).toEqual(DEFAULT_PAGINATION)
    expect(schema.pdf).toEqual(DEFAULT_PDF)
  })

  it('mirrors the backend pagination default exactly (5..1000, unlimited)', () => {
    // regression guard: this array previously disagreed across three
    // different places in the codebase (utils/schema.js, AutoTable.vue,
    // and the backend's ResaasSchemaBuilder.build_pagination())
    expect(DEFAULT_PAGINATION.page_size_options).toEqual([
      5, 10, 20, 50, 100, 200, 500, 1000, 0,
    ])
  })

  it('merges configured ui/filters/pagination/pdf over the defaults key-by-key', () => {
    const schema = normalizeSchema({
      ui: { dense: false, show_pdf: false },
      pagination: { page_size: 25 },
    })

    // explicit overrides took effect...
    expect(schema.ui.dense).toBe(false)
    expect(schema.ui.show_pdf).toBe(false)
    expect(schema.pagination.page_size).toBe(25)

    // ...but unspecified keys keep their defaults (merge, not replace)
    expect(schema.ui.striped).toBe(true)
    expect(schema.pagination.default_ordering).toBe('-id')
  })

  it('unwraps a raw axios-style {data: {...}} response', () => {
    const schema = normalizeSchema({
      data: { model: { app: 'hr', name: 'employee', endpoint: 'hr/employees/' } },
    })
    expect(schema.model.app).toBe('hr')
    expect(schema.model.endpoint).toBe('hr/employees/')
  })

  it('falls back to the deprecated module/config aliases when present', () => {
    const schema = normalizeSchema({
      module: 'hr',
      config: { crud: false, routes: { list: 'custom_list' } },
    })
    expect(schema.model.app).toBe('hr')
    expect(schema.routes).toEqual({ list: 'custom_list' })
  })
})

describe('schemaPermission / canSchema', () => {
  const schema = {
    permissions: {
      change: 'change_product',
      custom: { archive: 'archive_product' },
    },
  }

  it('resolves a standard CRUD permission', () => {
    expect(schemaPermission(schema, 'change')).toBe('change_product')
  })

  it('falls back to a custom action permission', () => {
    expect(schemaPermission(schema, 'archive')).toBe('archive_product')
  })

  it('returns null for an unknown action', () => {
    expect(schemaPermission(schema, 'nope')).toBeNull()
  })

  it('canSchema defers to User.can() with the resolved permission', () => {
    const User = { can: (perm) => perm === 'change_product' }
    expect(canSchema(User, schema, 'change')).toBe(true)
    expect(canSchema(User, schema, 'nope')).toBe(false)
  })
})

describe('resolveActionEndpoint', () => {
  it('substitutes {id} for a detail action', () => {
    const action = { details: true, endpoint: 'demo/products/{id}/archive/' }
    expect(resolveActionEndpoint(action, { id: '42' })).toBe(
      'demo/products/42/archive/'
    )
  })

  it('leaves a non-detail action endpoint untouched', () => {
    const action = { details: false, endpoint: 'demo/products/export/' }
    expect(resolveActionEndpoint(action, { id: '42' })).toBe(
      'demo/products/export/'
    )
  })

  it('falls back to action.url when there is no endpoint', () => {
    expect(resolveActionEndpoint({ url: 'custom/path/' })).toBe('custom/path/')
  })
})

describe('resolvePdfDetailEndpoint', () => {
  it('substitutes {id} in the schema pdf detail endpoint', () => {
    const schema = { pdf: { detail_endpoint: 'demo/products/{id}/pdf/' } }
    expect(resolvePdfDetailEndpoint(schema, { id: '7' })).toBe(
      'demo/products/7/pdf/'
    )
  })

  it('returns an empty string when the schema has no pdf endpoint', () => {
    expect(resolvePdfDetailEndpoint({}, { id: '7' })).toBe('')
  })
})
