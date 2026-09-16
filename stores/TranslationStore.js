import { createBaseStore } from '../base/base_store'

// Lista/CRUD genérico de Translation
// (django_resaas.saas.models.translation.Translation) - mesmo padrão
// minimalista de stores/LayoutSettingStore.js.
export const useTranslationStore = createBaseStore(
  'translation',
  {
    app: 'django_resaas',
    model: 'Translation'
  }
)
