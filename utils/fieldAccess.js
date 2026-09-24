// Field-level authorization - UX side.
//
// The backend schema describes, per field, the permissions that gate it
// (django_resaas: RESAAS.fields[<name>].permissions, see
// saas/core/base/field_access.py):
//
//   { name: 'salary', permissions: { view: 'view_contract_salary',
//                                    change: 'change_contract_salary' } }
//
// The serializer already enforces them (hidden value, 403
// field_permission_denied on write). This only keeps the UI honest with
// the current user's permissions:
// - cannot view and cannot change -> the field is removed;
// - cannot view, can change       -> write_only (no column, no value shown);
// - cannot change                 -> read_only (never sent, no rules).
// Fields without `permissions` are returned untouched.

export function fieldAccess(field, can) {
  const perms = field?.permissions
  if (!perms?.view) return { view: true, change: true }

  const check = typeof can === 'function' ? can : () => false

  return {
    view: !!check(perms.view),
    change: !!check(perms.change || perms.view)
  }
}

export function applyFieldAccess(fields, can) {
  const out = []

  for (const field of fields || []) {
    if (!field?.permissions?.view) {
      out.push(field)
      continue
    }

    const access = fieldAccess(field, can)

    if (!access.view && !access.change) continue

    if (!access.change) {
      out.push({
        ...field,
        read_only: true,
        props: { ...(field.props || {}), readonly: true, rules: [] }
      })
      continue
    }

    if (!access.view) {
      out.push({ ...field, write_only: true })
      continue
    }

    out.push(field)
  }

  return out
}
