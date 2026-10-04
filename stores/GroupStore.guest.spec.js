import { describe, it, expect } from 'vitest'
import { singleWorkingGroup } from './GroupStore'

const guest = { id: 'g0', name: 'Guest' }
const doctor = { id: 'g1', name: 'Doctor' }
const nurse = { id: 'g2', name: 'Nurse' }

describe('singleWorkingGroup - the profile chosen at login', () => {
  it('Guest plus one profile: that profile (Guest is never chosen over it)', () => {
    expect(singleWorkingGroup([guest, doctor])).toBe(doctor)
    expect(singleWorkingGroup([doctor, guest])).toBe(doctor)
  })

  it('only Guest: Guest', () => {
    expect(singleWorkingGroup([guest])).toBe(guest)
  })

  it('one profile without Guest: that profile, as before', () => {
    expect(singleWorkingGroup([doctor])).toBe(doctor)
  })

  it('two working profiles: none - the user chooses', () => {
    expect(singleWorkingGroup([guest, doctor, nurse])).toBeNull()
    expect(singleWorkingGroup([doctor, nurse])).toBeNull()
  })

  it('no profile: none', () => {
    expect(singleWorkingGroup([])).toBeNull()
    expect(singleWorkingGroup(undefined)).toBeNull()
  })
})
