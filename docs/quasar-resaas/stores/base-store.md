# BaseStore (`base/base_store.js`)

`createBaseStore(name, config, extend)` é uma fábrica de stores Pinia
que dá a qualquer recurso (`app` + `model` do backend) um CRUD completo
sem repetir código.

``` js
export const useBranchStore = createBaseStore(
  'branch',
  { app: 'django_resaas', model: 'Branch' },
  { state: () => ({}), actions: { /* extras específicos */ } }
)
```

## Config imutável

`BASE_CONFIG` é gerado uma vez (`Object.freeze`) a partir de
`config.app`/`config.model`, e deriva `url` como
`` `${app}/${model.toLowerCase()}s` ``. As actions nunca devem montar
esta URL à mão — usam sempre os getters `safeApp`, `safeModel`,
`safeUrl`.

## State comum

Todas as stores criadas por `createBaseStore` partilham:
`loading`, `saving`, `fields`, `rows`, `row`, `form`, `actions`,
`config`, `search`, `filters`, `pagination` (`page`, `rowsPerPage`,
`rowsNumber`), e o estado de PDF (`pdf`, `showPdf`). `extend.state()`
é fundido por cima — é o que `UserStore`, `BranchStore`, etc. usam
para acrescentar campos próprios (ver
[UserStore & context](user-context.md)).

## Actions principais

-   `init()` — `assertConfig()` -> `loadSchemaOnce()` -> `loadData()`,
    com hooks `beforeInit`/`afterInit`.
-   `loadSchema()` / `loadSchemaOnce()` — chama
    `buildFormFromSchema({ app: this.safeApp, model: this.safeModel })`
    (ver [Fluxo de dados](../architecture/data-flow.md)) e preenche
    `fields`, `actions`, `config`.
-   `loadData(params)` — `GET safeUrl` com `page`, `page_size`,
    `search`, `filters` e overrides; preenche `rows` e
    `pagination.rowsNumber`.
-   `getById(id)` — devolve `this.row` em cache se o id já corresponde;
    caso contrário faz `GET safeUrl/{id}/` e sincroniza `row`/`form`.
-   `create()` / `update()` / `save()` — `save()` decide entre os dois
    consoante `this.form.id` existir; ambos sincronizam `row`, `form` e
    a lista `rows`.
-   `remove()` — `DELETE`, remove de `rows` e chama `resetForm()`.
-   `getPdf(id)` / `getPdfList()` — pedem PDF via `HTTPAuthBlob` e
    guardam um `Blob` URL em `pdf` (usado por `s-pdf-render*`).
-   `resetForm()` — reconstrói `form` a partir de `fields[].default`,
    ou limpa tudo se o schema ainda não carregou.

## Hooks (`extend.hooks`)

`runHook(name, payload)` chama, se existir, `extend.hooks[name]` com
`this` ligado à store. Hooks disponíveis:
`beforeInit/afterInit`, `beforeSchema/afterSchema`,
`beforeLoad/afterLoad`, `beforeGet/afterGet`, `beforeCreate/afterCreate`,
`beforeUpdate/afterUpdate`, `beforeDelete/afterDelete`. É o ponto de
extensão preferido em vez de sobrepor uma action inteira.

## `assertConfig()`

Guarda de segurança chamada no início de quase todas as actions —
lança erro se `_config.app`/`_config.model` não estiverem definidos.
Existe para falhar cedo quando uma store é mal configurada, em vez de
um `undefined/undefineds` silencioso na URL.
