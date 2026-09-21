import { unwrapChoice } from '../theme/unwrapChoice'

// A choice (or a single related id) travels in two shapes:
//
//   WRITE / semantic   "required"                                    what an emit-value select holds and what the API accepts
//   READ               { id: "required", value: "required", label }  what the serializer answers (RepresentationMixin)
//
// A select that runs with `emit-value` already turns an option into its value when the user
// picks one (update:model-value). Nothing did the inverse when a record was LOADED, so the
// same select received the READ object: it still displayed the label (the object has one),
// but every validation rule judged the object - `String(obj).length` is 15, so a
// max_length 10 field complained until the user touched it and the select emitted a
// plain string. semanticValue() is that missing inverse, in one place.
//
// It only unwraps when the select is in emit-value mode, and never when the object IS one
// of the options' own values (an option whose value is a structured object stays intact).

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof File)

const looksLikeReadShape = (value) => isPlainObject(value) && ('value' in value || 'id' in value)

const sameValue = (a, b) => {
  if (a === b) return true

  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

export function semanticValue(value, { options = [], emitValue = false } = {}) {
  if (!emitValue || value == null) return value

  const ownsValue = (candidate) => (options || []).some(option => option && sameValue(option.value, candidate))

  if (Array.isArray(value)) {
    return value.map(item => (looksLikeReadShape(item) && !ownsValue(item) ? unwrapChoice(item) : item))
  }

  if (looksLikeReadShape(value) && !ownsValue(value)) return unwrapChoice(value)

  return value
}

// attrs may carry the flag camelCased (built from a schema) or kebab-cased (a template),
// and a bare attribute (`emit-value`) arrives as ''.
export function isEmitValue(attrs = {}) {
  const flag = attrs.emitValue ?? attrs['emit-value']

  return flag === '' || flag === true
}
