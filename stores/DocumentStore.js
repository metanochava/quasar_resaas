import { createBaseStore } from '../base/base_store'

// Document belongs to whatever content_object it points at (Person
// today, via Person.documents - see saas/models/document.py) - reading/
// writing individual rows still goes through the generic documents/
// endpoint like any other model; the add_employee flow itself creates
// new documents through the atomic hr/employees/register/ action
// instead (see EmployeeStore.register()), never through this store's
// own create(), so a new Document's content_type/object_id is always
// resolved server-side, never supplied by the frontend.
export const useDocumentStore = createBaseStore('document', {
  app: 'django_resaas',
  model: 'Document'
})
