# UserStore & contexto de tenant

`stores/UserStore.js` é criada com `createBaseStore('user', { app:
'django_resaas', model: 'User' }, {...})` — herda tudo de
[BaseStore](base-store.md) e acrescenta o essencial de autenticação e
multi-tenancy do lado do frontend.

## Sessão

-   `login(data, q)` — `POST login/`, guarda `access`/`refresh` em
    storage local (365 dias) e chama `me()`.
-   `me()` — `GET me/`, preenche `this.data` e muda o idioma ativo via
    `LanguageStore` se o backend devolver `language`.
-   `refreshToken()` / `isTokenExpired(token)` / `checkSession()` —
    renovação de token baseada no `exp` do JWT decodificado (sem
    verificar assinatura, só payload).
-   `logout(x)` — `x === 'N'` faz apenas logout local (ex.: 401 vindo
    do interceptor); caso contrário chama `POST logout/` e limpa todo
    o storage relacionado (tema, tokens, entidade/branch/grupo,
    permissões, credenciais "manter sessão").
-   `loadFromStorage()` — repõe todo o state (tema, tipografia,
    entidade/branch/grupo, tokens, permissões) a partir do
    `localStorage`/`sessionStorage` no arranque da app.

## Permissões

`Permissions` é um `Set` de strings em minúsculas. Os getters `can` e
`hasPermission` fazem o mesmo check:
`state.Permissions.has(String(perm).toLowerCase())`. É isto que
alimenta o prop `:can="User.can"` usado pelas páginas (ex.
`s-auto-crud :can="User.can"`).

## Contexto de tenant (`Entity` / `Branch` / `Group`)

O tenant ativo vive em três campos do `UserStore`: `Entity`, `Branch`,
`Group`. Mudar qualquer um passa por
`selectContext({ entity, branch, group })`, que:

1. atualiza o state e sincroniza `localStorage`
   (`userEntity`/`userBranch`/`userGroup`);
2. chama `refreshResaasContext()`.

`refreshResaasContext()` chama `createResaasContext` (ver abaixo) só
se houver `Entity.id`; caso contrário limpa o contexto
(`clearResaasContext()`).

## `services/tenantContext.js`

Gera e guarda o token de contexto enviado ao backend:

``` js
createResaasContext({ entity, branch, group })
// POST resaas/context/  { entity_id, branch_id, group_id }
// -> setResaasContext(data.token)   (sessionStorage, chave "resaasContext")
```

Este token é o equivalente, do lado do frontend, ao contexto de tenant
descrito em `django_resaas` (`entity_id`/`branch_id`/`group_id` — ver a
documentação do backend, `architecture/multi-tenancy.md`). O
interceptor de `services/api.js` lê-o com `getResaasContext()` e
envia-o em **todas** as chamadas autenticadas como
`X-RESAAS-Context` (ver [API & headers](../api/backend-integration.md)).
Sem `Entity` selecionada não há token de contexto, e portanto o
backend não sabe em que tenant filtrar os dados.

## `core/context.js`

Só guarda a instância de Pinia (`setPinia`/`getPinia`) para que
`base_store.js` e os serviços consigam aceder a stores fora de
componentes Vue. Não tem relação direta com o "contexto de tenant"
acima além do nome — não confundir os dois "contextos".
