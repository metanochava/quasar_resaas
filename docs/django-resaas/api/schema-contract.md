# O Contrato de Schema RESAAS (v1.0)

O `ResaasSchemaBuilder` (`django_resaas.core.schema.ResaasSchemaBuilder`) transforma um model
Django num contrato JSON declarativo que um frontend (`quasar_resaas`, em particular) consome
para renderizar um ecrã CRUD completo — tabela, formulário, filtros, paginação, permissões,
actions, exportação em PDF — sem fixar nenhuma dessas convenções do lado do cliente.

É servido pelo `AppSchemaAPIView` (`management/apicommands/view/app_schema.py`) no endpoint
`.../<app>/<model>/schema/` de cada app, e é exercitado de ponta a ponta pela app de demonstração
em `src/dev/demo`.

Este documento é a referência oficial para essa forma. É protegido por
`src/django_resaas/core/schema/tests/test_builder.py` — qualquer alteração ao JSON abaixo tem de
vir acompanhada de uma alteração correspondente no teste, para que a divergência entre este
documento e o output real seja apanhada em CI.

## Utilização

```python
from django_resaas.core.schema import ResaasSchemaBuilder

schema = ResaasSchemaBuilder(Model=SomeModel, fields=serialized_field_list).build()
```

`fields` é a lista de descritores de campo já derivada pelo chamador a partir do serializer do
model (cada um, no mínimo, `{"name": "<field_name>"}`); o builder não introspeta serializers por
si próprio.

## Política de versionamento

- `schema_version` está atualmente congelado em `"1.0"`.
- **Alterações aditivas, compatíveis com versões anteriores** (uma chave nova, um campo opcional
  novo num objeto já existente) não exigem subir a versão.
- **Alterações que quebram compatibilidade** (remover/renomear uma chave, mudar o tipo ou
  significado de um campo) exigem subir `ResaasSchemaBuilder.SCHEMA_VERSION` para `"2.0"`.
  Consumidores devem verificar `schema_version` antes de confiar em comportamento exclusivo da
  2.0.
- `module` e `config` (ver abaixo) são **aliases obsoletos**, mantidos apenas por compatibilidade
  com consumidores mais antigos. Código novo deve ler `model.app` e `routes`/`ui.crud`
  diretamente.

## Forma

```jsonc
{
  "schema_version": "1.0",

  "model": {
    "app": "django_resaas",         // Model._meta.app_label
    "name": "group",                // Model._meta.model_name
    "class_name": "Group",          // Model.__name__
    "label": "Group",               // Model._meta.verbose_name, em title case
    "label_plural": "Groups",       // Model._meta.verbose_name_plural, em title case
    "pk": "id",                     // Model._meta.pk.name
    "endpoint": "django_resaas/groups/"  // convenção "{app}/{model}s/"
  },

  "fields": [ /* a lista `fields` recebida, sem alterações */ ],

  "actions": [
    {
      "action": "archive",
      "app": "django_resaas",
      "model": "group",
      "label": "Archive",
      "icon": null,
      "tooltip": null,
      "position": null,
      "order": 0,
      "visible": true,
      "method": "POST",               // o único método com que a UI deve submeter esta action - sempre um valor, nunca vários juntos
      "methods": ["POST"],            // todos os métodos HTTP que o DRF de facto encaminha para o handler (de `@resaas_action(methods=[...])`); "method" acima é sempre methods[0]
      "detail": true,                // nome conceptual/de API (corresponde ao próprio `detail=` do DRF) - sempre igual a "details"
      "details": true,               // mantido por compatibilidade com código de frontend já existente; action de detalhe -> ".../{id}/archive/"
      "url": null,
      "autorequest": false,
      "endpoint": "django_resaas/groups/{id}/archive/",
      "permission": "archive_group"
    }
    // uma entrada por linha ModelExtraAction desta app+model,
    // ordenadas por (order, action)
  ],

  "permissions": {
    "list": "list_group", "view": "view_group", "add": "add_group",
    "change": "change_group", "delete": "delete_group",
    "restore": "restore_group", "hard_delete": "hard_delete_group",
    "pdf": "pdf_group", "pdf_list": "pdf_list_group",
    "custom": { "archive": "archive_group" }   // uma entrada por ModelExtraAction
  },

  "routes": {
    // valores por omissão de convenção ("{verbo}_{model}"), sobreponíveis por chave via
    // `RESAAS.routes` (um merge de dicionário, não uma substituição total)
    "list": "list_group", "add": "add_group",
    "change": "change_group", "view": "view_group"
  },

  "ui": {
    "title": "Groups",              // verbose_name_plural, em title case
    "icon": null,                   // RESAAS.icon
    "crud": true,                   // RESAAS.crud, por omissão true
    "dense": true, "striped": true,
    "show_search": true, "show_filters": true, "show_columns": true,
    "show_refresh": true, "show_pdf": true, "show_pdf_list": true
    // qualquer chave acima sobreponível via `RESAAS.ui = {...}` (fundida sobre os valores por omissão)
  },

  "filters": {
    "enabled": true,
    "search": true,
    "search_fields": [],            // RESAAS.search_fields
    "fields": ["name", "editable"]  // nomes retirados do argumento `fields`
    // sobreponível via `RESAAS.filters = {...}` (fundida sobre os valores por omissão)
  },

  "pagination": {
    "enabled": true,
    "page_size": 10,                // de REST_FRAMEWORK["PAGE_SIZE"], por omissão 10
    "page_size_options": [5, 10, 20, 50, 100, 200, 500, 1000, 0],
    "default_ordering": "-id"
    // sobreponível via `RESAAS.pagination = {...}` (fundida sobre os valores por omissão)
  },

  "pdf": {
    "enabled": true, "detail": true, "list": true,
    "detail_permission": "pdf_group", "list_permission": "pdf_list_group",
    "detail_endpoint": "django_resaas/groups/{id}/pdf/",
    "list_endpoint": "django_resaas/groups/pdflist/"
    // sobreponível via `RESAAS.pdf = {...}` (fundida sobre os valores por omissão)
  },

  // --- aliases obsoletos, mantidos por compatibilidade, ver Versionamento acima ---
  "module": "django_resaas",        // duplicado de model.app
  "config": {
    "crud": true,                   // duplicado de ui.crud
    "routes": { /* duplicado de routes */ }
  }
}
```

## Semântica de merge

Toda a secção sobreponível (`ui`, `filters`, `pagination`, `pdf`, `routes`) é um **merge raso de
dicionário**: `{**default, **(configured or {})}`. Definir `RESAAS.ui = {"dense": False}` só
sobrepõe `dense` — todas as outras chaves de `ui` mantêm o seu valor por omissão. É por isto que
um consumidor nunca deve redeclarar estes valores por omissão localmente (ver
[Referência pública da API](public-api-reference.md) e o `utils/schema.js` do `quasar_resaas`, que
agora importa estas constantes em vez de as redeclarar) — o backend é a única fonte de verdade
sobre o que "não definido" significa.

## Relacionados

- [Models & RESAAS](../models/resaas-config.md) — a convenção `class RESAAS` do lado do model
  (`label_field`, `search_fields`, `crud`, e as secções documentadas acima).
- `src/django_resaas/core/schema/tests/test_builder.py` — a versão executável deste contrato.
