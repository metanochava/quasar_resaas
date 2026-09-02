# Referência Pública da API

O `django_resaas` é uma app Django reutilizável, não uma biblioteca autónoma com uma lista de
exports curada no `__init__.py` de topo. Os seus ficheiros `__init__.py` estão intencionalmente
vazios (importar models ou views ali de forma antecipada arriscaria erros
`AppRegistryNotReady`, antes de o Django terminar de carregar as apps instaladas). A convenção
suportada e funcional é o **import profundo** — importar cada classe diretamente do módulo que a
define. Esta página documenta essa superfície já existente; não introduz nenhuma nova.

## Classes base (`django_resaas.core.base`)

### `BaseModel` — `django_resaas.core.base.models.BaseModel`

A classe base de model que a maioria dos models de aplicação deve herdar. Construída em camadas:

- `SoftBaseModel` — acrescenta uma chave primária UUID, `created_at`/`updated_at`/`deleted_at`, e
  três managers: `objects` (só linhas vivas), `all_objects` (tudo), `deleted_objects` (só linhas
  soft-deleted). `delete()` define `deleted_at` em vez de remover a linha; `hard_delete()` faz a
  remoção real; `restore()` limpa `deleted_at`.
- `TimeModel` — acrescenta `created_by`/`updated_by` (FK para `AUTH_USER_MODEL`) e um campo
  `state` (`Active`/`Inactive`).
- `BaseModel` — acrescenta as foreign keys de tenant `entity`/`branch` e `ensure_tenant()`, que o
  `save()` chama automaticamente. Nunca preenche um tenant sozinho: se `entity`/`branch` não
  estiverem já definidos explicitamente, levanta `ValidationError` em vez de adivinhar — ver
  [Multi-tenancy](../architecture/multi-tenancy.md#regra-de-ouro-o-tenant-nunca-e-adivinhado).

Também exportados do mesmo módulo: `SoftDeleteQuerySet`, `SoftDeleteManager`, `DeletedManager`,
`AllObjectsManager`, e a função auxiliar de caminho de upload `file_path(instance, file_name,
pasta="")` (constrói `{entity_type_id}/{entity_id}/{instance_id}/{pasta}/{filename}`).

### `BaseSerializer` — `django_resaas.core.base.serializers.BaseSerializer`

A classe base de `ModelSerializer`, composta por quatro mixins (`DynamicFieldsMixin`,
`SerializerUtilsMixin`, `FileFieldsMixin`, `RepresentationMixin`). Marca automaticamente
`DEFAULT_READ_ONLY_FIELDS` (`id`, `entity`, `branch`, `created_by`, `updated_by`, `created_at`,
`updated_at`, `deleted_at`) como só de leitura em cada subclasse, para que quem a use não precise
de repetir essa lista por serializer. `label_field` e `value_field` (por omissão `"id"`) suportam
a representação genérica label/value do framework.

### `BaseAPIView` — `django_resaas.core.base.views.BaseAPIView`

A classe base de `ModelViewSet` — ver [BaseAPIView](base-api-view.md) para as suas
responsabilidades (CRUD, filtros, ordenação, pesquisa, permissões, multi-tenancy, soft
delete/restore/hard delete). Também neste módulo:

- `registerView(name=None, module=None)` — decorator de classe que regista uma classe de view no
  `VIEW_REGISTRY` global (`django_resaas.core.base.registry.VIEW_REGISTRY`), indexado por
  `module` (por omissão: o pacote de topo da classe) e `name` (por omissão: o nome da classe, em
  minúsculas, com o sufixo `APIView` removido, pluralizado com um `s` no fim). Este registo é o
  que `core.utils.autoload_urls.build_saas_urls()` percorre para construir o router
  automaticamente — ver [Criar um novo recurso](../development/creating-resource.md) para um
  exemplo de utilização completo.

### `HasAppPermission` e afins — `core/base/permissions.py`

- `HasAppPermission` — uma `BasePermission` do DRF. Lê `permission_codename` da view e delega em
  `check_permission()`.
- `check_permission(request, role)` — a verificação de autorização em si: exige um utilizador
  autenticado mais um contexto de tenant completo no pedido (`entity_type_id`, `entity_id`,
  `branch_id`, `group_id`, `lang_id`), depois verifica numa única query se o `BranchUserGroup` do
  utilizador concede uma permissão com esse codename para a branch/entity/entity_type atuais.
- `hasApp(codigo)` — decorator de método; devolve 403 a menos que a app `codigo` dada esteja ativa
  (`EntityApp`, `state=1`) para a entidade do pedido. **Problema conhecido:** filtra por
  `app__codigo`, mas `django_resaas.models.app.App` não tem nenhum campo `codigo` — chamar este
  decorator levantaria `FieldError`. Não tem nenhum ponto de chamada no código atual, pelo que
  isto nunca surgiu na prática; fica sinalizado aqui em vez de corrigido, já que corrigir
  implicaria adivinhar o nome/semântica do campo pretendido (fora do âmbito de uma passagem só de
  documentação).
- `hasPermission(role=None)` — decorator de método que envolve `check_permission()`, devolvendo
  uma resposta 403 `fail()` em vez de levantar.
- `isPermited(request=None, role=None)` — um alias fino para `check_permission()`.

## `resaas_action` — `django_resaas.core.decorators.action.resaas_action`

```python
@resaas_action(*, methods=None, detail=False, label=None, icon=None, tooltip=None,
                position=None, order=0, visible=True, autorequest=False,
                url_path=None, url_name=None)
```

Declara uma action personalizada numa `ViewSet`/`BaseAPIView`, sobrepondo metadados RESAAS
(label, ícone, tooltip, posição, ordem, visibilidade, se o frontend deve pedi-la automaticamente)
sobre o próprio decorator `@action` do DRF. O nome do método decorado torna-se o nome da action e
(salvo sobreposição) o caminho/nome de URL e a base do codename de permissão. O decorator em si
não escreve na base de dados — os metadados ficam guardados na função como `_resaas_action` e são
persistidos pelo `ActionSyncService` (ver
[Comandos de gestão](../development/management-commands.md#sync_actions)), que é o que faz a
action aparecer no output `actions`/`permissions.custom` do `ResaasSchemaBuilder` (ver
[O contrato Schema 1.0](schema-contract.md)).

## `ResaasSchemaBuilder` — `django_resaas.core.schema.ResaasSchemaBuilder`

```python
from django_resaas.core.schema import ResaasSchemaBuilder
```

Transforma um model no JSON versionado "Schema 1.0" consumido por frontends. A sua forma exata de
output, política de versionamento e semântica de merge estão documentadas separadamente em
[O contrato Schema 1.0](schema-contract.md) — esta entrada existe só para apontar para o caminho
de import correto.

## `django_resaas.models`

`src/django_resaas/models/__init__.py` reexporta um subconjunto pequeno e específico dos ~25
models nesse pacote:

```python
from django_resaas.models import Document, Person, EntityTypeGroup, CorsAllowedOrigin, ModelExtraAction
```

Todos os outros models são importados do seu próprio módulo — ex.:

```python
from django_resaas.models.user import User
from django_resaas.models.group import Group
from django_resaas.models.entity import Entity
from django_resaas.models.branch import Branch
```

Não há nenhuma regra documentada para o motivo de estes cinco serem reexportados e os restantes
não; tratar isto como comportamento já existente a preservar — não confiar que mais models sejam
acrescentados a essa lista sem antes verificar `models/__init__.py`.
