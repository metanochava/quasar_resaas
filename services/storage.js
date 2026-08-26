
export const setCookie = (cname, cvalue, exdays) => {
  const d = new Date()
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000))
  const expires = 'expires=' + d.toUTCString()
  const secure = window.location.protocol === 'https:' ? ';Secure' : ''
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/;SameSite=Lax' + secure
}


export const setStorage = (type, name, value, days) => {
  if (type === 'l') localStorage.setItem(name, value)
  if (type === 's') sessionStorage.setItem(name, value)
  if (type === 'c') setCookie(name, value, days)
}

export const getCookie = (cname, _help = 0) => {
  const name = cname + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') {
      c = c.substring(1)
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length)
    }
  }
  if (_help === 0) {
    return ''
  } else {
    return null
  }
}


export const getStorage = (type, name, help = 0) => {
  if (type === 'l') return localStorage.getItem(name)
  if (type === 's') return sessionStorage.getItem(name)
  if (type === 'c') return help === 0 ? getCookie(name) : getCookie(name, help)
  return null
}


export const deleteStorage = (type, name) => {
  if (type === 'l') return localStorage.removeItem(name)
  if (type === 's') return sessionStorage.removeItem(name)
  if (type === 'c') return setCookie(name, null, 0)
  return null
}

export const localStorageSetItem = (key, value) => {
  Object.keys(localStorage).forEach(function (keyLocal) {
    if (key === decrypt(keyLocal)) {
      localStorage.removeItem(keyLocal)
    }
  })
  localStorage.setItem(encrypt(key), (value))
}
