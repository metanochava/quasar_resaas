import { HTTPAuth, url } from './api'
import { getStorage, setStorage, deleteStorage } from './storage'

const STORAGE_KEY = 'resaasContext'

export const getResaasContext = () => getStorage('s', STORAGE_KEY)

export const setResaasContext = token =>
  token
    ? setStorage('s', STORAGE_KEY, token)
    : clearResaasContext()

export const clearResaasContext = () =>
  deleteStorage('s', STORAGE_KEY)

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

  return data
}