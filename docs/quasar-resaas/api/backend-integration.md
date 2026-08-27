# Integração com o Backend

## Cliente HTTP

`services/api.js` cria quatro instâncias axios sobre `apiBaseUrl` (`${process.env.API}/${process.env.API_PREFIX}`):

```
HTTPClient      // sem autenticação
HTTPClientBlob  // sem autenticação, resposta blob
HTTPAuth        // autenticado
HTTPAuthBlob    // autenticado, resposta blob (ex.: PDF)
```

O helper `url({ type, url, params })` monta o URL final. `type: 'nu'` insere o nome do `EntityType` ativo no path (`.../<entityType>/<url>`); `type: 'u'` não insere.

## Cabeçalhos enviados em cada pedido

O interceptor de request em `createClient()` acrescenta, quando `auth: true`:

| Header | Origem | Propósito |
|---|---|---|
| `Authorization: Bearer <token>` | `User.access` ou `localStorage` (`access`) | autenticação JWT |
| `X-RESAAS-Context` | `sessionStorage` (`resaasContext`) | token de contexto de tenant (ver abaixo) |
| `L` | `sessionStorage` (`userLang`) | id do idioma ativo |
| `fek` / `fep` | `process.env.FRONT_END_KEY` / `FRONT_END_PASSWORD` | chave/senha de aplicação (identifica o front perante o backend, independente do utilizador) |

Em erro `401`, o próprio interceptor chama `useUserStore().logout('N')`.

## Contexto de tenant (`X-RESAAS-Context`)

O backend (django_resaas, doc `architecture/multi-tenancy.md` — `entity_id`, `branch_id`, `group_id`) não recebe esses ids em cada pedido individual. O frontend troca-os **uma vez** por um token opaco:

```js
// services/tenantContext.js
await createResaasContext({ entity, branch, group })
// POST resaas/context/  { entity_id, branch_id, group_id }
// -> { token } guardado em sessionStorage como X-RESAAS-Context
```

Todos os pedidos autenticados seguintes reenviam esse token no header `X-RESAAS-Context`, e é o backend quem o decodifica para aplicar os filtros de `entity_id`/`branch_id` descritos em multi-tenancy.md. Sem este token, o backend não sabe qual entidade/sucursal aplicar.

`createResaasContext` lança:
- `Entity is required` — se chamado sem `entity`;
- `RESAAS context token was not returned` — se a resposta do backend não trouxer `token`.

## Schema de formulário

`buildFormFromSchema({ app, model, fetchRelationOptions })` (`utils/autoForm.js`) pede o schema do model ao backend:

```
GET django_resaas/resaasapps/{app}/{model}/schema/
```

e converte cada campo (`ForeignKey`, `CharField`, `IntegerField`, …) em props Quasar (`rules`, `options`, componente `s-input`/etc.), incluindo `onFilter` assíncrono com cache e debounce (350ms) para campos de relação, que por omissão pesquisam em:

```
GET django_resaas/relations/?model={relation}&search={termo}
```

Lança `app/model required` se `app` ou `model` não forem passados — ver [troubleshooting](../troubleshooting/common-errors.md#app-model-required).

## Ver também

- [Autenticação e criação de recurso](../development/creating-resource.md)
- [Erros comuns](../troubleshooting/common-errors.md)
