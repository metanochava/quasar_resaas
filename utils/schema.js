export const RESAAS_SCHEMA_VERSION = '1.0'

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
      crud: true,
      dense: true,
      striped: true,
      show_search: true,
      show_filters: true,
      show_columns: true,
      show_refresh: true,
      show_pdf: true,
      show_pdf_list: true,
      ...(schema.ui || {})
    },

    filters: {
      enabled: true,
      search: true,
      search_fields: [],
      fields: [],
      ...(schema.filters || {})
    },

    pagination: {
      enabled: true,
      page_size: 10,
      page_size_options: [5, 10, 20, 50, 100],
      default_ordering: '-id',
      ...(schema.pagination || {})
    },

    pdf: {
      enabled: true,
      detail: true,
      list: true,
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