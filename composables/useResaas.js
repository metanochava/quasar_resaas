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



export * from './base/base_store.js'





export * from './boot/alerts.js'
export * from './boot/api.js'
export * from './boot/app.js'
export * from './boot/base.js'
export * from './boot/data.js'
export * from './boot/storage.js'



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

    // stores
    User,
    BranchStore,
    Entity,
    EntityType,
    Menu,
    Person,

  }
}