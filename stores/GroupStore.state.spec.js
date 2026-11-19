import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../services/api', () => ({
  HTTPAuth: { get: vi.fn(), post: vi.fn() },
  HTTPClient: { get: vi.fn(), post: vi.fn() },
  url: ({ url }) => url
}))

import { HTTPAuth } from '../services/api'
import { useGroupStore } from './GroupStore'
import { useUserStore } from './UserStore'

const nurse = { id: 'g1', name: 'Nurse', state: 'Active' }
const clerk = { id: 'g2', name: 'Clerk', state: 'Inactive' }
const guest = { id: 'g3', name: 'Guest', state: 'Active' }

beforeEach(() => {
  setActivePinia(createPinia())
  useUserStore().data = { id: 'u1' }
})

describe('GroupStore - only Active profiles can be picked', () => {
  for (const method of ['getGroups', 'getGroups_']) {
    it(`${method} leaves out a profile an Admin switched off`, async () => {
      HTTPAuth.get.mockResolvedValueOnce({ data: [nurse, clerk, guest] })
      const Groups = useGroupStore()
      vi.spyOn(Groups, 'select').mockResolvedValue()
      vi.spyOn(Groups, 'select_').mockResolvedValue()

      await Groups[method]()

      expect(Groups.rows.map(g => g.id)).toEqual(['g1', 'g3'])
      expect(useUserStore().Groups.map(g => g.id)).toEqual(['g1', 'g3'])
    })
  }
})
