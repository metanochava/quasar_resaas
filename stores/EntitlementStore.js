// Entitlements of the current tenant (features, capacities) - read from
// GET resaas/entitlements/ (django_resaas core/entitlements). UX only:
// showing, hiding or disabling something here never protects it - the
// backend refuses what the tenant is not entitled to (403
// feature_not_available / capacity_exceeded / module_not_available).
//
// Hand-written store (like DashboardStore/LoadStore): it is not a CRUD model,
// so createBaseStore() does not apply.

import { defineStore } from 'pinia'

import { HTTPAuth, url } from '../services/api'
import { getResaasContext } from '../services/tenantContext'

export const useEntitlementStore = defineStore('entitlement', {
  state: () => ({
    // null until loaded: nothing is known yet
    restricted: null,
    features: {},
    capacities: {},
    loading: false,
    // the context token the data belongs to (a new Entity/Branch reloads)
    loadedFor: null,
  }),

  getters: {
    loaded: (state) => state.restricted !== null,

    // Not loaded or not restricted -> true (the backend still decides).
    // Restricted -> only what the backend listed as enabled.
    hasFeature: (state) => (name) => {
      if (state.restricted !== true) return true
      return state.features[name] === true
    },

    // { limit, used } or null when unknown. limit null = no limit.
    getCapacity: (state) => (name) => state.capacities[name] || null,

    // Whether `adding` more fit: for disabling a "New" button, showing "3 / 3".
    canAdd: (state) => (name, adding = 1) => {
      const capacity = state.capacities[name]
      if (!capacity || capacity.limit === null || capacity.limit === undefined) return true
      return (capacity.used ?? 0) + adding <= capacity.limit
    },
  },

  actions: {
    async load({ force = false } = {}) {
      const context = getResaasContext()
      if (!force && this.loaded && this.loadedFor === context) return this.$state

      this.loading = true
      try {
        const { data } = await HTTPAuth.get(url({ type: 'u', url: 'resaas/entitlements/', params: {} }))
        this.restricted = Boolean(data?.restricted)
        this.features = data?.features || {}
        this.capacities = data?.capacities || {}
        this.loadedFor = context
        return this.$state
      } finally {
        this.loading = false
      }
    },

    reset() {
      this.$reset()
    },
  },
})
