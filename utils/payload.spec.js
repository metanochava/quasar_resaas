import { describe, it, expect, vi } from 'vitest'
import { buildWritePayload, updateWithPayload } from './payload'

const fields = [
  { name: 'id', type: 'UUIDField', read_only: true },
  { name: 'name', type: 'CharField' },
  { name: 'gender', type: 'CharField' },
  { name: 'manager', type: 'ForeignKey' },
  { name: 'photo', type: 'ImageField' },
  { name: 'full_name', type: 'CharField', read_only: true },
  { name: 'notes', type: 'TextField' }
]

describe('buildWritePayload', () => {
  const loaded = {
    id: 'p1', name: 'Ana', full_name: 'Ana Costa', label: 'Ana Costa', age: 30,
    gender: { id: 'F', value: 'F', label: 'Feminine' },
    manager: { id: 'm1', value: 'm1', label: 'Boss' },
    photo: { url: 'http://x/p.png', name: 'p.png' },
    notes: null,
    person_data: { id: 'x' }
  }

  it('turns {id,value,label} choices/relations into their value', () => {
    const payload = buildWritePayload(loaded, fields)
    expect(payload.gender).toBe('F')
    expect(payload.manager).toBe('m1')
  })

  it('drops read-only, computed and non-schema keys', () => {
    const payload = buildWritePayload(loaded, fields)
    expect(payload).not.toHaveProperty('id')
    expect(payload).not.toHaveProperty('full_name')
    expect(payload).not.toHaveProperty('label')
    expect(payload).not.toHaveProperty('age')
    expect(payload).not.toHaveProperty('person_data')
  })

  it('never resends an unchanged file, but does send a new upload', () => {
    expect(buildWritePayload(loaded, fields)).not.toHaveProperty('photo')

    const file = new File(['x'], 'n.png', { type: 'image/png' })
    expect(buildWritePayload({ ...loaded, photo: file }, fields).photo).toStrictEqual(file)
  })

  it('keeps an explicit null so a cleared field is actually cleared', () => {
    expect(buildWritePayload(loaded, fields).notes).toBe(null)
  })

  it('honours exclude (locked fields) and passthrough (nested address as-is)', () => {
    const payload = buildWritePayload(
      { ...loaded, address: { id: 'a1', route: 'Rua X' } },
      fields,
      { exclude: ['manager'], passthrough: ['address'] }
    )
    expect(payload).not.toHaveProperty('manager')
    expect(payload.address).toEqual({ id: 'a1', route: 'Rua X' })
  })
})

describe('updateWithPayload', () => {
  it('sends the payload as the store form, then lets update() replace it', async () => {
    const store = { form: { id: 'p1', gender: { value: 'F' } }, update: vi.fn(async function () { this.form = { id: 'p1', fresh: true } }) }
    await updateWithPayload(store, { gender: 'F' })
    expect(store.update).toHaveBeenCalled()
    expect(store.form).toEqual({ id: 'p1', fresh: true })
  })

  it('restores the loaded form if the request fails', async () => {
    const loaded = { id: 'p1', gender: { value: 'F' } }
    const store = { form: loaded, update: vi.fn().mockRejectedValue(new Error('400')) }
    await expect(updateWithPayload(store, { gender: 'F' })).rejects.toThrow()
    expect(store.form).toBe(loaded)
  })
})
