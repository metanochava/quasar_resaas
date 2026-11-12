// The condition DSL of form definitions - the same as the backend's
// django_resaas saas/core/forms/dsl.py. JSON only: nothing is ever evaluated
// as code (no eval / Function), unknown operators are simply false.
//
//   { field, op, value }   eq ne in not_in gt gte lt lte empty not_empty contains
//   { all: [...] }  { any: [...] }  { not: {...} }

export function readPath (data, path) {
  let value = data
  for (const part of String(path).split('.')) {
    if (value && typeof value === 'object' && !Array.isArray(value)) value = value[part]
    else return undefined
  }
  return value
}

function isEmpty (value) {
  return value === null || value === undefined || value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)
}

function asNumber (value) {
  if (typeof value === 'boolean' || value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function compare (left, right, op) {
  let a = asNumber(left)
  let b = asNumber(right)
  if (a === null || b === null) {
    if (typeof left === 'string' && typeof right === 'string') { a = left; b = right } else return false
  }
  return { gt: a > b, gte: a >= b, lt: a < b, lte: a <= b }[op] ?? false
}

function equal (a, b) {
  if (asNumber(a) !== null && asNumber(b) !== null && typeof a !== 'boolean' && typeof b !== 'boolean') {
    return asNumber(a) === asNumber(b)
  }
  return a === b
}

export function evaluateCondition (condition, data) {
  if (!condition) return true
  if (Array.isArray(condition.all)) return condition.all.every(c => evaluateCondition(c, data))
  if (Array.isArray(condition.any)) return condition.any.some(c => evaluateCondition(c, data))
  if (condition.not) return !evaluateCondition(condition.not, data)

  const value = readPath(data || {}, condition.field)
  const expected = condition.value
  switch (condition.op) {
    case 'empty': return isEmpty(value)
    case 'not_empty': return !isEmpty(value)
    case 'eq': return equal(value, expected)
    case 'ne': return !equal(value, expected)
    case 'in': return Array.isArray(expected) && expected.some(e => equal(value, e))
    case 'not_in': return Array.isArray(expected) && !expected.some(e => equal(value, e))
    case 'contains': return (Array.isArray(value) || typeof value === 'string') && value.includes(expected)
    case 'gt': case 'gte': case 'lt': case 'lte': return compare(value, expected, condition.op)
    default: return false
  }
}

export { isEmpty }
