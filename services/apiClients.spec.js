import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// REST architecture guard (see CLAUDE.md, "REST API ARCHITECTURE"): HTTPClient
// sends NO token and NO tenant context. It is only for the PUBLIC pre-session
// endpoints. Calling a protected endpoint through it only "works" while the
// backend is wrongly public - which is exactly how admin stores kept working
// against anonymous viewsets. Everything else must use HTTPAuth.
const PUBLIC_ENDPOINTS = [
  /^login\/$/,
  /^login\/two_factor\//,
  /^refresh_token\/$/,
  /^register\//,
  /^password\/reset\//,
  /^password\/change\/temporary\/$/,
  /^site\/?$/,
  /^saas\/entitys\//, // site branding by entity id (AllLogo)
  /^django_resaas\/languages\/?$/,
  /^django_resaas\/languages\/[^/]+\/translations\/?$/,
  /^django_resaas\/entitytypes\/[^/]+\/(themeGet|layoutSettingsGet|typographyGet|animationSettingsGet)\/$/
]

const ROOT = path.resolve(__dirname, '..')
const SKIP = new Set(['node_modules', '.git', 'dist', 'docs', 'tests'])

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.(js|vue)$/.test(entry.name) && !/\.spec\.js$/.test(entry.name)) out.push(full)
  }
  return out
}

function publicCalls(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  const calls = []

  lines.forEach((line, index) => {
    if (!/HTTPClient(Blob)?\.(get|post|put|patch|delete)\(/.test(line)) return

    const window = lines.slice(index, index + 7).join(' ')
    const match = window.match(/url:\s*[`'"]([^`'"]+)[`'"]/)
    // ${id} template parts become a neutral segment
    const endpoint = match ? match[1].replace(/\$\{[^}]+\}/g, 'ID').replace(/^\//, '') : null

    calls.push({ file: path.relative(ROOT, file), line: index + 1, endpoint })
  })

  return calls
}

describe('HTTPClient (no token) is only used for public pre-session endpoints', () => {
  const calls = walk(ROOT).flatMap(publicCalls)

  it('finds the known public calls (the scan is not vacuous)', () => {
    expect(calls.length).toBeGreaterThan(10)
  })

  it('every HTTPClient call targets an endpoint on the PUBLIC allowlist', () => {
    const offenders = calls
      .filter(call => !call.endpoint || !PUBLIC_ENDPOINTS.some(rule => rule.test(call.endpoint.replace(/\?.*$/, ''))))
      .map(call => `${call.file}:${call.line}  ${call.endpoint ?? '(endpoint not literal)'}`)

    expect(offenders).toEqual([])
  })
})
