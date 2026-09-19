import { HTTPAuth, url } from './api'
import { getStorage, setStorage, deleteStorage } from './storage'
import { contextExpiresAt } from './contextExpiry'

const STORAGE_KEY = 'resaasContext'
// When the stored token stops being valid (ms epoch) - lets the API client
// renew it BEFORE it expires instead of only reacting to a 403.
export const EXPIRES_KEY = 'resaasContextExpiresAt'

export const getResaasContextExpiresAt = () => getStorage('s', EXPIRES_KEY)

export const getResaasContext = () => getStorage('s', STORAGE_KEY)

export const setResaasContext = token =>
  token
    ? setStorage('s', STORAGE_KEY, token)
    : clearResaasContext()

export const clearResaasContext = () => {
  deleteStorage('s', STORAGE_KEY)
  deleteStorage('s', EXPIRES_KEY)
}

export async function createResaasContext({
  entity,
  branch = null,
  group = null
} = {}) {
  const getId = value =>
    typeof value === 'object' ? value?.id : value

  const entityId = getId(entity)
  const branchId = getId(branch)
  const groupId = getId(group)

  if (!entityId) throw new Error('Entity is required')

  const { data } = await HTTPAuth.post(
    url({ type: 'u', url: 'resaas/context/' }),
    {
      entity_id: entityId,
      branch_id: branchId || null,
      group_id: groupId || null
    }
  )

  if (!data?.token)
    throw new Error('RESAAS context token was not returned')

  setResaasContext(data.token)
  setStorage('s', EXPIRES_KEY, String(contextExpiresAt(data)))

  return data
}