# BaseAPIView

`BaseAPIView` é a base comum das APIs REST do framework.

## Principais responsabilidades

- CRUD através de `ModelViewSet`;
- filtros;
- ordenação;
- pesquisa dinâmica;
- permissões;
- multi-tenancy;
- auditoria;
- soft delete;
- restore;
- hard delete;
- select mode.

## Mapeamento de permissões

Exemplo:

```python
permission_action_map = {
    "list": "list",
    "retrieve": "view",
    "create": "add",
    "update": "change",
    "partial_update": "change",
    "destroy": "delete",
    "restore": "restore",
    "hard_delete": "hard_delete",
}
```

Para um model `Patient`, a criação pode exigir `add_patient`, a alteração `change_patient` e a
remoção `delete_patient`.

## Queryset

`get_queryset()` tem de ser o ponto central que garante isolamento por tenant antes de listar e
pesquisar. A sua própria sequência é: aplicar os filtros `entity_id`/`branch_id` -> trocar o
manager se `?objects=` for pedido -> **reaplicar** `entity_id`/`branch_id` (o manager trocado não
é, por si só, delimitado por tenant) -> aplicar pesquisa dinâmica.

## `?objects=` (soft delete)

Todo o `BaseModel`/`SoftBaseModel` usa um manager de soft delete por omissão (`.objects` só
devolve linhas não apagadas). Os endpoints de listagem/detalhe aceitam um parâmetro de query para
ver além disso, sempre ainda delimitado por tenant:

- `?objects=all` — usa `Model.all_objects` (ativas + soft-deleted).
- `?objects=deleted` — usa `Model.deleted_objects` (só soft-deleted).
- ausente — o manager normal `.objects` (só ativas).

Apagar através da API (`DELETE .../<id>/`) é um **soft** delete (`instance.delete()` define
`deleted_at`). Duas actions dedicadas tratam do resto:

- `POST .../<id>/restore/` — limpa `deleted_at`. Localizada via `all_objects`, ainda filtrada por
  `entity_id`/`branch_id`, pelo que restaurar a linha de outro tenant dá 404 tal como obtê-la dá.
- `DELETE .../<id>/hard_delete/` — remove a linha permanentemente (mesma localização delimitada
  por tenant).

Ver `src/django_resaas/tests/test_soft_delete.py` para o comportamento exato e testado
(incluindo que um `GET .../<id>/` simples numa linha soft-deleted dá 404, mas
`GET .../<id>/?objects=all` tem sucesso).

## Ativação de módulo

Antes de tudo isto, `initial()` exige um contexto de tenant válido no pedido — um cabeçalho
`X-RESAAS-Context` em falta ou ilegível (ver [Multi-tenancy](../architecture/multi-tenancy.md))
levanta `PermissionDenied` de imediato, antes de as verificações de `module_name`/permissão sequer
correrem.

`initial()` exige que `self.module_name` esteja definido (via `@registerView(...)` — ver
[Criar um novo recurso](../development/creating-resource.md)) e verifica
`EntityApp.objects.filter(entity_id=request.entity_id, app__name=module_name, state="Active").exists()`
antes de mais nada correr. Uma view sem `module_name` definido, ou um tenant que não tenha ativado
esse módulo, é rejeitado antes de o queryset sequer ser tocado — ver
`src/django_resaas/tests/test_module_activation.py`.

## Pesquisa, filtros, paginação

- Pesquisa: `?search=...` corresponde a `RESAAS.search_fields` quando o model os declara (suporta
  travessia de relações com `__`), caso contrário recorre a todos os campos `Char/Text/EmailField`
  diretos no próprio model — o fallback não percorre relações. Ver [`search.md`](search.md).
- Filtros: `DjangoFilterBackend` + `OrderingFilter` estão sempre ativos (ver
  [`filters-pagination.md`](filters-pagination.md)).
- Paginação: `ResaasPagination` (`DEFAULT_PAGINATION_CLASS`), cujo `page_size` um model pode
  sobrepor via `RESAAS.pagination` — é isto que o `pagination.page_size` do `Schema 1.0` reflete
  (ver [`schema-contract.md`](schema-contract.md)).

## Actions personalizadas

Métodos `@resaas_action(...)` declarados numa subclasse de `BaseAPIView` tornam-se tanto actions
reais do DRF (roteáveis, com permissão verificada) como entradas na lista `actions` do
`Schema 1.0`, mantidas sincronizadas pelo `ActionSyncService` — ver
[Criar um novo recurso](../development/creating-resource.md) para os argumentos do decorator e as
regras de ownership manual/decorator, e [`schema-contract.md`](schema-contract.md) para a forma
exata que o frontend recebe.
