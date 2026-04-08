import { useEntidadeStore } from "../stores/EntidadeStore"
import { useUserStore } from "../stores/UserStore"


export async function loadUserSaas (q) {

  const User = useUserStore()
  const Entidade = useEntidadeStore()

  await User.me()

  if (!User.data?.id) return

  await Entidade.getUserEntidades_(User.data?.id, q)
 
}