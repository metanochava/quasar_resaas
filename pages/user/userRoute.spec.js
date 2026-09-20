import { describe, it, expect } from 'vitest'

import { userRoutes } from './userRoute'

describe('userRoutes - the logged-in user\'s own account', () => {
  const account = userRoutes.find(route => route.name === 'account')

  it('is a page of its own (a route), no longer a modal', () => {
    expect(account).toBeTruthy()
    expect(account.path).toBe('/account')
    expect(typeof account.component).toBe('function')
  })

  it('needs a session but no special role - everybody manages their own account', () => {
    expect(account.meta.requiresAuth).toBe(true)
    expect(account.meta.requiredRole).toBeUndefined()
  })

  it('does not disturb the admin routes for other users', () => {
    expect(userRoutes.map(route => route.name)).toEqual(
      expect.arrayContaining(['list_user', 'add_user', 'change_user', 'view_user'])
    )
  })
})
