import { describe, it, expect } from 'vitest'
import { appendDocumentFiles } from './DocumentStore'

// one multipart request for a registration: every file of every document
// under its own key, listed by the document in _file_keys
describe('appendDocumentFiles', () => {
  it('appends each file and names its keys on the document', () => {
    const fd = new FormData()
    const [a, b, c] = [new File(['a'], 'a.png'), new File(['b'], 'b.png'), new File(['c'], 'c.png')]

    const docs = appendDocumentFiles(fd, [
      { tipo: 't', numero: '1', arquivos: [a, b] },
      { tipo: 't', numero: '2', arquivo: c },
      { tipo: 't', numero: '3' },
    ])

    expect(docs.map(d => d._file_keys)).toEqual([
      ['document_file_0_0', 'document_file_0_1'], ['document_file_1_0'], [],
    ])
    expect(fd.get('document_file_0_1')).toBe(b)
    expect(docs[0]).not.toHaveProperty('arquivos')
  })
})
