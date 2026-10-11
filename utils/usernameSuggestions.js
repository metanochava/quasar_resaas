// Username suggestions for the registration form, from the person's name.
//
// UX only: a suggestion is never "available" until the backend says so
// (GET register/username/?candidates=...), and registration checks again.
// Same rules as django_resaas saas/core/utils/username.py:
//
//   ^[a-z][a-z0-9._]{2,29}$  - 3 to 30 chars, lowercase, starts with a letter,
//   no "..", "__", "._" runs, no trailing "." or "_"
//
// Deterministic: the same name always gives the same list, in the same order.
// Never uses birth dates, phone numbers or random digits; when every readable
// form is taken, a short counter ("dias.chavana2") is the last resort.

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 30

const PATTERN = new RegExp(`^[a-z][a-z0-9._]{${USERNAME_MIN_LENGTH - 1},${USERNAME_MAX_LENGTH - 1}}$`)

// "João  da Silva-Costa" -> ["joao", "silva", "costa"]: accents removed,
// lowercase, split on spaces / hyphens / apostrophes; short connectors
// ("da", "de", "dos", ...) dropped when other words remain
const CONNECTORS = new Set(['da', 'das', 'de', 'do', 'dos', 'e', 'del', 'la', 'le', 'van', 'von', 'di'])

export function nameWords (name) {
  const words = String(name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    // a word cannot start a username with a digit, but may follow one
  const kept = words.filter(word => !CONNECTORS.has(word))
  return kept.length ? kept : words
}

export function normalizeUsername (value) {
  return String(value || '').trim().toLowerCase()
}

export function isValidUsername (value) {
  return PATTERN.test(value || '') && !/[._]{2,}/.test(value) && !/[._]$/.test(value)
}

function fit (candidate) {
  let value = candidate.replace(/[._]{2,}/g, '.').replace(/^[^a-z]+/, '')
  if (value.length > USERNAME_MAX_LENGTH) {
    value = value.slice(0, USERNAME_MAX_LENGTH).replace(/[._]+$/, '')
  }
  return value.replace(/[._]+$/, '')
}

// readable forms, best first, without numbers
export function readableUsernames (name) {
  const words = nameWords(name).filter(word => /[a-z]/.test(word))
  if (!words.length) return []

  const first = words[0]
  const last = words.length > 1 ? words[words.length - 1] : ''
  const middles = words.slice(1, -1)
  const raw = []

  if (last && last !== first) {
    raw.push(`${first}.${last}`, `${first}${last}`, `${first}_${last}`, `${first[0]}${last}`, `${last}.${first}`)
    if (middles.length) {
      raw.push(`${first}.${middles[0][0]}.${last}`, `${first}${last}.${middles[0][0]}`)
    }
    raw.push(`${first[0]}.${last}`, `${first}.${last[0]}`)
  } else {
    raw.push(first)
    if (middles.length || words.length > 1) raw.push(words.join('.'))
  }

  const seen = new Set()
  const result = []
  for (const candidate of raw) {
    const value = fit(candidate)
    if (isValidUsername(value) && !seen.has(value)) {
      seen.add(value)
      result.push(value)
    }
  }
  return result
}

// the last resort: base2, base3, ... (short and readable, never long digit runs)
export function numberedUsernames (base, count = 3) {
  if (!base) return []
  const result = []
  for (let n = 2; result.length < count && n < 100; n++) {
    const suffix = String(n)
    const value = fit(base.slice(0, USERNAME_MAX_LENGTH - suffix.length) + suffix)
    if (isValidUsername(value)) result.push(value)
  }
  return result
}

// every candidate for a name: readable ones first, then a few numbered ones
export function usernameSuggestions (name, { numbered = 3 } = {}) {
  const readable = readableUsernames(name)
  return [...readable, ...numberedUsernames(readable[0], numbered)]
}
