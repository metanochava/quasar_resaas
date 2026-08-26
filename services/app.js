


export const apiBaseUrl =  process.env.API_BASE_URL
export const thumbStyle = {
  right: '5px',
  borderRadius: '8px',
  backgroundColor: 'var(--q-primary)',
  width: '8px',
  opacity: 0.75,
  zIndex: 9999 // 🔥 here
}

export const barStyle = {
  right: '2px',
  borderRadius: '14px',
  backgroundColor: 'var(--q-primary)',
  width: '14px',
  opacity: 0.2,
  marginTop: '-3px',
  marginBottom: '-3px',
  paddingTop: '3px',
  paddingBottom: '3px',
   zIndex: 9998 // 🔥 here
}

export const pegaDominio = function () {
  let pagelocalurl = location.href // gets the address currently in the browser
  pagelocalurl = pagelocalurl.split('/') // splits the address by / (slash)
  const dominiourl = pagelocalurl[0] + '//' + pagelocalurl[2]
  return dominiourl // returns the www.address.com part
}


export const autoLabel = function (name) {
  if (!name) return ''
  
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}



export const urlBase = (url = '') => {
  if (url === '') {
    return process.env.API
  }

  if (url != null) {
    if (url[0] === '/') {
      return process.env.API + url
    }
    if (url[0] === 'h') {
      return url
    }
  }
}

export const isEntityType = (name) => {
  let result = false
  if (JSON.parse(getStorage('l', 'entityType'))?.name === name) {
    result = true
  }
  return result
}
