# Permissões

O frontend não decide permissões — apenas espelha o que o backend
(`django_resaas`, ver a sua documentação de Permissões) já calculou. A UI
só esconde/mostra; a autoridade final continua a ser a API.

## `User.can()`

`UserStore` guarda os codenames do utilizador num `Set` e expõe dois
getters equivalentes:

```js
// stores/UserStore.js
Permissions: new Set(),           // state

hasPermission: (state) => (perm) => state.Permissions.has(String(perm).toLowerCase()),
can:           (state) => (perm) => state.Permissions.has(String(perm).toLowerCase()),
```

`Permissions` é reconstruído a partir do `localStorage`
(`userPermissions`) em `loadFromStorage()`. Uso típico numa página CRUD:

```vue
<!-- pages/rh/cargo/CargoLPage.vue -->
<s-auto-crud :module="module" :model="model" :can="User.can" route="view_cargo" />
```

`s-auto-crud`/`AutoTable`/`AutoForm` recebem `can` e decidem internamente
que ações mostrar (editar, apagar, criar) — ver
[`components/form.md`](form.md).

## Rotas

Por convenção, `meta.requiredRole` de cada rota é o próprio nome da rota
(`list_cargo`, `add_cargo`, ...) — ver [routing/routes.md](../routing/routes.md).
O guard de navegação do host verifica `User.can(to.meta.requiredRole)`
antes de permitir a entrada.

## Gestão de permissões por grupo

A tela real de administração é `pages/permission/PermissionManager.vue`,
ligada a `PermissionStore` (`usePermissionStore`, um
[`base_store`](../stores/base-store.md) com `app: 'auth'`, `model: 'Permission'`):

-   `initPermissions(all, groupPerms, group)` — carrega o universo de
    permissões e as do grupo selecionado.
-   `buildApps()` — agrupa permissões por app/model (a partir de
    `content_type.label`, formato `"App | Model"`) e aplica o filtro de
    pesquisa (`this.search`).
-   `hasPermission(id)` / `appState()` / `modelState()` — estado
    (marcado/indeterminado) para os checkboxes por app e por model.
-   `toggle(permission)` — chama `POST .../permissions/:id/addToGroup/`
    ou `.../removeFromGroup/`, com rollback otimista em caso de erro.

```text
q-checkbox (app)   ──toggleApp()──┐
q-checkbox (model) ──toggle()─────┼──> HTTPClient.post(...)
                                   └──> groupPermissions atualizado
```

`components/UserPermissioes.vue` e `components/PagePermissoes.vue`
existem como pontos de montagem (usados no dialog `pagepermissoes` do
`MainLayout`) mas estão ainda por implementar — apenas um título, sem
lógica. Não confiar neles como referência de comportamento.
