import axios from 'axios'
import { getStorage } from './storage'
import { useLoadStore, useUserStore } from '../stores/AuthStore'
import { Alert } from './alerts'

const apiBaseUrl = process.env.API

const safeParse = (value) => {
  try {
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

/* ======================================================
   URL BUILDER
====================================================== */

export const url = (payload = { type: 'u', url: '', params: {} }) => {

  const User = useUserStore()
  const tipoEntidadeNome = User?.TipoEntidade?.nome

  let urlFinal = ''

  if (payload.type === 'u') {
    urlFinal = `${apiBaseUrl}/${payload.url}`
  }

  if (payload.type === 'nu') {
    urlFinal = `${apiBaseUrl}/${tipoEntidadeNome?.toLowerCase()}/${payload.url}`
  }

  urlFinal += '?format=json'

  Object.entries(payload?.params || {}).forEach(([k, v]) => {
    urlFinal += `&${k}=${v}`
  })

  return urlFinal
}


/* ======================================================
   BASE AXIOS
====================================================== */

const createClient = (auth = false, blob = false) => {

  const instance = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: false,
    headers: {
      Accept: 'application/json'
    },
    responseType: blob ? 'blob' : 'json'
  })

  /* ================= REQUEST ================= */

  instance.interceptors.request.use((config) => {

    const User = useUserStore()
    const Load = useLoadStore()

    config.headers = config.headers || {}

    if (auth) {
      const token = User.access || getStorage('l', 'access')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data'
    }

    const headersMap = {
      E: 'userEntidade',
      S: 'userSucursal',
      G: 'userGrupo',
      ET: 'tipoEntidade',
      L: 'userLang'
    }

    Object.entries(headersMap).forEach(([key, storage]) => {
      const data = safeParse(getStorage('l', storage))
      if (data?.id) config.headers[key] = data.id
    })

    config.headers['fek'] = process.env.FRONT_END_KEY
    config.headers['fep'] = process.env.FRONT_END_PASSWORD

    Load.inc()

    return config
  })


  /* ================= RESPONSE ================= */

  instance.interceptors.response.use(

    (response) => {

      const Load = useLoadStore()
      Load.dec()

      Alert(response)

      return response
    },

    (error) => {

      const User = useUserStore()
      const Load = useLoadStore()

      Load.dec()

      Alert(error?.response)

      const status = error?.response?.status

      if (status === 401) {
        User.logout('N')
      }

      return Promise.reject(error)
    }
  )

  return instance
}


/* ======================================================
   CLIENTES EXPORTADOS
====================================================== */

export const HTTPClient = createClient(false)
export const HTTPClientBlob = createClient(false, true)

export const HTTPAuth = createClient(true)
export const HTTPAuthBlob = createClient(true, true)


/* ======================================================
   WEBSOCKET URL
====================================================== */

export const wsApi = (apiBaseUrl.replace('http', 'ws'))