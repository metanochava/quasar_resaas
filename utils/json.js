export const JSONSafeParse = function (value) {
  try {
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}




export const safeParse = (value) => {
  try {
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}