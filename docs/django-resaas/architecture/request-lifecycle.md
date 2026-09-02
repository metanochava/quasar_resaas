# Ciclo de uma Requisição

O que corre de facto, por ordem, num pedido tratado por uma subclasse de `BaseAPIView` — baseado
em `core/base/views.py`.

```text
Pedido HTTP
   |
   v
TenantContextMiddleware        descodifica X-RESAAS-Context / L (architecture/middleware.md)
   |
   v
initial()                      primeiro o initial() do DRF, depois as verificações do RESAAS:
   |
   +-- tenant_context_error definido?      -> 403 PermissionDenied
   +-- tenant_context em falta?            -> 403 PermissionDenied
   +-- ResaasContextService.validate_for_user(...)
   +-- request.entity_id em falta?         -> 403 "não associado a nenhuma entidade"
   +-- module_name ativo para a entidade?  -> 403 "Módulo '<nome>' não está ativo"
   +-- codename de permissão concedido?    -> 403 "Não autorizado" (cache por pedido)
   |
   v
get_queryset()
   |
   +-- filtrar por entity_id / branch_id (se o model os tiver)
   +-- trocar manager para ?objects=all / ?objects=deleted (se o model suportar)
   +-- reaplicar entity_id / branch_id (trocar de manager reinicia o filtro anterior)
   +-- apply_dynamic_search()  ->  build_search_query() a partir de ?search=
   |
   v
DynamicFilterBackend + OrderingFilter    (api/filters-pagination.md)
   |
   v
Serializer  (BaseSerializer)
   |
   v
Model / Base de dados
   |
   v
Resposta HTTP
```

## Criação

`perform_create()` preenche `created_by`/`updated_by` a partir de `request.user`, e — só para
models que realmente têm essas colunas — `entity_id`/`branch_id` a partir de
`request.entity_id`/`request.branch_id`. Este é o único ponto onde uma instância de `BaseModel`
criada pela API recebe o seu tenant; fora da API (shell, management commands, sinais,
migrações), quem chama tem de definir `entity`/`branch` manualmente ou `BaseModel.save()` levanta
`ValidationError` — ver [Multi-tenancy](multi-tenancy.md#regra-de-ouro-o-tenant-nunca-e-adivinhado).

```python
def perform_create(self, serializer):
    data = {"created_by": self.request.user, "updated_by": self.request.user}
    if hasattr(serializer.Meta.model, "entity_id"):
        data["entity_id"] = self.request.entity_id
    if hasattr(serializer.Meta.model, "branch_id"):
        data["branch_id"] = self.request.branch_id
    serializer.save(**data)
```

## Atualização

`perform_update()` só preenche `updated_by` — `entity`/`branch` não são tocados na atualização (o
tenant de uma linha não muda ao ser editada).

## Remoção, restore e hard delete

`DELETE .../<id>/` chama `perform_destroy()`, que é um **soft** delete: define `deleted_at` (e,
via `instance.delete(user=...)`, também `updated_by`) em vez de remover a linha. Duas actions
dedicadas, com permissões próprias, tratam do resto — `POST .../<id>/restore/` e
`DELETE .../<id>/hard_delete/` — ambas localizadas através de `Model.all_objects` e ainda
filtradas por `entity_id`/`branch_id`, pelo que agir sobre a linha de outro tenant dá 404 tal como
ao tentar obtê-la. Detalhe completo em [Soft delete](../features/soft-delete.md).
