


import axios from 'axios'
import { getStorage } from './storage'
import { shouldRenewContext, isContextExpiredError } from './contextExpiry'
import { useUserStore } from '../stores/UserStore'
import { useLoadStore } from '../stores/LoadStore'
import { Alert } from '../boot/alerts'
import { safeParse } from '../utils/json'

const apiPrefix = process.env.API_PREFIX
const apiBaseUrl = `${process.env.API}/${apiPrefix}`

let refreshPromise = null

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = useUserStore().refreshToken()
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

let contextRefreshPromise = null

function refreshResaasContext() {
  if (!contextRefreshPromise) {
    contextRefreshPromise = useUserStore().refreshResaasContext()
      .finally(() => { contextRefreshPromise = null })
  }
  return contextRefreshPromise
}

export const url = (payload = { type: 'u', url: '', params: {} }) => {
  const entityType = useUserStore()?.EntityType?.name?.toLowerCase()
  let finalUrl = apiBaseUrl

  const path = String(payload.url || '').replace(/^\/+/, '')

  if (payload.type === 'nu') finalUrl += `/${entityType}`
  finalUrl += `/${path}`

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

  instance.interceptors.request.use(async config => {
    const User = useUserStore()
    const Load = useLoadStore()

    config.headers ||= {}

    if (
      auth &&
      !String(config.url || '').includes('resaas/context/') &&
      shouldRenewContext(getStorage('s', 'resaasContextExpiresAt'))
    ) {
      try {
        await User.renewResaasContextQuietly()
      } catch {
        // handled by the reactive retry
      }
    }

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

      if (
        auth && originalRequest &&
        !originalRequest._retriedContext &&
        await isContextExpiredError(error)
      ) {
        originalRequest._retriedContext = true

        try {
          await refreshResaasContext()

          if (useUserStore().ResaasContext) {
            return instance(originalRequest)
          }
        } catch (contextRefreshError) {
          // no Entity to rebuild the context from, or the re-issue
          // request itself failed - fall through to Alert below
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
