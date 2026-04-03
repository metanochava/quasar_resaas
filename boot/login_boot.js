import { useEntidadeStore } from "../stores/EntidadeStore"
import { useGrupoStore } from "../stores/GrupoStore"
import { useSucursalStore } from "../stores/SucursalStore"
import { useUserStore } from "../stores/UserStore"


export async function loadUserSaas () {

  const User = useUserStore()
  const Entidade = useEntidadeStore()
  const Grupo = useGrupoStore()
  const Sucursal = useSucursalStore()

  console.log(User.data?.id)
  await User.me()
  console.log(User.data?.id)

  const UserId = User.data?.id

  if (!UserId) return

  // Entidade
  await Entidade.getByUser(UserId)
  if (Entidade.linhas.length) {
    await Entidade.select(Entidade.linhas[0])
  }

  // Grupo
  await Grupo.getByUser(UserId)
  if (Grupo.linhas.length) {
    await Grupo.select(Grupo.linhas[0])
  }

  // Sucursal
  await Sucursal.getByUser(UserId)
  if (Sucursal.linhas.length) {
    Sucursal.select(Sucursal.linhas[0])
  }
}