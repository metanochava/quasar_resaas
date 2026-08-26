import { defineStore } from 'pinia'

export const useActionStore = defineStore('action', {
  state: () => ({
    actions: {
      create: {
        icon: 'add',
        color: 'primary',
        label: 'Create'
      },
      edit: {
        icon: 'edit',
        color: 'warning',
        label: 'Edit'
      },
      delete: {
        icon: 'delete',
        color: 'negative',
        label: 'Delete'
      },
      view: {
        icon: 'visibility',
        color: 'info',
        label: 'View'
      },
      pdf: {
        icon: 'picture_as_pdf',
        color: 'red',
        label: 'PDF'
      },
      download: {
        icon: 'download',
        color: 'primary',
        label: 'Download'
      },
      toggle: {
        icon: 'toggle_on',
        color: 'positive',
        label: 'Activate/Deactivate'
      }
    }
  }),

  getters: {
    getAction: (state) => {
      return (name) => {
        return state.actions[name] || {
          icon: 'help',
          color: 'grey',
          label: name
        }
      }
    }
  },

  actions: {
    setAction(name, config) {
      this.actions[name] = config
    },

    setActions(newActions) {
      this.actions = { ...this.actions, ...newActions }
    }
  }
})