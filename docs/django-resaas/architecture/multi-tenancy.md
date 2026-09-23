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

## Resolução de tenant por domínio (endpoint público `/site`)

Além do `X-RESAAS-Context` (pedidos autenticados, acima), o `django_resaas` expõe um segundo
mecanismo de resolução de tenant, para sites públicos/marketing que ainda não têm nenhuma sessão:

`SiteAPIView` — `django_resaas.saas.data.entity.views.site.SiteAPIView`
(`saas/data/entity/views/site.py`), método `GET`, **PÚBLICO** explícito
(`permission_classes = (permissions.AllowAny,)`).

Em vez de ler `entity_id` de um cabeçalho, resolve a `Entity` a partir do cabeçalho HTTP `Origin`
do pedido, comparando-o com o campo `Entity.site` (`URLField`):

```python
netloc = urlparse(origin).netloc

entity = Entity.objects.filter(
    Q(site=f"http://{netloc}")  | Q(site=f"http://{netloc}/") |
    Q(site=f"https://{netloc}") | Q(site=f"https://{netloc}/")
).first()
```

> [!WARNING]
> `Entity.site` está gravado **com** esquema (ex.: `http://clinicaamal.co.mz`), mas nem sempre com
> o esquema que o site realmente usa em produção (linhas reais observadas usam `http://` mesmo
> para domínios servidos por `https`). Uma versão anterior desta view comparava
> `urlparse(origin).netloc` (esquema já removido) diretamente contra `Entity.site` (que ainda tem
> o esquema) — a comparação nunca podia corresponder a nada, e a Entity nunca era encontrada. A
> correção compara pelo `netloc`, aceitando ambos os esquemas e uma barra final opcional, em vez de
> assumir que o esquema gravado reflete o do pedido.

Se não houver `Origin` ou nenhuma `Entity` corresponder, a resposta é `200` (não `404`) sem a
chave `entity` (`ApiResponse.all(request, Origin="Desconhecida")`) — quem consome este endpoint
deve verificar a presença de `data.entity`, nunca o status code, para decidir se o domínio foi
resolvido.

Quando encontra a `Entity`, devolve também `theme`/`typography`/`layout_settings`/
`animation_settings`, com o mesmo fallback já usado noutros pontos do RESAAS
(`entity.theme or entity.entity_type.theme`, etc.) — ver
[Models & RESAAS](../models/resaas-config.md).

No frontend, este endpoint é consumido por `EntityStore.getSettings()`
(`quasar_resaas/stores/EntityStore.js`) — ver
[UserStore & tenant context #resolving-the-tenant-from-a-public-domain-entitystoregetsettings](../../quasar-resaas/stores/user-context.md#resolving-the-tenant-from-a-public-domain-entitystoregetsettings)
para o lado frontend do contrato, incluindo uma armadilha conhecida (`Entity.row` nunca é
preenchido por este fluxo).

## Objetivo

A finalidade é impedir que um pedido de uma entidade acabe, por acidente, a aceder a dados
pertencentes a outra entidade.
