// A PDF fetched as a blob opens from a blob: URL, and the browser's viewer
// can only name it after that URL (a random uuid). The server already names
// the file in Content-Disposition (django_resaas PDF(): the title without
// spaces plus the creation date), so the name is kept here next to the blob
// URL and used when the PDF is downloaded.

const names = new Map()

// RFC 6266: filename*=UTF-8''<percent-encoded> wins over filename="<ascii>".
export function fileNameFromDisposition(disposition) {
  const header = String(disposition || '')
  const extended = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)

  if (extended) {
    try {
      return decodeURIComponent(extended[1].trim().replace(/^"|"$/g, ''))
    } catch {
      // malformed encoding: fall back to the plain filename
    }
  }

  const plain = header.match(/filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;]+)/i)

  return plain ? (plain[1] || plain[2]).trim() : null
}

// The blob: URL of an axios blob response, remembering the server's file name.
export function pdfBlobUrl(response) {
  const href = URL.createObjectURL(new Blob([response?.data], { type: 'application/pdf' }))
  const headers = response?.headers || {}
  const disposition = typeof headers.get === 'function'
    ? headers.get('content-disposition')
    : headers['content-disposition']
  const name = fileNameFromDisposition(disposition)

  if (name) names.set(href, name)

  return href
}

export function pdfFileName(href) {
  return names.get(href) || null
}

export function forgetPdf(href) {
  names.delete(href)
}
