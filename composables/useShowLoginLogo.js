import { computed } from 'vue'

import { useUserStore } from '../stores/UserStore'
import { useEntityStore } from '../stores/EntityStore'
import { useEntityTypeStore } from '../stores/EntityTypeStore'

// Shared by every auth-flow page (login/register/forgot-password/reset) so
// they all respect the same Entity/EntityType "display_logo_login" toggle
// FormLogin.vue already implements - see that file for the original.
export function useShowLoginLogo () {
  const User = useUserStore()
  const Entity = useEntityStore()
  const EntityType = useEntityTypeStore()

  const currentEntity = computed(() => Entity?.row || null)

  const currentEntityType = computed(() => {
    if (EntityType?.row) return EntityType.row

    if (
      currentEntity.value?.entity_type &&
      typeof currentEntity.value.entity_type === 'object'
    ) {
      return currentEntity.value.entity_type
    }

    return null
  })

  const showLoginLogo = computed(() => {
    const entityValue = currentEntity.value?.display_logo_login
    if (entityValue !== null && entityValue !== undefined) return Boolean(entityValue)

    const entityTypeValue = currentEntityType.value?.display_logo_login
    if (entityTypeValue !== null && entityTypeValue !== undefined) return Boolean(entityTypeValue)

    return true
  })

  return { User, showLoginLogo }
}
