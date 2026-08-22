import { tdc } from '../boot/base'

import { HTTPAuth,  HTTPAuthBlob,  HTTPClient, HTTPClientBlob,  wsApi,  url,  safeParse } from '../boot/api'

/* ======================================================
   WEBSOCKET URL
====================================================== */



import { useUserStore } from '../stores/UserStore'
export * from '../stores/UserStore'
import { useEntityStore } from '../stores/EntityStore'
export * from '../stores/EntityStore'
import { useEntityTypeStore } from '../stores/EntityTypeStore'
export * from '../stores/EntityTypeStore'
import { useBranchStore } from '../stores/BranchStore'
export *  from '../stores/BranchStore'
import { useMenuStore } from '../stores/MenuStore'
export * from '../stores/MenuStore'
import { usePersonStore } from '../stores/PersonStore'
export * from '../stores/PersonStore'




export { createBaseStore } from '../base/base_store'
export * from '../base/base_store'



import { buildFormFromSchema } from '../utils/autoForm'
export * from '../utils/autoForm'


export * from '../boot/alerts'
export * from '../boot/api'
export * from '../boot/app'
export * from '../boot/base'
export * from '../boot/data'
export * from '../boot/storage'






export function useResaas() {

  const User = useUserStore()

  const Entity = useEntityStore()

  const EntityType = useEntityTypeStore()

  const BranchStore = useBranchStore()

  const Menu = useMenuStore()

  const Person = usePersonStore()


  return {

    safeParse,

    // tradução
    tdc,

    // HTTP

    HTTPAuth,
    HTTPAuthBlob,
    HTTPClient,
    HTTPClientBlob,
    wsApi,
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