# Multi-tenancy

O RESAAS trabalha com um contexto de tenant, transportado em todo o pedido autenticado através de
dois cabeçalhos:

- `X-RESAAS-Context` — um token assinado (ver `ResaasContextService`, `TenantContextMiddleware`)
  que se descodifica em `entity_type_id`, `entity_id`, `branch_id` e `group_id`.
- `L` — o id do idioma ativo, lido independentemente para `request.lang_id`.

O `TenantContextMiddleware` corre em cada pedido e inicializa sempre os cinco campos
`request.entity_type_id` / `entity_id` / `branch_id` / `group_id` / `lang_id`, por omissão a
`None` quando o cabeçalho está ausente ou falha a descodificação (a própria falha é capturada em
`request.tenant_context_error`, nunca levantada) — ver [`middleware.md`](middleware.md).

## Regra de ouro: o tenant nunca é adivinhado

> [!WARNING]
> O `django_resaas` nunca escolhe um tenant automaticamente. Uma subclasse de `BaseModel`
> (qualquer model com as duas FKs `entity`/`branch`) exige que sejam definidas
> *explicitamente* antes do `.save()` — não há fallback para "a primeira Entity" ou "a
> primeira Branch". Se qualquer uma faltar, `save()` levanta imediatamente
> `django.core.exceptions.ValidationError`; nada é gravado no tenant errado por acidente.

```python
# core/base/models.py
def ensure_tenant(self):
    if not self.entity_id or not self.branch_id:
        raise ValidationError(
            f"{self.__class__.__name__} requires an explicit "
            "entity and branch before it can be saved - "
            "automatic tenant selection is not supported."
        )
```

No caminho da API, `BaseAPIView.perform_create()` define `entity`/`branch` explicitamente a partir
de `request.entity_id`/`request.branch_id` antes de gravar, pelo que isto nunca aparece num pedido
autenticado normal.

> [!NOTE]
> O `ensure_tenant()` aparece — deliberadamente — sempre que se constrói uma instância de
> `BaseModel` sem passar pela API: sessões de shell, management commands, tarefas Celery,
> sinais, migrações de dados, fixtures. Esses pontos de chamada têm de definir
> `entity`/`branch` explicitamente eles próprios; ver `src/django_resaas/tests/test_tenant.py`
> para o comportamento exato que isto fixa (incluindo que nunca "empresta" a branch de outro
> tenant).

## Regra principal (queries)

Um model que tem `entity_id` deve ser filtrado pela entidade ativa. Um model que tem `branch_id`
deve também ser filtrado pela sucursal ativa.

Exemplo conceptual:

```python
if hasattr(Model, "entity_id"):
    qs = qs.filter(entity_id=self.request.entity_id)

if hasattr(Model, "branch_id"):
    qs = qs.filter(branch_id=self.request.branch_id)
```

> [!WARNING]
> Quando o manager é trocado, por exemplo para `all_objects` ou `deleted_objects`, os filtros
> de tenant têm de ser reaplicados — caso contrário a troca alarga silenciosamente o queryset
> para além da entity/branch atual.

## Objetivo

A finalidade é impedir que um pedido de uma entidade acabe, por acidente, a aceder a dados
pertencentes a outra entidade.
