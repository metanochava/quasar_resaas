export default boot(async () => {
  const user = useUserStore()
  const entidade = useEntidadeStore()
  const grupo = useGrupoStore()
  const sucursal = useSucursalStore()

  await user.me()

  const userId = user.data?.id
  if (!userId) return

  // ENTIDADE
  await entidade.getByUser(userId)
  if (entidade.linhas.length) {
    await entidade.select(entidade.linhas[0])
  }

  // GRUPO
  await grupo.getByUser(userId)
  if (grupo.linhas.length) {
    await grupo.select(grupo.linhas[0])
  }

  // SUCURSAL
  await sucursal.getByUser(userId)
  if (sucursal.linhas.length) {
    sucursal.select(sucursal.linhas[0])
  }
})