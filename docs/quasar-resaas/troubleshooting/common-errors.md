# Troubleshooting Frontend

## `app/model required`

Mensagem lançada em `utils/autoForm.js`, função `buildFormFromSchema`. Acontece se a chamada não passar `app` e `model`:

```js
// ERRADO — module/schemaPath não existem na assinatura da função
await buildFormFromSchema({ module, model, schemaPath })

// CORRETO
await buildFormFromSchema({ app: module, model })
```

Ver [api/backend-integration.md](../api/backend-integration.md#schema-de-formulário).

## `Pinia not initialized. Call setPinia(pinia) in boot.`

Lançado por `core/context.js` → `getPinia()`, chamado internamente por todas as stores da lib. Falta o boot do host a chamar `setPinia(pinia)` — ver [deployment/build.md](../deployment/build.md).

## `Entity is required` / `RESAAS context token was not returned`

Lançados por `services/tenantContext.js` → `createResaasContext()`:
- `Entity is required` — chamada sem `entity`;
- `RESAAS context token was not returned` — o endpoint `resaas/context/` respondeu sem `token` no corpo (backend a rejeitar a combinação entity/branch/group, ou resposta inesperada).

Sem um `X-RESAAS-Context` válido, os pedidos seguintes ao backend não têm entidade/sucursal ativa — ver [api/backend-integration.md](../api/backend-integration.md#contexto-de-tenant-x-resaas-context).

## `401` em qualquer pedido autenticado

O interceptor de resposta em `services/api.js` chama automaticamente `useUserStore().logout('N')` em qualquer `401`. Se o utilizador for expulso da sessão inesperadamente, confirmar primeiro se o `access` token em `localStorage`/`User.access` ainda é válido antes de suspeitar de permissões.

## "Failed to resolve component: s-..."

Componentes `s-*` não registados — falta o boot que chama `Components({ app })`. Ver [deployment/build.md](../deployment/build.md).

## Erros silenciosos nas stores (`console.error` sem lançar)

`EntityStore.js`, `EntityTypeStore.js`, `PermissionStore.js` e `UserStore.js` capturam falhas de rede/API com `try/catch` e só fazem `console.error('<ação> error', e)` — a UI não recebe automaticamente feedback de erro nestes casos (`getSettings`, `loadGroups`, `toggleGroup`, `createGroup`, `getUserEntitys`, `savePermissions`, entre outros). Se uma ação parece "não fazer nada" sem mensagem visível, verificar primeiro a consola do browser antes de assumir que o pedido nunca foi feito.
