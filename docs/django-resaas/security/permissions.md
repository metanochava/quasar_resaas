# Permissões

O backend é a autoridade final para autorização.

## Processo

1. Identificar a action da view.
2. Converter a action num prefixo de permissão.
3. Obter o nome técnico do model.
4. Construir o codename.
5. Verificar com `isPermited()`.

Exemplo:

```text
create + patient -> add_patient
update + patient -> change_patient
destroy + patient -> delete_patient
```

## Cache

Uma cache por pedido evita verificações repetidas do mesmo codename durante o mesmo pedido.

## Perfis-modelo (`group_creator`)

Os módulos trazem perfis por omissão (Groups com um conjunto de permissões) através de
`saas/core/utils/group_creator.py`, chamado no seu `post_migrate` (ex.: `saude/apps.py` com
`saude/profiles.py`):

```python
report = group_creator([{"name": "Registered Nurse", "permissions": ["view_paciente", "add_dadovital"]}],
                       rename_from={"Registered Nurse": "Enfermeiro"})
```

- **Idempotente e aditivo.** Um Group que já existe (pelo nome) é reutilizado, nunca duplicado; `rename_from`
  renomeia um nome antigo no lugar (mesmo `id`, relações mantidas). As permissões por omissão são
  **acrescentadas**; as que um administrador juntou nunca são retiradas.
- **Só codenames reais.** Um codename que não existe **não é criado nem atribuído**. Fica registado num aviso
  e listado no relatório devolvido (`permissions_missing`). O relatório tem também `groups_created`,
  `groups_reused`, `groups_renamed`, `permissions_assigned` e `permissions_already_assigned` por perfil.
- **Ordem.** As permissões que o próprio módulo cria (ex.: de dashboards) têm de existir antes do seed dos
  perfis: ligar esse receiver de `post_migrate` primeiro.
- Os perfis são **Groups globais** ligados ao EntityType como modelos (ver *Gestão das permissões de grupo*):
  alterar as suas permissões é uma operação de nível plataforma.

## Gestão das permissões de grupo

Os registos `Group` são **globais**: o mesmo grupo (ex.: o `Admin` do bootstrap) pode estar ligado a
várias Entities (`EntityGroup`) e ser modelo de um EntityType (`EntityTypeGroup`). Alterar as
permissões de um grupo altera-as em todos os sítios onde está ligado. Por isso
`POST auth/permissions/setGroupPermissions/` (`PermissionAPIView`, corpo
`{"group": <id>, "permissions": [<id>, ...]}`, substitui a lista inteira) é **PROTEGIDO** e verifica,
por esta ordem:

1. `change_group` no contexto assinado actual, senão `403 permission_denied`.
2. Sem `change_entitytype` (nível plataforma, que por omissão só o **Root** tem), o grupo tem de:
   - pertencer à Entity actual (`EntityGroup`), senão `404 group_not_in_entity`. Um grupo de outra
     Entity não é revelado.
   - ser `editable`, senão `403 group_not_editable`. Só um grupo que uma Entity cria para si
     (`EntityAPIView.createGroup`) tem `editable=True`. Os grupos do bootstrap e os grupos-modelo
     não têm, e o cliente não pode mudar a marca (só de leitura no `GroupSerializer`).
     Os grupos que já existiam podem ser marcados com `manage.py mark_editable_groups`
     (simulação por omissão).
   - não ser partilhado com outra Entity nem ser grupo-modelo de um EntityType, senão
     `403 group_shared`.
3. **Sem escalada por delegação.** Todas as permissões que o pedido acrescenta **ou retira** têm de
   estar no grupo activo de quem faz o pedido, senão `403 permission_not_held` com
   `error.details.permissions` (ids). As permissões que a lista mantém sem alteração não são
   verificadas, porque o ecrã reenvia a lista inteira.

A alteração corre numa transacção com a linha do grupo bloqueada. A excepção do Root vem da
**permissão** `change_entitytype`, nunca do nome do grupo.

O catálogo de permissões (`auth/permissions/`) pode ser listado por qualquer utilizador autenticado.
Criar, alterar ou apagar um `Permission` exige `add_permission` / `change_permission` /
`delete_permission`.

Os perfis de um utilizador na Branch actual gerem-se em `users/{id}/addGroup/` e `removeGroup/`
(`UserAPIView`, com verificação de permissão e de tenant).

### Os próprios grupos (`auth/groups/`)

O `GroupAPIView` aplica as mesmas regras (`saas/core/services/group_access_service.py`). Cada acção
exige a sua permissão no contexto actual. Uma acção sem permissão mapeada é recusada.

| Acção | Permissão | Âmbito |
|---|---|---|
| `GET auth/groups/` | `list_group` | os grupos da Entity actual (todos, ao nível plataforma) |
| `GET auth/groups/{id}/`, `{id}/permissions/` | `view_group` | idem; grupo de outra Entity → `404` |
| `POST auth/groups/` | `add_group` | sem nível plataforma, o grupo novo fica ligado à Entity actual e às suas Branches e com `editable=True` |
| `PUT/PATCH auth/groups/{id}/` | `change_group` | grupo alterável (regra 2 acima) |
| `DELETE auth/groups/{id}/` | `delete_group` | grupo alterável; nunca o grupo activo de quem pede (`400 cannot_delete_active_group`) |
| `POST {id}/addPermission/` | `change_group` | grupo alterável. Um codename que já existe fora do content type `custom` → `409 permission_codename_exists` (a autorização compara codenames, por isso daria a capacidade real). Criar uma permissão custom nova exige `add_permission`; juntar uma custom já existente é uma atribuição (regra 3). |
| `POST {id}/removePermission/` | `change_group` | grupo alterável; retirar exige ter a permissão (regra 3) |

### Viewsets antigas: permissões por acção (`ActionPermissionMixin`)

O `ExplicitAccessMixin` só decide quem **chega** a um `ModelViewSet` simples
(autenticado, ou público para acções seguras listadas). O `ActionPermissionMixin`
(`saas/core/base/access.py`) acrescenta o que o `BaseAPIView` faz: cada acção exige a
sua permissão no contexto assinado, e uma acção não declarada é recusada (`403
permission_denied`). As acções em `membership_actions` não exigem permissão, e o
`get_queryset` da view tem de as limitar aos objectos do próprio utilizador.
`is_membership_request()` pode decidir isto por pedido.

| View | Sem permissão (pertença) | Tudo o resto |
|---|---|---|
| `EntityAPIView` (`django_resaas/entitys/`) | as Entities do próprio utilizador: lista, detalhe, branches, apps/modelos activos, leituras de branding; `create` (registo self-service de uma Entity **nova**) | a sua permissão (`change_entity`, `add_entityuser`, `add_entitygroup`, ...) **e** só na Entity do contexto assinado (outra dá `404`), excepto ao nível plataforma (`change_entitytype`) |
| `EntityTypeAPIView` (`django_resaas/entitytypes/`) | leituras de branding (públicas); o **próprio** EntityType: detalhe, apps, modelos, grupos, permissões; `user_entitys` (só as Entities próprias) | leituras de outros tipos e listas que atravessam tenants (`entitys`, `branches_map`) exigem `view_entitytype`; todas as escritas são de nível plataforma |

O `EntityAPIView.addGroup` só liga um grupo que seja modelo do EntityType da própria
Entity (senão `403 group_not_in_entity_type`, excepto ao nível plataforma). Ligar
qualquer grupo, por exemplo o Root, permitiria aos administradores da Entity
atribuí-lo através de `users/{id}/addGroup/`.

### Endpoints de deploy (`deploy/*`)

**PÚBLICOS por desenho** (webhook do GitHub / operações), autenticados por um token
partilhado: cabeçalho `X-Deploy-Token` (preferido) ou `?token=` (mantido para os
webhooks existentes), comparado em tempo constante. **Não há token por omissão**: sem
`settings.DEPLOY_TOKEN` todas as chamadas são recusadas. `deploy/github/` e
`deploy/rollback/` alteram o servidor e são **só POST** (`405` em GET).

### Endpoints removidos

Estes endpoints foram removidos porque actuavam sobre qualquer tenant sem verificar permissões, e
nenhum consumidor os usava:

| Removido | Usar em vez disso |
|---|---|
| `POST auth/permissions/{id}/addToGroup/`, `removeFromGroup/` | `setGroupPermissions/` |
| `POST auth/permissions/{id}/addToUser/`, `removeFromUser/` | `POST django_resaas/users/{id}/addGroup/`, `removeGroup/` |
| `GET django_resaas/resaasapps/{app}/{model}/data/` | o `BaseAPIView` do próprio model (âmbito de tenant, permissões de acção e de campo) |

Testes: `src/django_resaas/saas/tests/test_permission_api_security.py`, `test_group_api_security.py`.

## Permissões por campo

Um model pode também proteger campos individuais (ex.: `Contract.salary`) com permissões próprias
de `view`/`change`, por cima da permissão da action - ver
[Field-level permissions](field-permissions.md).

## Módulo

Além da própria permissão, a aplicação verifica se o módulo correspondente está ativo para a
entidade (ver [`../api/base-api-view.md`](../api/base-api-view.md)).

## Permissões de actions personalizadas e ownership

Métodos `@resaas_action` ganham a sua própria `Permission`, sincronizada pelo `ActionSyncService`
para dentro de `ModelExtraAction`. Dois campos decidem o que o mecanismo de sincronização pode e
não pode tocar:

- **`managed_by`** (`"decorator"` ou `"manual"`, por omissão `"manual"`) — identifica *quem* é
  dono de uma linha `ModelExtraAction`. O `ActionSyncService` escreve sempre `managed_by="decorator"`
  para linhas que cria/atualiza a partir de um `@resaas_action`. Uma linha criada de qualquer outra
  forma (admin, migração de dados, diretamente na shell) fica por omissão `"manual"` e passa então
  a estar **fora do alcance do decorator**: se um `@resaas_action` for declarado com a mesma
  identidade `app`/`model`/`action` de uma linha `managed_by="manual"` já existente, sincronizar
  levanta `ImproperlyConfigured` em vez de a tomar silenciosamente. Para entregar uma action manual
  ao decorator de propósito, definir `managed_by="decorator"` nessa linha primeiro.
- **`permission_managed`** (booleano, por omissão `False`) — se a *própria Permission* (não só a
  linha `ModelExtraAction`) foi criada pelo RESAAS e é por isso segura para apagar automaticamente
  assim que a sua action ficar órfã (removida do código). Uma `Permission` já existente (criada
  por um humano, ex. via admin) é detetada no momento da sincronização e marcada
  `permission_managed=False`, pelo que a limpeza de órfãos remove a linha `ModelExtraAction` mas
  **nunca** a `Permission`. Uma `Permission` criada via um `@resaas_action(permission=...)`
  explícito (pensada para ser partilhada/reutilizada entre actions) também nunca é apagada na
  limpeza, e o seu `.name` nunca é renomeado automaticamente — só uma permissão que segue a
  convenção por omissão `{action}_{model}` tem o `.name` mantido em sincronia com o label/model da
  action automaticamente.

> [!NOTE]
> A remoção de órfãos só acontece em `ActionSyncService.sync_registry()` (o ponto de entrada
> do sinal `post_migrate` / `manage.py sync_actions`), que agrega as actions declaradas por
> todas as views registadas *antes* de decidir o que já não existe em lado nenhum do código.
> Chamar `sync_view()` diretamente numa única view só faz upsert — nunca apaga, já que uma
> view não tem forma de saber se uma view irmã do mesmo model ainda declara uma action que
> ela própria não vê. Ver `src/django_resaas/tests/test_permissions.py` e
> `test_action_sync.py` para o comportamento exato e testado.
