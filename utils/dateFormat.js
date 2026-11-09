// Dates in the inputs follow the user's language (s-date, s-date-time), while
// the value sent to the backend - and stored - is always the English/ISO
// pattern: "YYYY-MM-DD" and "YYYY-MM-DD HH:mm:ss". Only what is shown and
// typed changes: pt-pt "09/11/2026", en-us "11/09/2026". Hours stay 24h in
// every language.

const ORDERS = {
  'pt-pt': 'dmy',
  'en-us': 'mdy',
}

// 'dmy' or 'mdy'; any other / unknown language: day first
export function dateOrder (languageCode) {
  return ORDERS[String(languageCode || '').toLowerCase()] || 'dmy'
}

// the placeholder of the typed pattern, e.g. "DD/MM/YYYY"
export function datePattern (order) {
  return order === 'mdy' ? 'MM/DD/YYYY' : 'DD/MM/YYYY'
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/

// "2026-11-09" (or a datetime starting with it) -> "09/11/2026" / "11/09/2026"
export function isoToDisplay (iso, order = 'dmy') {
  const match = ISO_DATE.exec(String(iso || ''))
  if (!match) return ''
  const [, year, month, day] = match
  return order === 'mdy' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`
}

function realDate (year, month, day) {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  return date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
}

// "09/11/2026" -> "2026-11-09"; null while incomplete or not a real date (31/02)
export function displayToIso (text, order = 'dmy') {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(text || '').trim())
  if (!match) return null
  const [, first, second, year] = match
  const [day, month] = order === 'mdy' ? [second, first] : [first, second]
  return realDate(year, month, day) ? `${year}-${month}-${day}` : null
}

// "2026-11-09 14:30:00" / "2026-11-09T14:30:00Z" -> { date: "2026-11-09", time: "14:30" }
export function splitIsoDateTime (value) {
  const match = /^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?/.exec(String(value || ''))
  return match ? { date: match[1], time: match[2] || '' } : { date: '', time: '' }
}

// "09/11/2026 14:30" -> "2026-11-09 14:30:00"; null while incomplete/invalid
export function displayToIsoDateTime (text, order = 'dmy') {
  const match = /^(\S+)\s+(\d{2}):(\d{2})$/.exec(String(text || '').trim())
  if (!match) return null
  const date = displayToIso(match[1], order)
  const [hour, minute] = [Number(match[2]), Number(match[3])]
  if (!date || hour > 23 || minute > 59) return null
  return `${date} ${match[2]}:${match[3]}:00`
}

// "2026-11-09 14:30:00" -> "09/11/2026 14:30"
export function isoDateTimeToDisplay (value, order = 'dmy') {
  const { date, time } = splitIsoDateTime(value)
  if (!date) return ''
  return `${isoToDisplay(date, order)} ${time || '00:00'}`
}

// the calendar (q-date :locale): month and day names and the first day of
// the week; undefined = Quasar's own English
const LOCALES = {
  'pt-pt': {
    days: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    daysShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    monthsShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    firstDayOfWeek: 1,
  },
}

export function dateLocale (languageCode) {
  return LOCALES[String(languageCode || '').toLowerCase()]
}
