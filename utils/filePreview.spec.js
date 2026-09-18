import { describe, it, expect, vi } from 'vitest'
import { resolvePreview } from './filePreview'

describe('resolvePreview', () => {
  it('returns null for an empty value', () => {
    expect(resolvePreview(null)).toBeNull()
    expect(resolvePreview(undefined)).toBeNull()
  })

  it('a freshly-picked image File resolves to a blob-backed image preview', () => {
    URL.createObjectURL = vi.fn(() => 'blob:fake-url')

    const file = new File(['data'], 'photo.png', { type: 'image/png' })
    const preview = resolvePreview(file)

    expect(preview).toEqual({ type: 'image', src: 'blob:fake-url', name: 'photo.png', isBlobUrl: true })
  })

  it('a freshly-picked PDF File resolves to a pdf preview with no src (no thumbnail to render)', () => {
    const file = new File(['data'], 'report.pdf', { type: 'application/pdf' })
    expect(resolvePreview(file)).toEqual({ type: 'pdf', name: 'report.pdf' })
  })

  it('a freshly-picked non-image, non-pdf File resolves to a generic file preview', () => {
    const file = new File(['data'], 'notes.txt', { type: 'text/plain' })
    expect(resolvePreview(file)).toEqual({ type: 'file', name: 'notes.txt' })
  })

  it('an already-uploaded backend value ({url, mime_type}) previews from its own url, never createObjectURL', () => {
    const backendValue = { url: 'https://cdn.example.com/photo.png', mime_type: 'image/png', name: 'photo.png' }
    expect(resolvePreview(backendValue)).toEqual({ type: 'image', src: backendValue.url, name: 'photo.png' })
  })

  it('rewrites a plain http image url to https, avoiding a mixed-content-blocked <img>', () => {
    const backendValue = { url: 'http://cdn.example.com/photo.png', mime_type: 'image/png', name: 'photo.png' }
    expect(resolvePreview(backendValue).src).toBe('https://cdn.example.com/photo.png')
  })

  it('an already-uploaded backend pdf/file value previews by mime_type too', () => {
    expect(resolvePreview({ url: 'https://x/doc.pdf', mime_type: 'application/pdf', name: 'doc.pdf' }))
      .toEqual({ type: 'pdf', name: 'doc.pdf' })

    expect(resolvePreview({ url: 'https://x/data.csv', mime_type: 'text/csv', name: 'data.csv' }))
      .toEqual({ type: 'file', name: 'data.csv' })
  })
})
