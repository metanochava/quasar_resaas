import { tdc } from '../boot/base'

import {
  HTTPAuth,
  HTTPAuthBlob,
  HTTPClient,
  HTTPClientBlob,
  wsApi,
  url,
  safeParse
} from '../boot/api'


import {
  useUserStore
} from '../stores/UserStore'

import {
  useEntityStore
} from '../stores/EntityStore'

import {
  useEntityTypeStore
} from '../stores/EntityTypeStore'

import {
  useBranchStore
} from '../stores/BranchStore'

import {
  useMenuStore
} from '../stores/MenuStore'

import {
  usePersonStore
} from '../stores/PersonStore'


import {
  createBaseStore
} from '../base/base_store'


import {
  buildFormFromSchema
} from '../utils/autoForm'


export function useResaas() {

  const User = useUserStore()

  const Entity = useEntityStore()

  const EntityType = useEntityTypeStore()

  const Branch = useBranchStore()

  const Menu = useMenuStore()

  const Person = usePersonStore()


  return {

    // =====================================
    // BASE
    // =====================================

    tdc,
    safeParse,


    // =====================================
    // HTTP
    // =====================================

    HTTPAuth,
    HTTPAuthBlob,

    HTTPClient,
    HTTPClientBlob,

    wsApi,
    url,


    // =====================================
    // UTILS
    // =====================================

    buildFormFromSchema,

    createBaseStore,


    // =====================================
    // STORES
    // =====================================

    User,
    Entity,
    EntityType,
    Branch,
    Menu,
    Person,

  }
}