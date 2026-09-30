// Every name the auto-imports preset (auto-imports.cjs) offers must really be
// exported by the package root (index.js). A stale name only fails in the
// consuming application ("... is not exported by quasar_resaas") - e.g. when
// useEmployeeStore left with HR but stayed in the preset. Static check: index.js
// cannot be imported under vitest (it reaches host-app aliases such as src/...).
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (path) => readFileSync(path, 'utf8')

function namesIn(block) {
  return block
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.split(/\s+as\s+/).pop().trim())
}

function exportedNames(file, seen = new Set()) {
  if (seen.has(file) || !existsSync(file)) return new Set()
  seen.add(file)
  const source = read(file)
  const names = new Set()

  for (const match of source.matchAll(/export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([\w$]+)/g)) {
    names.add(match[1])
  }
  for (const match of source.matchAll(/export\s*\{([^}]*)\}/g)) {
    namesIn(match[1]).forEach((name) => names.add(name))
  }
  for (const match of source.matchAll(/export\s*\*\s*from\s*['"](\.[^'"]+)['"]/g)) {
    exportedNames(resolve(dirname(file), match[1]), seen).forEach((name) => names.add(name))
  }
  return names
}

describe('auto-imports preset', () => {
  it('only offers names the package root exports', () => {
    const preset = createRequire(import.meta.url)(resolve(root, 'auto-imports.cjs'))
    const offered = preset.map((entry) => (Array.isArray(entry) ? entry[1] || entry[0] : entry))
    const exported = exportedNames(resolve(root, 'index.js'))

    expect(offered.length).toBeGreaterThan(0)
    expect(offered.filter((name) => !exported.has(name))).toEqual([])
  })

  it('offers the entitlements store', () => {
    const preset = createRequire(import.meta.url)(resolve(root, 'auto-imports.cjs'))
    expect(preset).toContain('useEntitlementStore')
    expect(preset).not.toContain('useEmployeeStore')
  })
})
