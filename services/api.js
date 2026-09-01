


import axios from 'axios'
import { getStorage } from './storage'
import { useUserStore } from '../stores/UserStore'
import { useLoadStore } from '../stores/LoadStore'
import { Alert } from '../boot/alerts'
import { safeParse } from '../utils/json'

const apiPrefix = process.env.API_PREFIX
const apiBaseUrl = `${process.env.API}/${apiPrefix}`

export const url = (payload = { type: 'u', url: '', params: {} }) => {
  const entityType = useUserStore()?.EntityType?.name?.toLowerCase()
  let finalUrl = apiBaseUrl

  // strip a leading slash the caller's path might carry, so
  // "demo/products/" and "/demo/products/" both join onto apiBaseUrl
  // with exactly one slash, never two. The trailing slash is NOT
  // touched - DRF's routers require it (APPEND_SLASH), so every
  // existing caller already includes it deliberately for detail/list
  // endpoints ("demo/products/42/", "demo/products/42/archive/", ...).
  const path = String(payload.url || '').replace(/^\/+/, '')

  if (payload.type === 'nu') finalUrl += `/${entityType}`
  finalUrl += `/${path}`

  // URLSearchParams (not manual string concatenation) so encoding is
  // always correct - spaces, special characters, and arrays (appended
  // as repeated `key=value` pairs, the convention DRF/django-filter
  // expect for multi-value filters) all come out right.
  const query = new URLSearchParams({ format: 'json' })

  Object.entries(payload.params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return

    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item !== undefined && item !== null) query.append(key, item)
      })
      return
    }

    query.append(key, value)
  })

  return `${finalUrl}?${query.toString()}`
}

const createClient = (auth = false, blob = false) => {
  const instance = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: false,
    headers: { Accept: 'application/json' },
    responseType: blob ? 'blob' : 'json'
  })

  instance.interceptors.request.use(config => {
    const User = useUserStore()
    const Load = useLoadStore()

    config.headers ||= {}

    if (auth) {
      const accessToken = User.access || getStorage('l', 'access')
      const contextToken = getStorage('s', 'resaasContext')

      if (accessToken)
        config.headers.Authorization = `Bearer ${accessToken}`

      if (contextToken)
        config.headers['X-RESAAS-Context'] = contextToken
    }

    const language = safeParse(getStorage('l', 'userLang'))

    if (language?.id) config.headers.L = language.id

    if (config.data instanceof FormData)
      config.headers['Content-Type'] = 'multipart/form-data'

    config.headers.fek = process.env.FRONT_END_KEY
    config.headers.fep = process.env.FRONT_END_PASSWORD

    Load.inc()
    return config
  })

  instance.interceptors.response.use(
    response => {
      useLoadStore().dec()
      Alert(response)
      return response
    },
    error => {
      useLoadStore().dec()
      Alert(error?.response)

      if (error?.response?.status === 401)
        useUserStore().logout('N')

      return Promise.reject(error)
    }
  )

  return instance
}

export const HTTPClient = createClient()
export const HTTPClientBlob = createClient(false, true)
export const HTTPAuth = createClient(true)
export const HTTPAuthBlob = createClient(true, true)

export const wsApi = apiBaseUrl .replace('https', 'wss') .replace('http', 'ws')
