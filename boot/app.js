


export const apiBaseUrl =  process.env.API_BASE_URL
export const thumbStyle = {
  right: '5px',
  borderRadius: '8px',
  backgroundColor: 'var(--q-primary)',
  width: '8px',
  opacity: 0.75
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
  paddingBottom: '3px'
}

export const pegaDominio = function () {
  let pagelocalurl = location.href // pega endereço que esta no navegador
  pagelocalurl = pagelocalurl.split('/') // quebra o endeço de acordo com a / (barra)
  const dominiourl = pagelocalurl[0] + '//' + pagelocalurl[2]
  return dominiourl // retorna a parte www.endereco.com.brs@
}


export const autoLabel = function (name) {
  if (!name) return ''
  
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

// Initialize the annoying-background directive.
export const IsTipoEntidade = {
  bind (el, binding, _vnode) {
    if (el) {
      const ite = decrypt(localStorage.getItem(('tipo_entidade_nome')) + '')

      if (!(binding.value === ite)) {
        el.style.display = 'none'
      }
    }
  }
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

export const isTipoEntidade = (nome) => {
  let result = false
  if (JSON.parse(getStorage('l', 'tipoEntidade'))?.nome === nome) {
    result = true
  }
  return result
}
