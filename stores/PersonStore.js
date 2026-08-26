import { createBaseStore } from '../base/base_store'

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