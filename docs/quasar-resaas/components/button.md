# s-btn

`s-btn` (`components/engine/BtnComponent.vue`) é um wrapper fino sobre
`q-btn` que aplica automaticamente o [theme engine](../layout/layout.md)
e a [tradução](../features/translation.md) — não introduz nenhuma prop
de permissão própria.

## O que faz

- Traduz `label` com `tdc(label)` automaticamente.
- Aplica `dense`, `round` e o estilo (`flat`/`outline`/`unelevated`/
  `push`) a partir das preferências de layout do utilizador
  (`User.ps.layout`), salvo se a prop correspondente for passada
  explicitamente.
- Aplica animação (`ripple` ou `pulse`) a partir de
  `User.ps.animation`.
- Todas as restantes props (`color`, `icon`, `loading`, `type`,
  `@click`, ...) passam diretamente para o `q-btn` subjacente.

## Não faz permission-gating

Ao contrário do que o nome poderia sugerir, `s-btn` **não** esconde-se
sozinho por permissão. Quem chama decide isso com `v-if`:

``` vue
<s-btn
  v-if="User.can('delete_' + model.toLowerCase())"
  color="negative"
  icon="delete"
  :loading="store.saving"
  :label="tdc('Delete')"
  @click="deleteRecord"
/>
```

Este é o padrão usado em [`s-action-form`](action-form.md) e
[`s-form-two`](form.md) para todos os botões de CRUD.

## Uso simples

``` vue
<s-btn color="primary" icon="save" label="Save" @click="save" />
```
