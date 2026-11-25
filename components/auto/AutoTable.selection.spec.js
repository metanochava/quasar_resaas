import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

const perms = vi.hoisted(() => ({ set: new Set() }))
vi.mock('../../stores/UserStore', () => ({ useUserStore: () => ({ ps: {}, can: p => perms.set.has(p), Permissions: perms.set }) }))
vi.mock('../../stores/ActionStore', () => ({ useActionStore: () => ({ getAction: name => ({ icon: 'help', color: 'grey', label: name }) }) }))
vi.mock('../../services/translation', () => ({ tdc: t => t }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import AutoTable from './AutoTable.vue'

const COLUMNS = [
  { name: '__actions', label: 'Actions', field: '__lactions', align: 'left' },
  { name: '__actions', label: 'Actions', field: '__ractions', align: 'right' },
  { name: 'name', label: 'Name', field: 'name', align: 'left' },
]
const ROWS = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C', deleted_at: '2026-11-20' }]
const stubs = {
  's-btn': { props: ['label', 'disable'], emits: ['click'], template: '<button v-bind="$attrs" :disabled="disable" @click="$emit(\'click\')">{{ label }}<slot /></button>' },
  's-tooltip': { template: '<span />' },
  's-input': { template: '<div v-bind="$attrs"><slot name="prepend" /><slot name="append" /></div>' },
  'q-menu': { template: '<div class="menu"><slot /></div>' },
  's-confirm-delete': true, 's-pdf-render': true,
}

function mountTable () {
  return mount(AutoTable, {
    props: { model: 'Product', rows: ROWS, columns: COLUMNS, pagination: { page: 1, rowsPerPage: 10, rowsNumber: 3 }, schema: { ui: { title: 'Products' } }, config: { routes: { add: 'add_product' } } },
    global: { plugins: [Quasar, createPinia()], stubs },
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  perms.set = new Set(['delete_product', 'restore_product', 'add_product', 'list_product'])
})

describe('AutoTable: select rows, then delete or restore them', () => {
  it('each row has a checkbox beside its menu; "select all" picks the whole page', async () => {
    const w = mountTable()
    await flushPromises()
    expect(w.findAll('[data-test="auto-table-select-row"]')).toHaveLength(3)

    await w.find('[data-test="auto-table-select-all"]').trigger('click')
    expect(w.find('[data-test="auto-table-bulk-count"]').text()).toBe('3')
  })

  it('delete takes the live rows, restore the deleted ones', async () => {
    const w = mountTable()
    await flushPromises()
    await w.find('[data-test="auto-table-select-all"]').trigger('click')

    await w.find('[data-test="auto-table-bulk-delete"]').trigger('click')
    await w.find('[data-test="auto-table-bulk-restore"]').trigger('click')
    const [deleted, restored] = w.emitted('bulk').map(([event]) => event)
    expect(deleted.type).toBe('delete')
    expect(deleted.rows.map(r => r.id)).toEqual([1, 2])
    expect(restored.rows.map(r => r.id)).toEqual([3])
  })

  it('no permission to delete or restore: the checkboxes and the bulk button stay, disabled', async () => {
    perms.set = new Set(['list_product'])
    const w = mountTable()
    await flushPromises()
    expect(w.find('[data-test="auto-table-select-row"]').attributes('aria-disabled')).toBe('true')
    expect(w.find('[data-test="auto-table-select-all"]').attributes('aria-disabled')).toBe('true')
    expect(w.find('[data-test="auto-table-bulk"]').attributes('disabled')).toBeDefined()
  })

  it('both sides have a checkbox and the bulk button, in the header and on every row', async () => {
    const w = mountTable()
    await flushPromises()
    expect(w.find('[data-test="auto-table-select-all"]').exists()).toBe(true)
    expect(w.find('[data-test="auto-table-select-all-right"]').exists()).toBe(true)
    expect(w.find('[data-test="auto-table-bulk"]').exists()).toBe(true)
    expect(w.find('[data-test="auto-table-bulk-right"]').exists()).toBe(true)
    expect(w.findAll('[data-test="auto-table-select-row"]')).toHaveLength(3)
    expect(w.findAll('[data-test="auto-table-select-row-right"]')).toHaveLength(3)

    await w.findAll('[data-test="auto-table-select-row-right"]')[0].trigger('click')
    expect(w.find('[data-test="auto-table-bulk-count"]').text()).toBe('1')
  })

  it('the top bar: one New (the add page), the rest in the "more" menu', async () => {
    const w = mountTable()
    await flushPromises()
    expect(w.findAll('[data-test="auto-table-add"]')).toHaveLength(1)
    expect(w.find('[data-test="auto-table-add-dialog"]').exists()).toBe(true)
    expect(w.find('[data-test="auto-table-columns"]').exists()).toBe(true)
  })
})
