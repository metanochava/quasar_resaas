
import figlet from 'figlet'

export const JSONSafeParse = function (value) {
  try {
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}


export const profileSplint = (txt) => {
  if (!txt) return null
  const p = txt.split('_')
  return p[1] ?? p[0]
}



export function ascii(text, font = 'Standard') {
  return figlet.textSync(text, { font })
}

export const safeParse = (value) => {
  try {
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}