


import axios from 'axios'
import { getStorage } from './storage'
import { useUserStore } from '../stores/UserStore'
import { useLoadStore } from '../stores/LoadStore'
import { Alert } from '../boot/alerts'
import { safeParse } from '../utils/json'

const apiPrefix = process.env.API_PREFIX
const apiBaseUrl = `${process.env.API}/${apiPrefix}`

// Shared across every client instance (module-level, not per-
// createClient()) so concurrent 401s from HTTPAuth AND HTTPAuthBlob
// during the same expiry reuse one in-flight refresh instead of each
// firing their own refresh_token/ call.
let refreshPromise = null

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = useUserStore().refreshToken()
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

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
    async error => {
      useLoadStore().dec()

      const status = error?.response?.status
      const originalRequest = error?.config

      // Silent refresh-and-retry: an expired ACCESS token is routine
      // (short TTL, expected mid-session) and the REFRESH token is
      // valid for a day - retry once with a fresh access token
      // instead of forcing the user to log back in on every access-
      // token expiry. Skip it for the refresh_token/ call itself
      // (its own 401 means the refresh token is genuinely dead, not
      // something another refresh could fix) and only ever retry a
      // given request once.
      if (
        auth && status === 401 && originalRequest &&
        !originalRequest._retried &&
        !String(originalRequest.url || '').includes('refresh_token/')
      ) {
        const User = useUserStore()
        const refreshToken = User.refresh || getStorage('l', 'refresh')

        if (!User.isTokenExpired(refreshToken)) {
          User.refresh = refreshToken
          originalRequest._retried = true

          try {
            await refreshAccessToken()
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${User.access}`
            }
            return instance(originalRequest)
          } catch (refreshError) {
            // refresh token itself was rejected - fall through to Alert/logout below
          }
        }
      }

      Alert(error?.response)

      if (status === 401)
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
