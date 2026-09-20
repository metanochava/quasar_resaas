// Partially hides an e-mail address or phone number for display next to
// "we sent a code to ...". Display only - never used for anything else.
export function maskEmail(email) {
  const [local, domain] = String(email || '').split('@')

  if (!domain) return ''

  const visible = local.slice(0, Math.min(2, local.length))

  return `${visible}${'•'.repeat(Math.max(local.length - visible.length, 2))}@${domain}`
}

export function maskPhone(phone) {
  const value = String(phone || '').trim()

  if (value.length < 8) return value ? '•'.repeat(value.length) : ''

  return `${value.slice(0, 4)} ${value.slice(4, 6)} ${'•••'} ${'••••'}`
}

export function maskContact(channel, value) {
  return channel === 'mobile' ? maskPhone(value) : maskEmail(value)
}
