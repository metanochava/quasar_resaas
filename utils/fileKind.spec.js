import { describe, it, expect } from 'vitest'
import { fileUrl, fileName, fileKind } from './fileKind'

describe('fileKind - the stored file shapes', () => {
  it('a lab result / explorer item', () => {
    const item = { nome: 'hemograma.pdf', file: { url: 'http://x/a', mime_type: 'application/pdf' } }
    expect([fileUrl(item), fileName(item), fileKind(item)]).toEqual(['http://x/a', 'hemograma.pdf', 'pdf'])
  })

  it('a document file (DocumentFileSerializer)', () => {
    const item = { id: 'f1', name: 'frente.png', arquivo: { url: 'http://x/f.png', name: 'uuid.png', ext: 'png', mime_type: 'image/png' } }
    expect([fileUrl(item), fileName(item), fileKind(item)]).toEqual(['http://x/f.png', 'frente.png', 'image'])
  })

  it('no file', () => {
    expect(fileKind({ name: 'x', arquivo: null })).toBe('none')
  })
})
