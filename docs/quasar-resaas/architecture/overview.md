# Arquitetura do quasar_resaas

## Visão geral

`quasar_resaas` não é uma app — é uma biblioteca que se instala dentro
de uma app Quasar/Vue 3 (`main`) e liga-se ao backend `django_resaas`.
Tudo o que exporta (rotas, stores, componentes, serviços) é consumido
pela app hospedeira, nunca corre sozinho.

``` text
App hospedeira (ex: front)
       |
       v
quasar_resaas (boot: components.js, alerts.js)
       |
       +---- Stores (Pinia)      -> base/base_store.js
       +---- Componentes s-*     -> boot/components.js
       +---- Rotas               -> restRoutes / authRoutes / docsRoutes
       +---- Composable          -> useResaas()
       |
       v
services/api.js (HTTPAuth / HTTPClient)
       |
       v
django_resaas (REST API)
```

## Ponto de entrada (`index.js`)

O `index.js` é uma fachada — reexporta tudo o que a app hospedeira
pode precisar, agrupado por camada:

-   **Routers** — `restRoutes`, `authRoutes`, `docsRoutes` (ver
    [Router](../routing/routes.md))
-   **Composable** — `useResaas()` (ver abaixo)
-   **Stores** — `UserStore`, `EntityStore`, `BranchStore`,
    `PermissionStore`, etc. (ver [BaseStore](../stores/base-store.md))
-   **Base** — `createBaseStore` (fábrica de stores)
-   **Utils** — `buildFormFromSchema`, `json`, `text`, `profile`
-   **Services** — `api`, `app`, `base`, `data`, `storage`,
    `translation`, `theme`, `routing`, `token`
-   **Boot** — `alerts`, `Components` (registo global dos `s-*`)
-   **Componentes/Layouts** — `MainLayout`, `AuthLayout`, `CrudPage`

## Registo de componentes (`boot/components.js`)

Todos os componentes da biblioteca são registados globalmente com o
prefixo `s-` (ex.: `s-btn`, `s-auto-form`, `s-auto-crud`), para que
qualquer página da app hospedeira os use sem import explícito. Ver
[Form](../components/form.md), [ActionForm](../components/action-form.md)
e [s-btn](../components/button.md).

## Contexto Pinia (`core/context.js`)

`base/base_store.js` e vários serviços precisam de uma instância de
Pinia fora de componentes Vue. `setPinia(piniaInstance)` deve ser
chamado uma vez no boot da app hospedeira; `getPinia()` lança erro se
isso não tiver acontecido — é a forma da biblioteca falhar cedo em vez
de silenciosamente.

## `useResaas()`

Composable de conveniência (`composables/useResaas.js`) que devolve,
num único objeto, as stores mais usadas (`User`, `Entity`, `EntityType`,
`Branch`, `Menu`, `Person`), os clientes HTTP (`HTTPAuth`, `HTTPClient`,
`wsApi`, `url`), `buildFormFromSchema`, `createBaseStore` e `tdc`
(tradução). Não introduz lógica nova — apenas evita repetir vários
`useXStore()` em cada página.

## Ligação ao backend

Toda a comunicação passa por `services/api.js`
([API & headers](../api/backend-integration.md)). Não há chamadas
`fetch`/`axios` soltas nas páginas — o padrão é sempre store ou
`HTTPAuth` importado da biblioteca.
