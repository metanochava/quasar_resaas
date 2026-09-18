import { createBaseStore } from '../base/base_store'
import { HTTPAuth, url } from '../services/api'

export const usePersonStore = createBaseStore(
  'person',
  {
    app: 'django_resaas',
    model: 'Person'
  },
  {

    // ========================================
    // STATE
    // ========================================
    state: () => ({

      selectedPerson: null,
      searchingPerson: false,
      matchingPerson: false,

    }),

    // ========================================
    // GETTERS
    // ========================================
    getters: {

      hasSelectedPerson: (state) => !!state.selectedPerson,

    },

    // ========================================
    // ACTIONS
    // ========================================
    actions: {

      // ========================================
      // SEARCH PERSON
      // ========================================
      async searchPersons(search = '') {

        try {

          this.searchingPerson = true

          this.setSearch(search)

          await this.loadData()

          return this.rows || []

        } finally {

          this.searchingPerson = false

        }

      },

      // ========================================
      // MATCH (duplicate-detection)
      // ========================================
      // PersonAPIView.match (saas/data/person/views/person.py) - a
      // @resaas_action, not generic CRUD, so it's called directly
      // rather than through loadData()/create() (same convention as
      // EmployeeStore's checkIn/checkOut). Backed by the reusable
      // person_matching_service, deliberately NOT Employee-specific -
      // any future intake flow (Patient/Student/Customer) can call
      // this same action.
      async matchCandidates(payload) {
        this.matchingPerson = true

        try {
          const { data } = await HTTPAuth.post(
            url({ type: 'u', url: 'django_resaas/persons/match/' }),
            payload
          )
          return data?.results || []
        } finally {
          this.matchingPerson = false
        }
      },

      // ========================================
      // ADD DOCUMENT (to an existing Person)
      // ========================================
      // PersonAPIView.add_document - same @resaas_action convention as
      // matchCandidates above. Only needed for a Person that already
      // exists (change_employee's edit flow): a brand new Person's
      // documents still go through EmployeeAPIView.register's atomic
      // person.documents.create() instead, same as before.
      async addDocument(personId, payload) {
        const hasFile = payload?.arquivo instanceof File

        let body = payload
        if (hasFile) {
          body = new FormData()
          Object.entries(payload).forEach(([key, value]) => {
            if (value !== null && value !== undefined) body.append(key, value)
          })
        }

        const { data } = await HTTPAuth.post(
          url({ type: 'u', url: `django_resaas/persons/${personId}/add_document/` }),
          body
        )
        return data
      },

      // ========================================
      // SELECT PERSON
      // ========================================
      selectPerson(person) {

        this.selectedPerson = person

        this.form = {
          ...person
        }

      },

      // ========================================
      // CLEAR PERSON
      // ========================================
      clearSelectedPerson() {

        this.selectedPerson = null

        this.resetForm()

      }

    },

    // ========================================
    // HOOKS
    // ========================================
    hooks: {

      beforeLoad() {

      },

      afterLoad(data) {

      },

      beforeCreate(form) {

      },

      afterCreate(data) {

        // 🔥 when a person is created
        // automatically select it

        this.selectedPerson = data

      }

    }

  }
)