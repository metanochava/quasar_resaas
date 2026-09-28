// Search matching for lists that filter as the user types (the menu, the
// permission manager): case- and accent-insensitive ("medico" finds
// "Médico"), and split into segments so the matching part can be highlighted
// without v-html.

function fold (char) {
  return char.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// the folded text plus, for each folded character, its index in the original
function folded (text) {
  let value = ''
  const origin = []
  Array.from(String(text ?? '')).forEach((char, index) => {
    const f = fold(char)
    value += f
    for (let i = 0; i < f.length; i++) origin.push(index)
  })
  return { value, origin }
}

export function normalizeSearch (search) {
  return folded(String(search ?? '').trim()).value
}

export function matchesSearch (text, search) {
  const needle = normalizeSearch(search)
  return !!needle && folded(text).value.includes(needle)
}

// "Médico geral", "med" -> [{ text: 'Méd', match: true }, { text: 'ico geral', match: false }]
export function highlightSegments (text, search) {
  const source = Array.from(String(text ?? ''))
  const needle = normalizeSearch(search)
  if (!needle) return source.length ? [{ text: source.join(''), match: false }] : []

  const { value, origin } = folded(source.join(''))
  const marked = new Array(source.length).fill(false)
  let from = value.indexOf(needle)
  while (from !== -1) {
    for (let i = from; i < from + needle.length; i++) marked[origin[i]] = true
    from = value.indexOf(needle, from + needle.length)
  }

  const segments = []
  source.forEach((char, index) => {
    const last = segments[segments.length - 1]
    if (last && last.match === marked[index]) last.text += char
    else segments.push({ text: char, match: marked[index] })
  })
  return segments
}
