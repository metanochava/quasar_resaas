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
  resolvePdfDetailEndpoint,
  resolveRules,
  guessComponent,
  relationPickerComponent
} from './schema.js'

describe('relation picker selection (schema variant)', () => {
  const card = { name: 'person', type: 'ForeignKey', component: 's-select', relation: 'django_resaas.Person', relation_config: { variant: 'card' } }

  it('a relation whose relation_config.variant is "card" resolves to the picker', () => {
    expect(guessComponent(card)).toBe('s-relation-picker')
    expect(relationPickerComponent(card)).toBe('s-relation-picker')
  })

  it('is decided by the variant only - never by the model or field name', () => {
    expect(guessComponent({ ...card, name: 'anything', relation: 'demo.Product' })).toBe('s-relation-picker')
    expect(guessComponent({ ...card, relation_config: { variant: 'select' } })).toBe('s-select')
    expect(guessComponent({ ...card, relation_config: null })).toBe('s-select')
  })

  it('a many-to-many keeps the multi-select even if it were flagged "card"', () => {
    expect(guessComponent({ ...card, type: 'ManyToManyField', component: 's-multiselect' })).toBe('s-multiselect')
  })
})

describe('guessComponent', () => {
  it('always prefers an explicit field.component when present', () => {
    expect(guessComponent({ component: 's-editor', type: 'CharField' })).toBe('s-editor')
  })

  it('guesses s-select for a field with choices', () => {
    expect(guessComponent({ choices: [['a', 'A']] })).toBe('s-select')
  })

  it('guesses s-file for FileField/ImageField, by type or by ui flag', () => {
    expect(guessComponent({ type: 'FileField' })).toBe('s-file')
    expect(guessComponent({ type: 'ImageField' })).toBe('s-file')
    expect(guessComponent({ type: 'CharField', ui: { isFile: true } })).toBe('s-file')
    expect(guessComponent({ type: 'CharField', ui: { isImage: true } })).toBe('s-file')
  })

  it('guesses s-select for a to-one relation, s-multiselect for a to-many one', () => {
    expect(guessComponent({ type: 'ForeignKey', relation: 'hr.Employee' })).toBe('s-select')
    expect(guessComponent({ type: 'OneToOneField', relation: 'django_resaas.Person' })).toBe('s-select')
    expect(guessComponent({ type: 'ManyToManyField', relation: 'auth.Permission' })).toBe('s-multiselect')
    expect(guessComponent({ type: 'ManyToManyField', ui: { isRelation: true } })).toBe('s-multiselect')
  })

  it('guesses by plain Django field type for everything else', () => {
    expect(guessComponent({ type: 'BooleanField' })).toBe('s-switch')
    expect(guessComponent({ type: 'TextField' })).toBe('s-editor')
    expect(guessComponent({ type: 'DateField' })).toBe('s-date')
    expect(guessComponent({ type: 'TimeField' })).toBe('s-time')
    expect(guessComponent({ type: 'DateTimeField' })).toBe('s-date-time')
  })

  it('falls back to s-input for a plain CharField or an unknown type', () => {
    expect(guessComponent({ type: 'CharField' })).toBe('s-input')
    expect(guessComponent({ type: 'SomeFutureFieldType' })).toBe('s-input')
    expect(guessComponent({})).toBe('s-input')
  })
})

describe('resolveRules', () => {
  it('converts a required rule descriptor into a validator that fails on empty', () => {
    const [rule] = resolveRules([{ type: 'required', message: 'Field is required' }])

    expect(rule('')).toBe('Field is required')
    expect(rule(null)).toBe('Field is required')
    expect(rule('x')).toBe(true)
  })

  it('converts min_length/max_length/min/max/email the same way FormComponent.vue always relied on', () => {
    const [minLen] = resolveRules([{ type: 'min_length', value: 3, message: 'too short' }])
    expect(minLen('ab')).toBe('too short')
    expect(minLen('abc')).toBe(true)

    const [maxLen] = resolveRules([{ type: 'max_length', value: 3, message: 'too long' }])
    expect(maxLen('abcd')).toBe('too long')
    expect(maxLen('abc')).toBe(true)

    const [min] = resolveRules([{ type: 'min', value: 5, message: 'too small' }])
    expect(min(4)).toBe('too small')
    expect(min(5)).toBe(true)

    const [max] = resolveRules([{ type: 'max', value: 5, message: 'too big' }])
    expect(max(6)).toBe('too big')
    expect(max(5)).toBe(true)

    const [email] = resolveRules([{ type: 'email', message: 'invalid email' }])
    expect(email('not-an-email')).toBe('invalid email')
    expect(email('a@b.com')).toBe(true)
  })

  it('an unknown rule type always passes, never blocking submission', () => {
    const [rule] = resolveRules([{ type: 'something_new' }])
    expect(rule('anything')).toBe(true)
  })
})

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
  it('substitutes {id} for a detail action (legacy "details" key)', () => {
    const action = { details: true, endpoint: 'demo/products/{id}/archive/' }
    expect(resolveActionEndpoint(action, { id: '42' })).toBe(
      'demo/products/42/archive/'
    )
  })

  it('leaves a non-detail action endpoint untouched (legacy "details" key)', () => {
    const action = { details: false, endpoint: 'demo/products/export/' }
    expect(resolveActionEndpoint(action, { id: '42' })).toBe(
      'demo/products/export/'
    )
  })

  it('substitutes {id} using the "detail" key (current schema contract)', () => {
    const action = {
      detail: true, details: true, endpoint: 'demo/products/{id}/archive/',
    }
    expect(resolveActionEndpoint(action, { id: '42' })).toBe(
      'demo/products/42/archive/'
    )
  })

  it('a full decorator -> ModelExtraAction -> schema -> frontend action resolves consistently', () => {
    // shape exactly as ResaasSchemaBuilder.build_actions() produces it for
    // @resaas_action(detail=True, ...) - see docs/api/schema-contract.md
    const action = {
      action: 'archive',
      detail: true,
      details: true,
      method: 'POST',
      methods: ['POST'],
      endpoint: 'demo/products/{id}/archive/',
      permission: 'archive_product',
    }

    expect(action.detail).toBe(true)
    expect(action.detail).toBe(action.details)
    expect(resolveActionEndpoint(action, { id: '99' })).toBe(
      'demo/products/99/archive/'
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
