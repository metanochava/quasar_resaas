


export const profileSplint = (txt) => {
  if (!txt) return null
  const p = txt.split('_')
  return p[1] ?? p[0]
}
