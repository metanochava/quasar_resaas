import { createBaseStore } from '../base/base_store'

// Generic list/CRUD of EntityMobileTab
// (django_resaas.saas.models.mobile_tab.EntityMobileTab) - the phone's bottom tabs.
export const useEntityMobileTabStore = createBaseStore(
  'entityMobileTab',
  {
    app: 'django_resaas',
    model: 'EntityMobileTab'
  }
)
