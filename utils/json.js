
import figlet from 'figlet'

export const JSONSafeParse = function (value) {
  try {
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
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