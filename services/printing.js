// Printing (django_resaas core/printing): the documents the current profile
// may print, the Branch's printers and the paper formats - and printing one.
//
// The paper a document comes out on: the one asked, else this device's
// choice ("remember on this device"), else the Branch's default printer for
// that document, else the document's default. The browser's print dialog
// then sends it to the physical printer (a web page cannot pick one itself).
import { HTTPAuth, HTTPAuthBlob, url } from './api'
import { getStorage, setStorage, deleteStorage } from './storage'
import { shared, forgetShared } from '../utils/sharedRequest'

const DEVICE_KEY = code => `resaasPrint:${code}`

export async function loadPrinting () {
  const { data } = await shared('printing', () => HTTPAuth.get(url({ type: 'u', url: 'printing/documents/' })), { ttl: 60000 })
  return { documents: data?.documents || [], printers: data?.printers || [], formats: data?.formats || [] }
}

export function forgetPrinting () {
  forgetShared('printing')
}

export function deviceChoice (code) {
  try {
    return JSON.parse(getStorage('l', DEVICE_KEY(code)) || 'null')
  } catch {
    return null
  }
}

export function rememberChoice (code, choice) {
  if (choice) setStorage('l', DEVICE_KEY(code), JSON.stringify(choice))
  else deleteStorage('l', DEVICE_KEY(code))
}

// the paper for `document` (a row of loadPrinting().documents)
export function paperFor (document, { paper = null } = {}) {
  const device = deviceChoice(document.code)
  const candidates = [paper, device?.paper, document.printer?.paper_format, document.default_format]
  return candidates.find(code => code && document.formats.includes(code)) || document.formats[0]
}

export function pdfUrl (code, objectId, paper) {
  return url({ type: 'u', url: `printing/${code}/${objectId}/pdf/`, params: paper ? { paper } : {} })
}

// the PDF in a hidden frame, then the browser's print dialog
function printBlob (blob) {
  const objectUrl = URL.createObjectURL(blob)
  const frame = document.createElement('iframe')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  frame.src = objectUrl
  frame.onload = () => {
    try {
      frame.contentWindow.focus()
      frame.contentWindow.print()
    } catch {
      window.open(objectUrl, '_blank')
    }
  }
  document.body.appendChild(frame)
  setTimeout(() => { frame.remove(); URL.revokeObjectURL(objectUrl) }, 60000)
}

// The PDF of `code` for `objectId` on `paper` (else the chosen one), for the
// print dialog's preview: { blob, paper, document }.
export async function documentPdf (code, objectId, { paper = null } = {}) {
  const { documents } = await loadPrinting()
  const document_ = documents.find(row => row.code === code)
  if (!document_) throw new Error(`printing: ${code} is not available`)
  const chosen = paperFor(document_, { paper })
  const response = await HTTPAuthBlob.get(pdfUrl(code, objectId, chosen))
  const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/pdf' })
  return { blob, paper: chosen, document: document_ }
}

// Prints `code` for `objectId`; returns the paper used. Throws when the
// document cannot be printed here (no permission, unknown) or the request fails.
export async function printDocument (code, objectId, { paper = null } = {}) {
  const { documents } = await loadPrinting()
  const document_ = documents.find(row => row.code === code)
  if (!document_) throw new Error(`printing: ${code} is not available`)
  const chosen = paperFor(document_, { paper })
  const response = await HTTPAuthBlob.get(pdfUrl(code, objectId, chosen))
  printBlob(response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/pdf' }))
  return chosen
}
