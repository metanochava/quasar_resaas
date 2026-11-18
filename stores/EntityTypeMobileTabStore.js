import { createBaseStore } from '../base/base_store'

// Generic list/CRUD of EntityTypeMobileTab
// (django_resaas.saas.models.mobile_tab.EntityTypeMobileTab) - the phone's bottom tabs.
export const useEntityTypeMobileTabStore = createBaseStore(
  'entityTypeMobileTab',
  {
    app: 'django_resaas',
    model: 'EntityTypeMobileTab'
  }
)
