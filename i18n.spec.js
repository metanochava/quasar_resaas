import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

// Standing rule (CLAUDE.md section 84): every tdc('...') literal in this
// library must exist in the pt-pt, es-es and fr-fr dictionaries
// (django_resaas/<app>/lang/<code>.py, merged the way Translate.tdc()/the
// translations endpoint merge them). A new untranslated string fails here
// instead of shipping as English in every other language.
const ROOT = process.cwd()
const LANG_ROOT = resolve(ROOT, '../django_resaas/src/django_resaas')
const CODES = ['ptpt', 'eses', 'frfr']

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(vue|js)$/.test(name) && !/\.spec\.js$/.test(name)) out.push(path)
  }
  return out
}

function keysOf(code) {
  const keys = new Set()
  for (const app of readdirSync(LANG_ROOT)) {
    const file = join(LANG_ROOT, app, 'lang', `${code}.py`)
    if (!existsSync(file)) continue
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const match = line.match(/^\s+("(?:[^"\\]|\\.)*")\s*:/)
      if (match) keys.add(JSON.parse(match[1]))
    }
  }
  return keys
}

const literal = /tdc\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\s*\)/g

describe.skipIf(!existsSync(LANG_ROOT))('every tdc() literal is translated', () => {
  const dictionaries = Object.fromEntries(CODES.map(code => [code, keysOf(code)]))
  const missing = {}

  for (const file of walk(ROOT)) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(literal)) {
      const text = (match[1] ?? match[2]).replace(/\\'/g, "'")
      if (!text.trim()) continue
      const gaps = CODES.filter(code => !dictionaries[code].has(text))
      if (gaps.length) missing[text] = file.replace(`${ROOT}/`, '')
    }
  }

  it('finds no untranslated string in components, pages, composables, layouts, router, stores', () => {
    expect(missing).toEqual({})
  })
})
