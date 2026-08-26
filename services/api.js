


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

  if (payload.type === 'nu') finalUrl += `/${entityType}`
  finalUrl += `/${payload.url}?format=json`

  Object.entries(payload.params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null)
      finalUrl += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`
  })

  return finalUrl
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
