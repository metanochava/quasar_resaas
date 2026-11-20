import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./api', () => ({
  HTTPAuth: { get: vi.fn() },
  HTTPAuthBlob: { get: vi.fn() },
  url: ({ url, params }) => ({ url, params })
}))

const { HTTPAuth, HTTPAuthBlob } = await import('./api')
const { loadPrinting, paperFor, rememberChoice, printDocument, forgetPrinting } = await import('./printing')

const RECEIPT = { code: 'sales.receipt', label: 'Receipt', formats: ['thermal_80', 'a4'], default_format: 'thermal_80', printer: null }

beforeEach(() => {
  // jsdom cannot load a blob: in a frame
  URL.createObjectURL = vi.fn(() => 'about:blank')
  URL.revokeObjectURL = vi.fn()
  localStorage.clear()
  vi.clearAllMocks()
  forgetPrinting()
  HTTPAuth.get.mockResolvedValue({ data: { documents: [RECEIPT], printers: [], formats: [] } })
  HTTPAuthBlob.get.mockResolvedValue({ data: new Blob(['%PDF'], { type: 'application/pdf' }) })
})

describe('printing', () => {
  it('the paper: asked > this device > the Branch printer > the document default', () => {
    expect(paperFor(RECEIPT)).toBe('thermal_80')
    expect(paperFor({ ...RECEIPT, printer: { paper_format: 'a4' } })).toBe('a4')
    rememberChoice('sales.receipt', { paper: 'thermal_80' })
    expect(paperFor({ ...RECEIPT, printer: { paper_format: 'a4' } })).toBe('thermal_80')
    expect(paperFor(RECEIPT, { paper: 'a4' })).toBe('a4')
    // a paper the document does not support is never used
    expect(paperFor(RECEIPT, { paper: 'a6' })).toBe('thermal_80')
  })

  it('one request for the documents, kept for a minute', async () => {
    await loadPrinting()
    await loadPrinting()
    expect(HTTPAuth.get).toHaveBeenCalledTimes(1)
  })

  it('prints the PDF of the chosen paper in a hidden frame', async () => {
    const paper = await printDocument('sales.receipt', 's1', { paper: 'a4' })

    expect(paper).toBe('a4')
    expect(HTTPAuthBlob.get.mock.calls[0][0]).toEqual({ url: 'printing/sales.receipt/s1/pdf/', params: { paper: 'a4' } })
    expect(document.querySelector('iframe')).not.toBeNull()
  })

  it('a document this profile cannot print fails without asking for the PDF', async () => {
    await expect(printDocument('sales.unknown', 's1')).rejects.toThrow()
    expect(HTTPAuthBlob.get).not.toHaveBeenCalled()
  })
})
