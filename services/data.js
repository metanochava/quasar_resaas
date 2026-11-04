import { tdc } from "./translation"


const pad = (n) => String(n).padStart(2, '0')

// A Date (or an epoch timestamp) as the "YYYY-MM-DD HH:mm" string ds() reads,
// in the viewer's local time.
function toDateTimeString(value) {
  const d = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(d.getTime())) return ''

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// A value ds() can show: an ISO date ("2026-10-11"), an ISO date-time
// ("2026-10-11T11:19:00+02:00", "2026-10-11 11:19") or a Date.
export function isDateLike(value) {
  if (value instanceof Date) return !Number.isNaN(value.getTime())

  return typeof value === 'string' && /^\d{4}[-/]\d{2}[-/]\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(value.trim())
}

// The one date / date-time format of the platform: "DD-MM-YYYY at HH:mm",
// or "DD-MM-YYYY" for a date alone. Empty, null or unreadable values give ''.
export const ds = function (dataString = '') {
  if (dataString === null || dataString === undefined || dataString === '') return ''
  if (dataString instanceof Date || typeof dataString === 'number') dataString = toDateTimeString(dataString)
  if (typeof dataString !== 'string' || !dataString) return ''

  // q-date's default mask is YYYY/MM/DD.
  dataString = dataString.trim().replace(/^(\d{4})\/(\d{2})\/(\d{2})/, '$1-$2-$3').replace('T', ' ')
  let h = ''
  let d = ''
  const dataArray = dataString.split(' ')

  function data (d) {
    return d.split('-')[2] + '-' + d.split('-')[1] + '-' + d.split('-')[0]
  }
  function hora (h) {
    return h.split(':')[0] + ':' + h.split(':')[1]
  }
  if (Array.isArray(dataArray) && dataArray.length > 1) {
    d = data(dataArray[0])
    h = hora(dataArray[1])
  } else {
    d = data(dataArray[0])
  }

  const l = (h !== '') ? (d + ' ' +tdc('at')+ ' ' + h) : d
  if (l.includes('undefined')) {
    return ''
  }
  return l
}