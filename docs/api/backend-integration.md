# Integração com o Backend

O frontend comunica com APIs REST e deve enviar o contexto necessário.

## Contexto multi-tenant

Normalmente:

-   `entity_type_id`
-   `entity_id`
-   `branch_id`
-   `group_id`
-   `lang_id`

## Pesquisa

``` text
GET /persons?search=metano&page=1&page_size=10
```

## Erros

As falhas podem ser apresentadas com Quasar Notify:

``` javascript
$q.notify({
  type: 'negative',
  icon: 'error',
  message: 'Não foi possível guardar.',
  position: 'top-right'
})
```

Os detalhes técnicos devem continuar disponíveis para depuração.
