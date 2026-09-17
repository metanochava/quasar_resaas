import { describe, it, expect, vi, beforeAll } from 'vitest'

// buildFormFromSchema() calls HTTPAuth.get() itself (real normalizeSchema,
// real field-building logic) - only the HTTP layer is mocked, so this is a
// genuine contract test: a realistic ResaasSchemaBuilder.build() payload
// (see docs/api/schema-contract.md) goes in, and the exact shape every
// frontend consumer (BaseStore, AutoCrud, AutoForm) relies on comes out.
const httpGet = vi.fn()

vi.mock('../services/api', () => ({
  HTTPAuth: { get: (...args) => httpGet(...args) },
  url: ({ url: path }) => path,
}))

vi.mock('../services/translation', () => ({
  tdc: (text) => text,
}))

let buildFormFromSchema
let toRelationOption
let resolveActionEndpoint
let schemaPermission

beforeAll(async () => {
  ;({ buildFormFromSchema, toRelationOption } = await import('./autoForm'))
  ;({ resolveActionEndpoint, schemaPermission } = await import('./schema'))
})

// Mirrors ResaasSchemaBuilder.build() for dev.demo.Product exactly - see
// core/schema/builder.py and docs/api/schema-contract.md on the backend.
const REALISTIC_DJANGO_SCHEMA = {
  schema_version: '1.0',
  model: {
    app: 'demo',
    name: 'product',
    class_name: 'Product',
    label: 'Product',
    label_plural: 'Products',
    pk: 'id',
    endpoint: 'demo/products/',
  },
  fields: [
    { name: 'name', type: 'CharField', label: 'Name', required: true },
    { name: 'sku', type: 'CharField', label: 'Sku', required: true },
    { name: 'price', type: 'DecimalField', label: 'Price', required: true },
  ],
  actions: [
    {
      action: 'archive',
      app: 'demo',
      model: 'product',
      label: 'Archive',
      icon: 'mdi-archive',
      tooltip: null,
      position: null,
      order: 0,
      visible: true,
      method: 'POST',
      methods: ['POST'],
      detail: true,
      details: true,
      url: 'archive',
      autorequest: false,
      endpoint: 'demo/products/{id}/archive/',
      permission: 'archive_product',
    },
  ],
  permissions: {
    list: 'list_product',
    view: 'view_product',
    add: 'add_product',
    change: 'change_product',
    delete: 'delete_product',
    restore: 'restore_product',
    hard_delete: 'hard_delete_product',
    pdf: 'pdf_product',
    pdf_list: 'pdf_list_product',
    custom: { archive: 'archive_product' },
  },
  routes: {
    list: 'list_product',
    add: 'add_product',
    change: 'change_product',
    view: 'view_product',
  },
  ui: {
    title: 'Products',
    icon: 'mdi-package-variant',
    crud: true,
    dense: true,
    striped: true,
    show_search: true,
    show_filters: true,
    show_columns: true,
    show_refresh: true,
    show_pdf: true,
    show_pdf_list: true,
  },
  filters: {
    enabled: true,
    search: true,
    search_fields: ['name', 'sku'],
    fields: ['name', 'sku', 'price'],
  },
  pagination: {
    enabled: true,
    page_size: 10,
    page_size_options: [5, 10, 20, 50, 100, 200, 500, 1000, 0],
    default_ordering: '-id',
  },
  pdf: {
    enabled: true,
    detail: true,
    list: true,
    detail_permission: 'pdf_product',
    list_permission: 'pdf_list_product',
    detail_endpoint: 'demo/products/{id}/pdf/',
    list_endpoint: 'demo/products/pdflist/',
  },
  module: 'demo',
  config: {
    crud: true,
    routes: {
      list: 'list_product',
      add: 'add_product',
      change: 'change_product',
      view: 'view_product',
    },
  },
}

describe('buildFormFromSchema - real Django schema contract', () => {
  it('resolves the endpoint, fields, actions, permissions, routes, ui, filters, pagination and pdf from a realistic backend payload', async () => {
    httpGet.mockResolvedValue({ data: REALISTIC_DJANGO_SCHEMA })

    const result = await buildFormFromSchema({ app: 'demo', model: 'Product' })

    expect(httpGet).toHaveBeenCalledWith(
      'django_resaas/resaasapps/demo/Product/schema/'
    )

    expect(result.schema.model.endpoint).toBe('demo/products/')
    expect(result.fields.map(f => f.name)).toEqual(['name', 'sku', 'price'])
    expect(result.actions).toHaveLength(1)
    expect(result.permissions.custom).toEqual({ archive: 'archive_product' })
    expect(result.routes.change).toBe('change_product')
    expect(result.pagination.page_size).toBe(10)
    expect(result.pdf.detail_endpoint).toBe('demo/products/{id}/pdf/')
  })

  it('the built fields carry validation rules, labels and component defaults for AutoForm', async () => {
    httpGet.mockResolvedValue({ data: REALISTIC_DJANGO_SCHEMA })

    const result = await buildFormFromSchema({ app: 'demo', model: 'Product' })
    const nameField = result.fields.find(f => f.name === 'name')

    expect(nameField.component).toBe('s-input')
    expect(nameField.props.label).toBe('Name')
    expect(typeof nameField.props.rules[0]).toBe('function')
    expect(nameField.props.rules[0](null)).not.toBe(true) // required -> fails on empty
    expect(nameField.props.rules[0]('Widget')).toBe(true)
  })

  it('actions from the schema resolve permission and endpoint correctly for AutoCrud', async () => {
    httpGet.mockResolvedValue({ data: REALISTIC_DJANGO_SCHEMA })

    const result = await buildFormFromSchema({ app: 'demo', model: 'Product' })
    const [archive] = result.actions

    expect(schemaPermission({ permissions: result.permissions }, 'archive')).toBe(
      'archive_product'
    )
    expect(resolveActionEndpoint(archive, { id: '42' })).toBe(
      'demo/products/42/archive/'
    )
  })

  it('a read_only field never gets a blocking required rule, even when required is true', async () => {
    httpGet.mockResolvedValue({
      data: {
        ...REALISTIC_DJANGO_SCHEMA,
        fields: [
          { name: 'sku', type: 'CharField', label: 'Sku', required: true, read_only: true },
        ],
      },
    })

    const result = await buildFormFromSchema({ app: 'demo', model: 'Product' })
    const sku = result.fields.find(f => f.name === 'sku')

    expect(sku.props.rules.every(rule => rule(null) === true)).toBe(true)
  })

  it('a relation field carries relation_config through to props for s-select/s-multiselect', async () => {
    const relationConfig = {
      app: 'demo',
      model: 'Category',
      endpoint: 'demo/categorys/',
      permissions: { add: 'add_category', change: 'change_category', view: 'view_category' },
    }

    // First call is the schema fetch itself; buildFormFromSchema() then
    // makes a SECOND httpGet call per relation field (defaultFetchRelationOptions,
    // django_resaas/relations/) to preload its options - stub that one to an
    // empty list so this test is only about relation_config propagation.
    httpGet.mockResolvedValueOnce({
      data: {
        ...REALISTIC_DJANGO_SCHEMA,
        fields: [
          {
            name: 'category',
            type: 'ForeignKey',
            label: 'Category',
            required: true,
            relation: 'demo.Category',
            relation_config: relationConfig,
            ui: { isRelation: true },
          },
        ],
      },
    })
    httpGet.mockResolvedValueOnce({ data: [] })

    const result = await buildFormFromSchema({ app: 'demo', model: 'Product' })
    const category = result.fields.find(f => f.name === 'category')

    expect(category.props.relationConfig).toEqual(relationConfig)
  })

  it('a non-relation field gets relationConfig: null', async () => {
    httpGet.mockResolvedValue({ data: REALISTIC_DJANGO_SCHEMA })

    const result = await buildFormFromSchema({ app: 'demo', model: 'Product' })
    const name = result.fields.find(f => f.name === 'name')

    expect(name.props.relationConfig).toBeUndefined()
  })
})

describe('toRelationOption', () => {
  it('prefers label, then name, then title, then id, and reads value from id when value is absent', () => {
    expect(toRelationOption({ id: 1, label: 'Acme Ltd' })).toEqual({ label: 'Acme Ltd', value: 1 })
    expect(toRelationOption({ id: 2, name: 'Widget' })).toEqual({ label: 'Widget', value: 2 })
    expect(toRelationOption({ id: 3, title: 'Draft' })).toEqual({ label: 'Draft', value: 3 })
    expect(toRelationOption({ id: 4 })).toEqual({ label: '4', value: 4 })
  })

  it('falls back to value only when id is absent', () => {
    expect(toRelationOption({ id: 5, value: 'v5', label: 'Five' })).toEqual({ label: 'Five', value: 5 })
    expect(toRelationOption({ value: 'v6', label: 'Six' })).toEqual({ label: 'Six', value: 'v6' })
  })
})
