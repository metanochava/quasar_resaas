// A previously-uploaded value comes back from the backend as a plain
// object with `.url`/`.mime_type`/`.name` (RESAAS file/image field
// representation) - a value the user just picked in THIS session is a
// real File instance instead, with no `.url` yet (only createObjectURL
// can preview it). Shared by UploadComponent.vue (s-file) so
// every place a file field renders previews the exact same way.
export function resolvePreview(value) {
  if (!value) return null

  if (value instanceof File) {
    if (value.type.startsWith('image/')) {
      return { type: 'image', src: URL.createObjectURL(value), name: value.name, isBlobUrl: true }
    }
    if (value.type === 'application/pdf') {
      return { type: 'pdf', name: value.name }
    }
    return { type: 'file', name: value.name }
  }

  if (typeof value === 'object' && value.url) {
    const mime = value.mime_type || ''

    if (mime.startsWith('image/')) {
      // Avoids a mixed-content-blocked <img> when the page itself is
      // https but the stored url predates that (or the storage backend
      // still hands back a plain http one) - same rewrite
      // FormComponent.vue's own former getPreview() already did before
      // this consolidated it. Only the image case ever renders a real
      // <img src>; pdf/file just show an icon + filename, so there's no
      // equivalent mixed-content risk to guard there.
      return { type: 'image', src: value.url.replace('http://', 'https://'), name: value.name || '' }
    }
    if (mime === 'application/pdf') {
      return { type: 'pdf', name: value.name || '' }
    }
    return { type: 'file', name: value.name || '' }
  }

  return null
}
