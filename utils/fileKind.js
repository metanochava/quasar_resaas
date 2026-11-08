// What the browser can show of a stored file, for the file preview
// (components/engine/FilePreviewCard.vue, s-file-preview). Accepts the
// shapes the API returns:
//   - a lab result / explorer item: {file: <url or {url, mime_type, name}>, mime_type, extensao, nome}
//   - a document file (DocumentFileSerializer): {name, arquivo: {url, name, mime_type, ext}}
//   - a plain file representation: {url, name, mime_type}

const IMAGE = /^(png|jpe?g|gif|webp|bmp|svg|avif)$/
const VIDEO = /^(mp4|webm|ogv|mov)$/
const AUDIO = /^(mp3|wav|ogg|oga|m4a|aac)$/
const TEXT = /^(txt|csv|json|xml|log|md)$/

function stored (item) {
  return item?.file ?? item?.arquivo ?? (item?.url ? item : null)
}

export function fileUrl (item) {
  const value = stored(item)
  const raw = typeof value === 'string' ? value : value?.url
  // https page: never load an http file (mixed content is blocked)
  return raw && window.location.protocol === 'https:' ? raw.replace(/^http:\/\//, 'https://') : raw || null
}

// the name the user gave (nome / name) before the stored one (a generated uuid)
export function fileName (item) {
  const value = stored(item)
  return item?.nome || item?.filename || item?.name || (typeof value === 'object' ? value?.name : '') || ''
}

export function fileExtension (item) {
  const value = stored(item)
  const name = fileName(item)
  const ext = item?.extensao || (typeof value === 'object' ? value?.ext : '') || (name.includes('.') ? name.split('.').pop() : '')
  return String(ext || '').replace(/^\./, '').toLowerCase()
}

// 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'other' | 'none' (no file)
export function fileKind (item) {
  if (!fileUrl(item)) return 'none'
  const value = stored(item)
  const mime = String(item?.mime_type || (typeof value === 'object' ? value?.mime_type : '') || '').toLowerCase()
  const ext = fileExtension(item)
  if (mime.startsWith('image/') || IMAGE.test(ext)) return 'image'
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (mime.startsWith('video/') || VIDEO.test(ext)) return 'video'
  if (mime.startsWith('audio/') || AUDIO.test(ext)) return 'audio'
  if (mime.startsWith('text/') || TEXT.test(ext)) return 'text'
  return 'other'
}

export const KIND_ICONS = { image: 'image', pdf: 'picture_as_pdf', video: 'movie', audio: 'audiotrack', text: 'description' }
