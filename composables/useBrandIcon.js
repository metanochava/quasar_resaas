import { computed, watch, onBeforeUnmount } from 'vue'

import { useUserStore } from '../stores/UserStore'
import { url } from '../services/api'

// The brand icon of the browser tab, chosen like the header brand
// (components/header/HeaderBrand.vue): the logo of the active Entity, or -
// before an Entity is chosen, or when it has no logo - the icon of its
// EntityType (Saude, Farmacia, ...). The EntityType icon is the square PNG
// the backend already serves for the installable app:
//   GET django_resaas/entitytypes/{id}/app_icon/?size=192   (PUBLIC read)

export const ENTITY_TYPE_ICON_SIZE = 192

export function entityTypeIdOf (User) {
  const ref = User?.Entity?.entity_type
  const fromEntity = ref && typeof ref === 'object' ? (ref.id || ref.value) : ref
  return fromEntity || User?.EntityType?.id || null
}

export function entityTypeIconUrl (id, size = ENTITY_TYPE_ICON_SIZE) {
  if (!id) return null
  return url({ type: 'u', url: `django_resaas/entitytypes/${id}/app_icon/`, params: { size } })
}

export function brandIconUrl (User) {
  if (User?.Entity?.id && User.Entity.logo?.url) return User.Entity.logo.url
  return entityTypeIconUrl(entityTypeIdOf(User))
}

export function useBrandIcon () {
  const User = useUserStore()
  const iconUrl = computed(() => brandIconUrl(User))
  return { iconUrl }
}

// Points the <link rel="icon"> tags at `href`. The tags of index.html are
// kept and restored with `null` (no brand, or the caller unmounted).
export function setFavicon (href, doc = document) {
  const links = [...doc.querySelectorAll('link[rel~="icon"]')]

  links.forEach(link => {
    if (link.dataset.resaasOriginalHref === undefined) {
      link.dataset.resaasOriginalHref = link.getAttribute('href') || ''
      link.dataset.resaasOriginalType = link.getAttribute('type') || ''
    }
    const target = href || link.dataset.resaasOriginalHref
    if (link.getAttribute('href') !== target) link.setAttribute('href', target)
    // a logo may be PNG, JPEG, SVG...: let the browser sniff it; the original
    // type comes back with the original href
    const type = href ? '' : link.dataset.resaasOriginalType
    if (type) link.setAttribute('type', type)
    else link.removeAttribute('type')
  })

  if (!links.length && href) {
    const link = doc.createElement('link')
    link.rel = 'icon'
    link.href = href
    link.dataset.resaasOriginalHref = ''
    doc.head.appendChild(link)
  }
}

export function useBrandFavicon () {
  const { iconUrl } = useBrandIcon()

  watch(iconUrl, href => setFavicon(href), { immediate: true })
  onBeforeUnmount(() => setFavicon(null))

  return { iconUrl }
}
