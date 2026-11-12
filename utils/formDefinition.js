// Form definitions on the client (the backend - saas/core/forms - is the
// authority: it validates again and decides). Helpers of <s-dynamic-form>:
// visibility / required / readonly per data, calculated fields, client-side
// validation with the same rules, and the Schema 1.0 adapters for the
// "schema" and "hybrid" modes.
import { evaluateCondition, isEmpty } from './formConditions'

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function isVisible (field, data) { return evaluateCondition(field.visible_if, data) }
export function isReadonly (field, data) { return !!field.readonly_if && evaluateCondition(field.readonly_if, data) }
export function isDisabled (field, data) { return !!field.disabled_if && evaluateCondition(field.disabled_if, data) }
export function isRequired (field, data) {
  return !!field.required || (!!field.required_if && evaluateCondition(field.required_if, data))
}

export function calculate (field, data) {
  const { op, of } = field.calculate
  const values = of.map(name => data?.[name])
  if (op === 'concat') return values.filter(v => !isEmpty(v)).join(' ')
  const numbers = values.map(v => (isEmpty(v) || !Number.isFinite(Number(v)) ? 0 : Number(v)))
  return op === 'sum' ? numbers.reduce((a, b) => a + b, 0) : numbers.reduce((a, b) => a * b, 1)
}

const RULE_MESSAGES = {
  min_length: 'Too short.', max_length: 'Too long.', min: 'Too small.', max: 'Too large.',
  pattern: 'Invalid format.', email: 'Enter a valid e-mail.', min_items: 'Add more items.', max_items: 'Too many items.'
}

export function ruleErrors (field, value) {
  const errors = []
  for (const rule of field.validators || []) {
    const limit = rule.value
    const size = typeof value === 'string' || Array.isArray(value) ? value.length : null
    const number = typeof value === 'boolean' || isEmpty(value) || Array.isArray(value) ? null : Number(value)
    let failed = false
    switch (rule.rule) {
      case 'min_length': failed = size !== null && size < limit; break
      case 'max_length': failed = size !== null && size > limit; break
      case 'min_items': failed = Array.isArray(value) && value.length < limit; break
      case 'max_items': failed = Array.isArray(value) && value.length > limit; break
      case 'min': failed = number !== null && Number.isFinite(number) && number < limit; break
      case 'max': failed = number !== null && Number.isFinite(number) && number > limit; break
      // a pattern comes from a validated definition (bounded length)
      case 'pattern': failed = typeof value === 'string' && !new RegExp(`^(?:${limit})$`).test(value); break
      case 'email': failed = typeof value === 'string' && !EMAIL.test(value); break
    }
    if (failed) errors.push(rule.message || RULE_MESSAGES[rule.rule])
  }
  return errors
}

function validateFields (fields, data, scope, prefix, errors) {
  for (const field of fields) {
    const path = `${prefix}${field.name}`
    if (!isVisible(field, scope) || field.calculate || isReadonly(field, scope) || isDisabled(field, scope)) continue
    const value = data?.[field.name]
    if (isEmpty(value)) {
      if (isRequired(field, scope)) errors[path] = ['This field is required.']
      continue
    }
    if (field.type === 'repeater') {
      ;(Array.isArray(value) ? value : []).forEach((item, index) =>
        validateFields(field.fields || [], item, { ...scope, ...item }, `${path}.${index}.`, errors))
      const bounds = [
        ...(field.min_items != null ? [{ rule: 'min_items', value: field.min_items }] : []),
        ...(field.max_items != null ? [{ rule: 'max_items', value: field.max_items }] : [])
      ]
      const found = ruleErrors({ validators: [...bounds, ...(field.validators || [])] }, value)
      if (found.length) errors[path] = found
      continue
    }
    if (field.type === 'object') {
      validateFields(field.fields || [], value, { ...scope, ...value }, `${path}.`, errors)
      continue
    }
    const found = ruleErrors(field, value)
    if (found.length) errors[path] = found
  }
  return errors
}

// {path: [message]} for this data - empty when valid (the server checks again)
export function validateData (definition, data) {
  const errors = {}
  for (const section of definition?.sections || []) {
    if (!evaluateCondition(section.visible_if, data)) continue
    validateFields(section.fields || [], data, data, '', errors)
  }
  return errors
}

// ---------------------------------------------------------------- Schema 1.0

const SCHEMA_TYPES = {
  CharField: 'text', SlugField: 'text', UUIDField: 'text', EmailField: 'email', TextField: 'editor',
  IntegerField: 'integer', PositiveIntegerField: 'integer', PositiveSmallIntegerField: 'integer',
  SmallIntegerField: 'integer', BigIntegerField: 'integer', DecimalField: 'decimal', FloatField: 'decimal',
  BooleanField: 'boolean', DateField: 'date', TimeField: 'time', DateTimeField: 'datetime',
  ForeignKey: 'relation', OneToOneField: 'relation', ManyToManyField: 'multiselect',
  FileField: 'file', ImageField: 'image', JSONField: 'textarea'
}

// a Schema 1.0 field (store.fields / normalizeSchema) as a definition field
export function fieldFromSchema (schemaField) {
  const field = {
    name: schemaField.name,
    type: Array.isArray(schemaField.choices) && schemaField.choices.length
      ? 'select'
      : (SCHEMA_TYPES[schemaField.type] || 'text'),
    label: schemaField.label || schemaField.verbose_name || schemaField.name,
    required: !!(schemaField.required ?? (schemaField.null === false && schemaField.blank === false)),
    schema: schemaField // the original metadata, for the field components
  }
  if (field.type === 'select' && schemaField.choices) {
    field.options = schemaField.choices.map(c => (typeof c === 'object' ? c : { value: c, label: String(c) }))
  }
  if (schemaField.help_text) field.help = schemaField.help_text
  return field
}

// mode "schema": one section with every editable field of the model
export function definitionFromSchema (key, schemaFields, { exclude = [] } = {}) {
  const skip = new Set(['id', 'entity', 'branch', 'created_at', 'updated_at', 'created_by', 'updated_by',
    'deleted_at', 'deleted_by', ...exclude])
  return {
    schema_version: '1.0',
    key,
    mode: 'schema',
    sections: [{
      key: 'main',
      fields: (schemaFields || [])
        .filter(f => !skip.has(f.name) && f.editable !== false && !f.read_only)
        .map(fieldFromSchema)
    }]
  }
}

// mode "hybrid": the definition's `from_schema` fields take what they do not
// say themselves from the model's field of the same name
export function applySchema (definition, schemaFields) {
  const byName = Object.fromEntries((schemaFields || []).map(f => [f.name, f]))
  const fill = field => {
    const meta = field.from_schema ? byName[field.name] : null
    const filled = meta ? { ...fieldFromSchema(meta), ...field } : { ...field }
    if (filled.fields) filled.fields = filled.fields.map(fill)
    return filled
  }
  return { ...definition, sections: (definition.sections || []).map(s => ({ ...s, fields: (s.fields || []).map(fill) })) }
}

// a workflow's endpoint with its {placeholders}: "hotel/stays/{id}/check_in/"
export function fillEndpoint (endpoint, params = {}) {
  return String(endpoint).replace(/\{([a-z_]+)\}/g, (_, name) => {
    if (params[name] === undefined || params[name] === null || params[name] === '') {
      throw new Error(`Missing "${name}" for ${endpoint}`)
    }
    return encodeURIComponent(params[name])
  })
}
