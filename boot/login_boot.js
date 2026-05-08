import { useEntityStore } from "../stores/EntityStore"
import { useUserStore } from "../stores/UserStore"


export async function loadUserSaas (q) {

  const User = useUserStore()
  const Entity = useEntityStore()

  await User.me()

  if (!User.data?.id) return

  await Entity.getUserEntitys_(User.data?.id, q)
 
}