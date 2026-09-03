# Troubleshooting do Backend

## `RESAAS context is required.` (403)

O `initial()` rejeita qualquer pedido sem nenhum `request.tenant_context` descodificado. Verificar:

1. Se o cabeçalho `X-RESAAS-Context` está mesmo a ser enviado.
2. Se o token foi emitido por `POST /api/resaas/context/` e não expirou.
3. Se `ResaasContextService.decode(token)` não está a falhar em silêncio — uma falha de
   descodificação cai em `request.tenant_context_error` e levanta o seu próprio
   `PermissionDenied`, mais específico, antes deste. Ver [Multi-tenancy](../architecture/multi-tenancy.md).

## `Module '<nome>' is not active.` (403)

A app está instalada e a sua view registada, mas o tenant não a ativou:

```python
from django_resaas.models.app import App
from django_resaas.models.entity_app import EntityApp

app, _ = App.objects.get_or_create(name="<nome>", defaults={"state": "Active"})
EntityApp.objects.get_or_create(entity=minha_entidade, app=app, defaults={"state": "Active"})
```

Ver [BaseAPIView#ativação-de-módulo](../api/base-api-view.md#ativação-de-módulo). A ativação é
por entidade — ativar para um tenant nunca ativa para outro.

## `Module '<nome>' is not defined.` (403)

A view não tem nenhum `module_name` definido — nunca foi decorada com `@register_view(...)` /
`@registerView(...)`, ou o decorator foi aplicado sem este módulo ter sido importado antes de
`build_saas_urls()` correr. Ver
[Registo de views#quando-é-que-view_registry-é-realmente-preenchido](../architecture/registry.md#quando-é-que-view_registry-é-realmente-preenchido).

## `Unauthorized` (403) numa action que devia ser permitida

1. Confirmar que o codename esperado realmente existe:
   `Permission.objects.filter(content_type__model="<model>", codename="<prefixo>_<model>")`.
2. Confirmar que o grupo do utilizador o tem, para a branch *atual* — `check_permission()` resolve
   permissões por branch/entity/entity_type, não globalmente. Ver [Permissões](../security/permissions.md).
3. > [!TIP]
   > A cache de permissões por pedido (`request._perm_cache`) só vive durante esse único
   > pedido — atribuir uma permissão faz efeito no pedido seguinte, não retroativamente.

## `django.core.exceptions.ValidationError` ao gravar, mencionando "explicit entity and branch"

Uma instância de `BaseModel` foi gravada sem `entity`/`branch` definidos, fora da API (shell,
management command, sinal, migração, fixture). Isto é intencional —
`BaseModel.ensure_tenant()` nunca adivinha um tenant. Definir ambos explicitamente antes de
gravar. Ver [Multi-tenancy#regra-de-ouro-o-tenant-nunca-é-adivinhado](../architecture/multi-tenancy.md#regra-de-ouro-o-tenant-nunca-é-adivinhado).

## A pesquisa devolve todos os registos, ou nenhum

1. Confirmar que `search` está mesmo a chegar em `request.query_params` (um nome de parâmetro mal
   escrito, ex. `?q=` em vez de `?search=`, é silenciosamente ignorado — uma pesquisa vazia é um
   no-op, não um erro).
2. Se `RESAAS.search_fields` estiver declarado, confirmar que os nomes dos campos estão bem
   escritos — uma entrada inválida é silenciosamente ignorada em vez de levantar erro, pelo que um
   erro de digitação apenas estreita, em silêncio, o que é pesquisado. Ver [Pesquisa](../api/search.md).
3. Sem `search_fields`, só os campos `Char`/`Text`/`Email` diretos do próprio model são
   pesquisados — uma relação não corresponde a menos que `search_fields` seja declarado
   explicitamente.
4. Inspecionar o SQL real com `print(qs.query)` se o acima não explicar.

## `ImproperlyConfigured` do `sync_actions` / `post_migrate`

Um `@resaas_action` foi declarado com a mesma identidade `app`/`model`/`action` de uma linha
`ModelExtraAction` já existente cujo `managed_by` é `"manual"`. A sincronização recusa-se a tomar
silenciosamente uma linha criada manualmente. Renomear a action, ou definir
`managed_by="decorator"` na linha existente primeiro, se entregá-la ao decorator for intencional.
Ver [Permissões#permissões-de-actions-personalizadas-e-ownership](../security/permissions.md#permissões-de-actions-personalizadas-e-ownership).

## `Fatal: There is an existing release branch`

Resolver ou apagar a branch `release/x.y.z` existente antes de começar outra — ver
[Git flow e releases](../deployment/releases.md#antes-de-começar-uma-release).
