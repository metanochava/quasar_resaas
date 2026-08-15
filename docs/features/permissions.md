# Permissões no Frontend

As permissões determinam a disponibilidade visual das ações.

Exemplo:

``` vue
<s-btn
  v-if="User.can('add_' + store.model.toLowerCase())"
  icon="save"
  label="Guardar"
/>
```

## Segurança

Esconder um botão não constitui segurança. O backend deve verificar
novamente a permissão em todas as operações protegidas.
