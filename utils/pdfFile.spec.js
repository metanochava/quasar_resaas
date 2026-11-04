import { describe, it, expect, vi } from 'vitest'
import { fileNameFromDisposition, pdfBlobUrl, pdfFileName, forgetPdf } from './pdfFile.js'

describe('pdfFile', () => {
  it('prefers the UTF-8 name over the ASCII fallback', () => {
    const header = "inline; filename=\"AtestadoMedico-ElsaNhaca_2026-11-04.pdf\"; filename*=UTF-8''AtestadoM%C3%A9dico-ElsaNhaca_2026-11-04.pdf"

    expect(fileNameFromDisposition(header)).toBe('AtestadoMédico-ElsaNhaca_2026-11-04.pdf')
  })

  it('reads a plain filename and returns null without one', () => {
    expect(fileNameFromDisposition('attachment; filename="QR.pdf"')).toBe('QR.pdf')
    expect(fileNameFromDisposition('inline')).toBeNull()
    expect(fileNameFromDisposition(undefined)).toBeNull()
  })

  it('remembers the name of the blob URL it creates', () => {
    URL.createObjectURL = vi.fn(() => 'blob:pdf-1')

    const href = pdfBlobUrl({ data: new Uint8Array([37]), headers: { 'content-disposition': 'inline; filename="A.pdf"' } })

    expect(href).toBe('blob:pdf-1')
    expect(pdfFileName(href)).toBe('A.pdf')
    forgetPdf(href)
    expect(pdfFileName(href)).toBeNull()
  })
})
