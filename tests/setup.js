import { config } from '@vue/test-utils'

// Global stubs for s-* framework components commonly rendered inside container components
config.global.stubs = {
  ...config.global.stubs,
  's-modal-card': true,
  's-tooltip': true,
  's-confirm-delete': true,
  's-pdf-render': true,
}
