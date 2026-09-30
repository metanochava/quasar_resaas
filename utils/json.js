
import figlet from 'figlet'

export const JSONSafeParse = function (value) {
  try {
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}




/**
 * @deprecated No caller in quasar_resaas or its applications; it is the only
 * user of `figlet`. Kept for compatibility, to be removed in a later release.
 */
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