
export const setCookie = (cname, cvalue, exdays) => {
  const d = new Date()
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000))
  const expires = 'expires=' + d.toUTCString()
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/'
}

export const setStorage = (_type, _cname, _cvalue, _exdays) => {
  if (_type === 'l') {
    localStorage.setItem(_cname, _cvalue)
  }

  if (_type === 'c') {
    setCookie(_cname, _cvalue, _exdays)
  }
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

export const getStorage = (_type, _cname, _help = 0) => {
  let result = null
  if (_type === 'l') {
    result = localStorage.getItem(_cname)
  }

  if (_type === 'c') {
    if (_help === 0) {
      result = getCookie(_cname)
    } else {
      result = getCookie(_cname, _help)
    }
  }
  return result
}


export const deleteStorage = (_type, _cname) => {
  let result = null
  if (_type === 'l') {
    result = localStorage.removeItem(_cname)
  }

  if (_type === 'c') {
    setCookie(_cname, null, 0)
  }
  return result
}

export const localStorageSetItem = (key, value) => {
  Object.keys(localStorage).forEach(function (keyLocal) {
    if (key === decrypt(keyLocal)) {
      localStorage.removeItem(keyLocal)
    }
  })
  localStorage.setItem(encrypt(key), (value))
}
