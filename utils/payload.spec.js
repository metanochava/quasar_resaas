import { describe, it, expect, vi } from 'vitest'
import { buildWritePayload, updateWithPayload, isReadShape, toWriteShapes } from './payload'

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

  it('an emptied photo input (null/"") is never sent, so the current photo is kept', () => {
    expect(buildWritePayload({ ...loaded, photo: null }, fields)).not.toHaveProperty('photo')
    expect(buildWritePayload({ ...loaded, photo: '' }, fields)).not.toHaveProperty('photo')
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

describe('toWriteShapes (READ shape -> WRITE value in a request body)', () => {
  const consulta = { id: 'f50a', value: 'f50a', label: 'António Zandamela' }

  it('unwraps a relation/choice given as {id, value, label}', () => {
    expect(toWriteShapes({ consulta, estado: { value: 'ativo', label: 'Ativo' }, medico: { id: 'm1', label: 'X' } }))
      .toEqual({ consulta: 'f50a', estado: 'ativo', medico: 'm1' })
  })

  it('unwraps each READ-shaped item of an array and keeps plain items', () => {
    expect(toWriteShapes({ tags: [{ id: 'a', value: 'a', label: 'A' }, 'b'] })).toEqual({ tags: ['a', 'b'] })
  })

  it('keeps nested objects that have other keys (a Person address is not a relation)', () => {
    const address = { id: 'ad1', street: 'Rua 1', city: 'Maputo' }

    expect(toWriteShapes({ address }).address).toBe(address)
  })

  it('leaves scalars, null, arrays of scalars and dates alone, without mutating the form', () => {
    const date = new Date('2026-01-01')
    const form = { name: 'x', n: 3, none: null, list: [1, 2], date, consulta }

    expect(toWriteShapes(form)).toEqual({ name: 'x', n: 3, none: null, list: [1, 2], date, consulta: 'f50a' })
    expect(form.consulta).toBe(consulta)
  })

  it('isReadShape is strict', () => {
    expect(isReadShape({ id: '1', label: 'x' })).toBe(true)
    expect(isReadShape({ label: 'only a label' })).toBe(false)
    expect(isReadShape({ id: '1', street: 'x' })).toBe(false)
    expect(isReadShape([])).toBe(false)
  })
})

