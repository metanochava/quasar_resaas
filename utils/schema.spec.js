import { describe, it, expect } from 'vitest'
import { RESAAS_SCHEMA_VERSION, normalizeSchema } from './schema.js'

describe('vitest setup sanity', () => {
  it('exposes the current schema version', () => {
    expect(RESAAS_SCHEMA_VERSION).toBe('1.0')
  })

  it('normalizes an empty payload into the documented default shape', () => {
    const schema = normalizeSchema({})
    expect(schema.schema_version).toBe('1.0')
    expect(schema.model).toEqual({
      app: '',
      name: '',
      class_name: '',
      label: '',
      label_plural: '',
      pk: 'id',
      endpoint: '',
    })
  })
})
