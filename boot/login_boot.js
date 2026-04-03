import { useEntidadeStore } from "../stores/EntidadeStore"
import { useGrupoStore } from "../stores/GrupoStore"
import { useSucursalStore } from "../stores/SucursalStore"
import { useUserStore } from "../stores/UserStore"


export async function loadUserSaas (q) {

  const User = useUserStore()
  const Entidade = useEntidadeStore()
  const Sucursal = useSucursalStore()
  const Grupo = useGrupoStore()

  await User.me()


  if (!User.data?.id) return

  // Entidade
  await Entidade.getUserEntidades_(User.data?.id)
  // if (Entidade.Logeds.length) {
  //   await Entidade.select(Entidade.Logeds[0])
  // }

  // // Sucursal
  // await Sucursal.getByUser(User.data?.id)
  // if (Sucursal.linhas.length) {
  //   Sucursal.select(Sucursal.linhas[0])
  // }

  //   // Grupo
  // await Grupo.getByUser(User.data?.id)
  // if (Grupo.linhas.length) {
  //   await Grupo.select(Grupo.linhas[0])
  // }
}