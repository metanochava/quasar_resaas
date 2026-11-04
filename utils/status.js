// One colour per status, everywhere a `status` is shown (AutoTable cells,
// detail pages, dashboards): active-like states are positive, inactive or
// deactivated-like states are negative, and every other known state gets
// its own tone so a list reads at a glance. Unknown states fall back to grey.
//
// A status travels in the READ shape {value, label} or as the plain value;
// both are accepted, and the value is matched case-insensitively with spaces
// and hyphens folded to underscores ("In progress" == "in_progress").

const TONES = {
  positive: [
    'active', 'activo', 'ativo', 'enabled', 'approved', 'accepted', 'completed', 'complete',
    'done', 'paid', 'validated', 'released', 'collected', 'received', 'won', 'success',
    'successful', 'sent', 'delivered', 'posted', 'confirmed', 'resolved', 'hired', 'present',
    'available', 'enrolled', 'attending', 'finished', 'signed', 'verified',
  ],
  negative: [
    'inactive', 'unactive', 'deactive', 'deactivated', 'disabled', 'inativo', 'inactivo',
    'cancelled', 'canceled', 'rejected', 'failed', 'error', 'expired', 'suspended', 'blocked',
    'lost', 'void', 'voided', 'terminated', 'dismissed', 'missed', 'absent', 'withdrawn',
    'refused', 'declined', 'revoked',
  ],
  warning: [
    'pending', 'waiting', 'on_hold', 'in_progress', 'processing', 'retry', 'queued',
    'under_review', 'review', 'partial', 'partially_received', 'partially_paid', 'late',
    'probation', 'screening', 'interview', 'dispatching', 'reversed', 'leave', 'overdue',
  ],
  info: [
    'scheduled', 'submitted', 'open', 'new', 'requested', 'reserved', 'applied', 'shortlisted',
    'offered', 'ongoing', 'referral', 'not_started', 'checked_in', 'reviewed', 'calculated',
    'in_service', 'called',
  ],
  grey: ['draft', 'closed', 'retired', 'resigned', 'off', 'dropped', 'other', 'archived'],
  dark: ['deceased'],
}

const COLOR_BY_STATUS = Object.fromEntries(
  Object.entries(TONES).flatMap(([color, states]) => states.map(state => [state, color]))
)

const normalise = (value) => String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')

// The machine value of a status in either shape.
export function statusValue(status) {
  if (status && typeof status === 'object') return status.value ?? status.id ?? status.label ?? null

  return status ?? null
}

export function statusColor(status) {
  const byValue = COLOR_BY_STATUS[normalise(statusValue(status))]

  if (byValue) return byValue

  // A choice whose value is a code still has an English label to go by.
  const label = status && typeof status === 'object' ? status.label : null

  return COLOR_BY_STATUS[normalise(label)] || 'grey'
}

// `status` and any `<something>_status` column hold a state; marital_status
// is a personal attribute, not a state, and keeps its plain rendering.
export function isStatusField(name) {
  const key = String(name || '').toLowerCase()

  return key !== 'marital_status' && /(^|_)status$/.test(key)
}
