import { createBaseStore } from '../base/base_store'

// Lista/CRUD genérico de File (django_resaas.saas.models.file.File) -
// mesmo padrão minimalista de stores/LayoutSettingStore.js.
export const useFileStore = createBaseStore(
  'file',
  {
    app: 'django_resaas',
    model: 'File'
  }
)
