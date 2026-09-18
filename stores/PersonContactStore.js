import { createBaseStore } from '../base/base_store'

// Generic CRUD store for PersonContact (saas/data/person_contact/ -
// serializer/view mirroring saas/data/person/ exactly, registered on
// "personcontacts" the same way "persons" is - see urls.py). Plain
// fields only (no files/nested objects), so the base create()/update()
// already handle everything this needs.
export const usePersonContactStore = createBaseStore(
  'person_contact',
  {
    app: 'django_resaas',
    model: 'PersonContact'
  }
)
