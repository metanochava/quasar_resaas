# Router

A lib não monta o `vue-router` da app — exporta arrays de rotas simples,
para o host montar como quiser.

## Arrays exportados

| Export | Ficheiro | Conteúdo |
|---|---|---|
| `authRoutes` | `router/authRoutes.js` | `/auth/login` (em `AuthLayout`) e `/welcome` (em `MainLayout`) |
| `restRoutes` | `router/restRoutes.js` | scaffold/crud genéricos + rotas de `entity`, `entity_type`, `group`, `branch`, `user`, `permission`, `employee` |
| `docsRoutes` | `router/docsRoutes.js` | `/docs/:slug(.*)*`, ver [documentação (docsRoutes)](../README.md) |

Cada grupo de páginas (`pages/entity/entityRoute.js`, etc.) exporta o seu
próprio array (`entityRoutes`, ...) que `restRoutes` agrega com spread.

## Convenção de `meta`

```js
{
  path: '/list_entity',
  name: 'list_entity',
  component: () => import('./EntityLPage.vue'),
  meta: {
    title: tdc('View of') + ' ' + tdc('entity'),
    requiresAuth: true,
    icon: 'list',
    requiredRole: 'list_entity',
  },
}
```

-   `title` — passa por [`tdc()`](../features/translation.md), traduzido em runtime.
-   `requiresAuth` — exigido pelo guard de autenticação do host.
-   `icon` — usado pelo menu (ex. `TopMenu`/`LeftMenu`) quando lista rotas.
-   `requiredRole` — codename de permissão, verificado com
    [`User.can()`](../features/permissions.md). Por convenção o nome da rota
    é igual ao `requiredRole` (`list_entity` → `list_entity`).

Rotas só de navegação (ex. `docsRoutes`, `/welcome`) omitem `requiredRole`.

## Montagem no host

Confirmado em `/var/www/dev/front/src/router/routes.js` — a app consome os
três arrays tal como o README descreve:

```js
import { restRoutes, authRoutes, docsRoutes } from 'quasar_resaas'
import { MainLayout, CrudPage } from 'quasar_resaas'

routes = [
  ...docsRoutes,
  ...authRoutes,
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: () => import('src/pages/IndexPage.vue'), name: 'home' },
      { path: 'crud', component: CrudPage, name: 'crud_state' },
      { path: 'crud/:module/:model/go', component: CrudPage, name: 'crud_route' },
      ...restRoutes,
      ...rhRoutes,
      ...stockRoutes,
      ...saudeRoutes,
      ...hrRoutes,
    ],
  },
]
```

As rotas de módulo próprias da app (`rhRoutes`, `saudeRoutes`, ...) seguem a
mesma convenção de `meta` das rotas da lib — não há tratamento especial.

## Rota "não encontrada"

`restRoutes` inclui `/route/:route/:id` → `RotaEnexistente.vue`, usada como
alvo de fallback quando uma rota de recurso não existe.
