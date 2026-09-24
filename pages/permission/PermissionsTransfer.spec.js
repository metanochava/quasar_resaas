import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

const post = vi.fn()
const blobGet = vi.fn()
vi.mock('../../services/api.js', () => ({
  HTTPAuth: { post: (...a) => post(...a) },
  HTTPAuthBlob: { get: (...a) => blobGet(...a) },
  url: ({ url }) => url
}))
const alertSuccess = vi.fn()
vi.mock('../../boot/alerts.js', () => ({ AlertSuccess: (...a) => alertSuccess(...a) }))

const { default: PermissionsTransfer } = await import('./PermissionsTransfer.vue')
const { useUserStore } = await import('../../stores/UserStore.js')

const stubs = {
  's-btn': { props: ['label', 'disable', 'loading', 'type', 'icon'], emits: ['click'], template: '<button :disabled="disable" @click="$emit(\'click\')">{{ label }}</button>' },
  's-file': { props: ['modelValue', 'accept'], template: '<input data-test="file-stub" :accept="accept" />' },
  's-modal-card': { emits: ['submit', 'close'], template: '<form @submit.prevent="$emit(\'submit\')"><slot /><slot name="footer" /></form>' },
  'q-dialog': { props: ['modelValue'], template: '<div v-if="modelValue"><slot /></div>' }
}

const GROUP = {
  basePath: 'auth/groups/g1', format: 'csv', pdfAction: 'permissions_pdf', dataAction: 'permissions_csv',
  importAction: 'import_permissions', viewPermission: 'view_group', changePermission: 'change_group'
}
const ENTITY_TYPE = {
  basePath: 'django_resaas/entitytypes/t1', format: 'json', pdfAction: 'profiles_pdf', dataAction: 'profiles_json',
  importAction: 'import_profiles', viewPermission: 'view_entitytype', changePermission: 'change_entitytype'
}

function mountWith (props, permissions) {
  useUserStore().Permissions = new Set(permissions)
  return mount(PermissionsTransfer, { props, global: { plugins: [[Quasar, {}]], stubs } })
}

async function importFile (w) {
  await w.find('[data-test="permissions-transfer-import"]').trigger('click')
  w.vm.$.setupState.file = new File(['x'], 'f')
  await w.find('form').trigger('submit')
  await flushPromises()
}

beforeEach(() => {
  setActivePinia(createPinia())
  post.mockReset()
  blobGet.mockReset()
  alertSuccess.mockReset()
})

describe('PermissionsTransfer', () => {
  it('buttons follow the configured permissions', () => {
    const viewer = mountWith(ENTITY_TYPE, ['view_entitytype'])
    expect(viewer.find('[data-test="permissions-transfer-pdf"]').exists()).toBe(true)
    expect(viewer.find('[data-test="permissions-transfer-data"]').text()).toContain('JSON')
    expect(viewer.find('[data-test="permissions-transfer-import"]').exists()).toBe(false)

    const groupViewer = mountWith(GROUP, ['view_entitytype'])
    expect(groupViewer.find('[data-test="permissions-transfer-pdf"]').exists()).toBe(false)
  })

  it('imports a group CSV to the group endpoint with the mode', async () => {
    post.mockResolvedValue({ data: { mode: 'add', added: 2, removed: 0, total: 3 } })
    const w = mountWith(GROUP, ['change_group'])

    await importFile(w)

    const [endpoint, form] = post.mock.calls[0]
    expect(endpoint).toBe('auth/groups/g1/import_permissions/')
    expect(form.get('mode')).toBe('add')
    expect(alertSuccess).toHaveBeenCalled()
    expect(w.emitted('imported')[0][0].added).toBe(2)
  })

  it('imports entity type profiles as JSON and lists profile errors', async () => {
    post.mockRejectedValue({ response: { data: { error: { code: 'invalid_profiles', details: { profiles: { 'profiles[1] Bad': ["Unknown permission 'x'."] } } } } } })
    const w = mountWith(ENTITY_TYPE, ['change_entitytype'])

    await importFile(w)

    expect(post.mock.calls[0][0]).toBe('django_resaas/entitytypes/t1/import_profiles/')
    expect(w.find('[data-test="permissions-transfer-file"]').attributes('accept')).toContain('.json')
    const errors = w.find('[data-test="permissions-transfer-errors"]').text()
    expect(errors).toContain('profiles[1] Bad')
    expect(errors).toContain("Unknown permission 'x'.")
    expect(w.emitted('imported')).toBeUndefined()
  })

  it('lists CSV row errors', async () => {
    post.mockRejectedValue({ response: { data: { error: { details: { rows: { 3: ['Unknown permission'] } } } } } })
    const w = mountWith(GROUP, ['change_group'])

    await importFile(w)

    expect(w.find('[data-test="permissions-transfer-errors"]').text()).toContain('3: Unknown permission')
  })
})
