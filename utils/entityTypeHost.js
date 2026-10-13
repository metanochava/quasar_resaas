// Which EntityType a host belongs to: the first label of the subdomain
// (saude.example.com -> "saude", www skipped) or, on an IP address, the first
// path segment (http://10.0.0.1/saude/). Shared by the header's services menu
// (components/header/HeaderServices.vue) and the site page at '/'.

export function isIpHost (host) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':')
}

export function entityTypeKey (location = window.location) {
  if (isIpHost(location.hostname)) {
    return location.pathname.split('/').filter(Boolean)[0] || ''
  }
  const parts = location.hostname.split('.')
  return (parts[0] === 'www' ? parts[1] : parts[0]) || ''
}

export function findEntityType (types, location = window.location) {
  const key = entityTypeKey(location).toLowerCase()
  if (!key) return null
  return (types || []).find(type => String(type?.name || '').toLowerCase() === key) || null
}

// The address of another EntityType's site on this same installation.
export function entityTypeUrl (type, location = window.location) {
  if (isIpHost(location.hostname)) {
    const target = new URL(location.href)
    target.pathname = `/${type.name}/`
    target.hash = ''
    return target.toString()
  }
  const parts = location.hostname.split('.')
  parts[0] = type.name.toLowerCase()
  const port = location.port ? `:${location.port}` : ''
  return `${location.protocol}//${parts.join('.')}${port}/`
}
