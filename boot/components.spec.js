import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Every component name Schema 1.0 can put in field.component
// (django_resaas app_schema.py's _resolve_ui()) must be a registered
// component - an unresolved name renders NOTHING, silently (a BooleanField's
// "s-toggle" used to vanish from every schema-driven form).
//
// boot/components.js pulls in the whole component tree (vue-router, ...),
// so the registry is checked from its source instead of executing it.
const source = readFileSync(resolve(process.cwd(), 'boot/components.js'), 'utf8')

const registeredAs = (name) => {
  const match = source.match(new RegExp(`app\\.component\\(\\s*'${name}'\\s*,\\s*(\\w+)\\s*\\)`))
  return match?.[1] ?? null
}

const SCHEMA_COMPONENTS = [
  's-input', 's-select', 's-multiselect', 's-editor', 's-file',
  's-date', 's-time', 's-date-time', 's-switch', 's-toggle'
]

describe('component registry vs Schema 1.0 component names', () => {
  it('registers every component name the backend schema can emit', () => {
    for (const name of SCHEMA_COMPONENTS) expect(registeredAs(name), name).toBeTruthy()
  })

  it('s-toggle (BooleanField) is the same toggle as s-switch', () => {
    expect(registeredAs('s-toggle')).toBe(registeredAs('s-switch'))
  })
})
