# Criar um Novo Recurso Frontend

Assume-se que o model já existe no backend (django_resaas) com `RESAAS.crud = True` e a view registada — ver `development/creating-resource.md` do django_resaas para esse lado.

Exemplo real: `Cargo` (`front/src/pages/rh/cargo/`).

## 1. Páginas

Três ficheiros por recurso:

```
CargoLPage.vue   // lista — usa <s-auto-crud>
CargoSEPage.vue  // criar/editar — usa <s-form-two>
CargoVPage.vue   // ver detalhe
```

`CargoLPage.vue` delega tudo ao componente automático:

```vue
<s-auto-crud :module="module" :model="model" :can="User.can"
  :ignoreFields="ignoreFields" route="view_cargo" />
```

`CargoSEPage.vue` carrega o schema e, se a rota tiver `:id`, o registo existente:

```js
const data = await buildFormFromSchema({ module, model, schemaPath })
schema.value = data.schema

const id = route.params.id || route.query.id
if (id) selectedRow.value = (await HTTPAuth.get(url({ type:'u', url:`${module}/${model}s/${id}/` }))).data
```

> `buildFormFromSchema` em `utils/autoForm.js` espera `{ app, model }`, não `{ module, schemaPath }` — ver [erros comuns](../troubleshooting/common-errors.md#app-model-required) antes de copiar este ficheiro para um novo recurso.

## 2. Rotas

Um ficheiro `<recurso>Routes.js` por recurso, com as 4 ações padrão e `requiredRole` a bater certo com os codenames de permissão do backend (`list_`, `add_`, `change_`, `view_` + nome do model):

```js
// pages/rh/cargo/cargoRoutes.js
export let cargoRoutes = [
  { path: '/list_cargo',   name: 'list_cargo',   component: () => import('./CargoLPage.vue'),
    meta: { title: tdc('Vista de')+' '+tdc('cargo'), requiresAuth: true, icon: 'list', requiredRole: 'list_cargo' } },
  { path: '/add_cargo',    name: 'add_cargo',    component: () => import('./CargoSEPage.vue'),
    meta: { requiresAuth: true, icon: 'add', requiredRole: 'add_cargo' } },
  { path: '/change_cargo/:id', name: 'change_cargo', component: () => import('./CargoSEPage.vue'),
    meta: { requiresAuth: true, icon: 'edit', requiredRole: 'change_cargo' } },
  { path: '/view_cargo/:id',   name: 'view_cargo',   component: () => import('./CargoVPage.vue'),
    meta: { requiresAuth: true, icon: 'visibility', requiredRole: 'view_cargo' } },
]
```

## 3. Agregação

O ficheiro de rotas do recurso é importado e espalhado no `routes.js` do módulo (`pages/rh/routes.js`), que por sua vez é espalhado em `src/router/routes.js` junto com `restRoutes`/`authRoutes`/`docsRoutes` do próprio `quasar_resaas`. Não há registo automático — um recurso novo sem este passo simplesmente não aparece no router.

## 4. Menu lateral (opcional)

Só é necessário se o recurso precisar de um painel lateral de contexto (`RightMenu.vue`). Regista-se em `src/core/rightMenus.js`:

```js
import CargoRightMenu from './../pages/rh/cargo/RightMenu.vue'
menu.registerRightMenu('view_cargo', CargoRightMenu)
```

A maioria dos recursos (caso do `Cargo` atual) não tem `RightMenu.vue` e pode ignorar este passo.

## 5. Permissões

`requiredRole` em cada rota e `:can="User.can"` em `<s-auto-crud>` devem corresponder aos codenames (`list`, `add`, `change`, `view`, `delete`) que o backend expõe para o model — ver `security/permissions.md` do django_resaas.
