import { tdc } from '../boot/base'

import {
  HTTP,
  HTTPAuth,
  HTTPAuthBlob,
  url
} from '../boot/api'

import { useUserStore } from '../stores/UserStore'
import { useEntityStore } from '../stores/EntityStore'
import { useEntityTypeStore } from '../stores/EntityTypeStore'
import { useBranchStore } from '../stores/BranchStore'
import { useMenuStore } from '../stores/MenuStore'
import { usePersonStore } from '../stores/PersonStore'





export { createBaseStore } from '../base/base_store.js'





export * from '../boot/alerts'
export * from '../boot/api'
export * from '../boot/app'
export * from '../boot/base'
export * from '../boot/data'
export * from '../boot/storage'



import {
  buildFormFromSchema
} from '../utils/autoForm'


export function useResaas() {

  const User = useUserStore()

  const Entity = useEntityStore()

  const EntityType = useEntityTypeStore()

  const BranchStore = useBranchStore()

  const Menu = useMenuStore()

  const Person = usePersonStore()


  return {

    // tradução
    tdc,

    // HTTP
    HTTP,
    HTTPAuth,
    HTTPAuthBlob,
    url,

    // utils
    buildFormFromSchema,

    createBaseStore,

    // stores
    User,
    BranchStore,
    Entity,
    EntityType,
    Menu,
    Person,

  }
}