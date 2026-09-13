import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const httpGet = vi.fn()
const httpPost = vi.fn()

vi.mock('../services/api', () => ({
  url: ({ url, params }) => {
    const query = new URLSearchParams()
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      query.append(key, value)
    })
    const qs = query.toString()
    return qs ? `${url}?${qs}` : url
  },
  HTTPAuth: {
    get: (...args) => httpGet(...args),
    post: (...args) => httpPost(...args),
  },
}))

const { useScaffoldIDEStore } = await import('./ScaffoldIDEStore')

beforeEach(() => {
  setActivePinia(createPinia())
  httpGet.mockReset()
  httpPost.mockReset()
})

describe('ScaffoldIDEStore.openFile / setContent / discardFile', () => {
  it('opens a file as not dirty, and marks it dirty only once content actually changes', async () => {
    httpGet.mockResolvedValueOnce({
      data: { path: 'models/x.py', content: 'x = 1\n', hash: 'abc', mtime: 1 },
    })

    const ide = useScaffoldIDEStore()
    const file = await ide.openFile('hr', 'models/x.py')

    expect(file.dirty).toBe(false)
    expect(ide.activeFilePath).toBe('models/x.py')

    ide.setContent('models/x.py', 'x = 2\n')
    expect(ide.activeFile.dirty).toBe(true)

    ide.discardFile('models/x.py')
    expect(ide.activeFile.dirty).toBe(false)
    expect(ide.activeFile.currentContent).toBe('x = 1\n')
  })

  it('opening the same file twice reuses the existing tab instead of duplicating it', async () => {
    httpGet.mockResolvedValue({
      data: { path: 'models/x.py', content: 'x = 1\n', hash: 'abc', mtime: 1 },
    })

    const ide = useScaffoldIDEStore()
    await ide.openFile('hr', 'models/x.py')
    await ide.openFile('hr', 'models/x.py')

    expect(ide.openFiles.length).toBe(1)
  })

  it('closeFile falls back the active tab to the last remaining open file', async () => {
    httpGet
      .mockResolvedValueOnce({ data: { path: 'a.py', content: 'a', hash: '1' } })
      .mockResolvedValueOnce({ data: { path: 'b.py', content: 'b', hash: '2' } })

    const ide = useScaffoldIDEStore()
    await ide.openFile('hr', 'a.py')
    await ide.openFile('hr', 'b.py')

    ide.closeFile('b.py')

    expect(ide.activeFilePath).toBe('a.py')
  })
})

describe('ScaffoldIDEStore.problems / errorCount', () => {
  it('flattens errors/warnings from every open file, each carrying its own path', async () => {
    httpGet.mockResolvedValueOnce({ data: { path: 'a.py', content: 'a', hash: '1' } })

    const ide = useScaffoldIDEStore()
    await ide.openFile('hr', 'a.py')

    ide.activeFile.validation = {
      valid: false,
      errors: [{ message: 'bad', line: 3, severity: 'error' }],
      warnings: [{ message: 'meh', severity: 'warning' }],
    }

    expect(ide.problems).toHaveLength(2)
    expect(ide.problems[0]).toMatchObject({ path: 'a.py', severity: 'error' })
    expect(ide.errorCount).toBe(1)
  })
})

describe('ScaffoldIDEStore.saveFile', () => {
  it('on success, resets dirty and adopts the new hash', async () => {
    httpGet.mockResolvedValueOnce({ data: { path: 'a.py', content: 'old', hash: 'h1' } })
    httpPost.mockResolvedValueOnce({ data: { path: 'a.py', hash: 'h2', mtime: 2, validation: { valid: true, errors: [], warnings: [] } } })

    const ide = useScaffoldIDEStore()
    await ide.openFile('hr', 'a.py')
    ide.setContent('a.py', 'new')

    const result = await ide.saveFile('a.py')

    expect(result.ok).toBe(true)
    expect(ide.activeFile.dirty).toBe(false)
    expect(ide.activeFile.hash).toBe('h2')
    expect(ide.activeFile.originalContent).toBe('new')
  })

  it('on a 422 validation failure, keeps the file dirty and records the validation result', async () => {
    httpGet.mockResolvedValueOnce({ data: { path: 'a.py', content: 'old', hash: 'h1' } })
    httpPost.mockRejectedValueOnce({
      response: { status: 422, data: { validation: { valid: false, errors: [{ message: 'bad' }], warnings: [] } } },
    })

    const ide = useScaffoldIDEStore()
    await ide.openFile('hr', 'a.py')
    ide.setContent('a.py', 'def broken(')

    const result = await ide.saveFile('a.py')

    expect(result.ok).toBe(false)
    expect(ide.activeFile.dirty).toBe(true)
    expect(ide.activeFile.validation.valid).toBe(false)
  })

  it('on a 409 conflict, never overwrites the local dirty content', async () => {
    httpGet.mockResolvedValueOnce({ data: { path: 'a.py', content: 'old', hash: 'h1' } })
    httpPost.mockRejectedValueOnce({ response: { status: 409, data: { current_hash: 'h-changed' } } })

    const ide = useScaffoldIDEStore()
    await ide.openFile('hr', 'a.py')
    ide.setContent('a.py', 'my edit')

    const result = await ide.saveFile('a.py')

    expect(result.ok).toBe(false)
    expect(ide.activeFile.currentContent).toBe('my edit')
    expect(ide.activeFile.dirty).toBe(true)
  })
})

describe('ScaffoldIDEStore.openGeneratedFile', () => {
  it('opens a not-yet-saved file as dirty from the very first render', () => {
    const ide = useScaffoldIDEStore()
    const file = ide.openGeneratedFile('hr', 'models/new.py', 'class New:\n    pass\n')

    expect(file.dirty).toBe(true)
    expect(file.hash).toBeNull()
    expect(ide.activeFilePath).toBe('models/new.py')
  })
})
