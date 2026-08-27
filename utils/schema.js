export const RESAAS_SCHEMA_VERSION = '1.0'

// Canonical defaults, mirroring django_resaas's ResaasSchemaBuilder
// (core/schema/builder.py's build_ui/build_filters/build_pagination/build_pdf -
// see docs/api/schema-contract.md). These exist so a component only ever
// needs to declare its OWN fallback once, here, instead of re-deriving the
// backend's defaults locally (which is how three different, disagreeing
// copies of this same list ended up across the codebase).
export const DEFAULT_UI = {
  crud: true,
  dense: true,
  striped: true,
  show_search: true,
  show_filters: true,
  show_columns: true,
  show_refresh: true,
  show_pdf: true,
  show_pdf_list: true
}

export const DEFAULT_FILTERS = {
  enabled: true,
  search: true,
  search_fields: [],
  fields: []
}

export const DEFAULT_PAGINATION = {
  enabled: true,
  page_size: 10,
  page_size_options: [5, 10, 20, 50, 100, 200, 500, 1000, 0],
  default_ordering: '-id'
}

export const DEFAULT_PDF = {
  enabled: true,
  detail: true,
  list: true
}

export function normalizeSchema(data = {}) {
  const schema = data?.data || data || {}
  const model = schema.model

  return {
    schema_version: schema.schema_version || RESAAS_SCHEMA_VERSION,

    model: {
      app: model?.app || schema.module || '',
      name: model?.name || (typeof model === 'string' ? model : ''),
      class_name: model?.class_name || '',
      label: model?.label || '',
      label_plural: model?.label_plural || '',
      pk: model?.pk || 'id',
      endpoint: model?.endpoint || ''
    },

    fields: Array.isArray(schema.fields) ? schema.fields : [],
    actions: Array.isArray(schema.actions) ? schema.actions : [],
    permissions: { ...(schema.permissions || {}) },
    routes: { ...(schema.routes || schema.config?.routes || {}) },

    ui: {
      ...DEFAULT_UI,
      ...(schema.ui || {})
    },

    filters: {
      ...DEFAULT_FILTERS,
      ...(schema.filters || {})
    },

    pagination: {
      ...DEFAULT_PAGINATION,
      ...(schema.pagination || {})
    },

    pdf: {
      ...DEFAULT_PDF,
      ...(schema.pdf || {})
    },

    config: {
      crud: schema.ui?.crud ?? schema.config?.crud ?? true,
      routes: schema.routes || schema.config?.routes || {}
    }
  }
}

export function schemaPermission(schema, action) {
  return (
    schema?.permissions?.[action] ||
    schema?.permissions?.custom?.[action] ||
    null
  )
}

export function canSchema(User, schema, action) {
  const permission = schemaPermission(schema, action)
  return permission ? User.can(permission) : false
}

export function resolveActionEndpoint(action, row = null) {
  if (!action?.endpoint) return action?.url || ''

  return action.details && row?.id
    ? action.endpoint.replace('{id}', row.id)
    : action.endpoint
}

export function resolvePdfDetailEndpoint(schema, row) {
  const endpoint = schema?.pdf?.detail_endpoint
  return endpoint ? endpoint.replace('{id}', row?.id) : ''
}