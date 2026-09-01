import { COUNTRIES } from './countries'

// ITU-T E.164: a leading "+", then 8 to 15 digits total, no leading zero.
const E164_RE = /^\+[1-9]\d{7,14}$/

export function toE164 (dial, national) {
  const digits = String(national || '').replace(/\D/g, '')
  if (!dial || !digits) return ''
  return `+${dial}${digits}`
}

export function isValidE164 (value) {
  return E164_RE.test(String(value || ''))
}

// Best-effort split of an existing "+<dial><national>" number into
// { dial, national }, matching the longest known dial code first
// (needed because some codes are prefixes of others, e.g. +1 vs +12xx).
export function splitE164 (value) {
  const raw = String(value || '').trim()
  if (!raw.startsWith('+')) return { dial: '258', national: raw.replace(/\D/g, '') }

  const digits = raw.slice(1)

  const dials = [...new Set(COUNTRIES.map(c => c.dial))]
    .sort((a, b) => b.length - a.length)

  for (const dial of dials) {
    if (digits.startsWith(dial)) {
      return { dial, national: digits.slice(dial.length) }
    }
  }

  return { dial: '258', national: digits }
}
