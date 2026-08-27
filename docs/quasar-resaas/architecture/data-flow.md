# Fluxo de dados — do schema ao ecrã

Exemplo real: uma página de edição na app hospedeira que usa
`s-form-two` (`front/src/pages/rh/cargo/CargoSEPage.vue`).

``` text
Página (CargoSEPage.vue)
   |
   |  buildFormFromSchema({ app, model })
   v
utils/autoForm.js
   |
   |  GET django_resaas/resaasapps/{app}/{model}/schema/
   v
services/api.js (HTTPAuth)
   |  + Authorization: Bearer <access>
   |  + X-RESAAS-Context: <token>   (ver stores/user-context.md)
   v
django_resaas (backend)
   |
   v  { fields, actions, config, permissions, routes, ... }
utils/schema.js -> normalizeSchema()
   |
   v
buildFormFromSchema()
   - gera `rules` de validação por campo (obrigatório, min/max, JSON)
   - resolve opções de relação (`ForeignKey`/`M2M`) via
     `django_resaas/relations/`, com cache e debounce (350ms)
   - devolve { schema, fields, actions, config, permissions, ... }
   v
s-form-two / s-auto-form renderizam os campos
```

## `buildFormFromSchema` (`utils/autoForm.js`)

Assinatura atual:

``` js
buildFormFromSchema({ app, model, fetchRelationOptions } = {})
```

Lança `app/model required` se `app` ou `model` não forem passados.
Para cada campo do schema:

-   deteta tipo (`isFileType`, `isNumericType`, `isCharType`,
    `isRelationType`) para decidir o componente `s-*` a usar
    (`f.component || 's-input'`);
-   constrói `rules` a partir de `required`, `min_length`,
    `max_length`, `min`, `max` e `JSONField`;
-   se o campo é uma relação, liga `onFilter` a um fetcher com
    debounce e cache em memória (`__relationCache`) — evita repetir
    pedidos ao digitar numa combo de pesquisa.

> **Nota:** `base/base_store.js` chama sempre
> `buildFormFromSchema({ app: this.safeApp, model: this.safeModel })`
> — este é o caminho consistente com a assinatura atual. O exemplo em
> `CargoSEPage.vue` chama `buildFormFromSchema({ module, model,
> schemaPath })`, que **não corresponde** aos parâmetros que a função
> lê (`app`, `model`, `fetchRelationOptions`); `module`/`schemaPath`
> são ignorados. Vale a pena confirmar se essa página está a usar uma
> versão desatualizada da API antes de a tomar como referência.

## Pedidos via store (`create`/`update`/`loadData`)

Para páginas que usam uma store criada com `createBaseStore` (ver
[BaseStore](../stores/base-store.md)), o mesmo padrão
schema-fetch-render acontece dentro de `store.init()`, e as operações
de CRUD (`loadData`, `getById`, `create`, `update`, `remove`) usam
`this.safeUrl` (derivado de `app/model`) contra os mesmos
`HTTPAuth`/`url()`.
