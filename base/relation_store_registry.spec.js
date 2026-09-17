import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../services/api', () => ({
  url: ({ url }) => url,
  HTTPAuth: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  HTTPAuthBlob: { get: vi.fn() },
}))

vi.mock('../utils/autoForm', () => ({
  buildFormFromSchema: vi.fn(),
}))

const { getRelationStore } = await import('./relation_store_registry')

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('getRelationStore', () => {
  it('returns the same store instance for the same app/model pair', () => {
    const a = getRelationStore('hr', 'Employee')
    const b = getRelationStore('hr', 'Employee')

    expect(a).toBe(b)
  })

  it('returns a distinct store per app/model pair', () => {
    const employee = getRelationStore('hr', 'Employee')
    const branch = getRelationStore('django_resaas', 'Branch')

    expect(employee).not.toBe(branch)
    expect(employee.model).toBe('Employee')
    expect(branch.model).toBe('Branch')
  })

  it('never reuses an app-level dedicated store id for the same model', () => {
    // A relation quick-create store must never collide with (and so
    // never share state with) an app's own pre-existing dedicated
    // store for that same model, e.g. useEmployeeStore's id 'employee'
    // - see relation_store_registry.js's own module comment for why.
    const store = getRelationStore('hr', 'Employee')

    expect(store.$id).not.toBe('employee')
    expect(store.$id).toBe('relation_quickcreate_hr.Employee')
  })
})
