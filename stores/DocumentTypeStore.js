import { createBaseStore } from '../base/base_store'

export const useDocumentTypeStore = createBaseStore('document_type', {
  app: 'django_resaas',
  model: 'DocumentType'
})
