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