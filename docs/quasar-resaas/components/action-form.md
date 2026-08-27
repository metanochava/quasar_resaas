# ActionForm (`s-action-form`)

`s-action-form` (`components/auto/ActionForm.vue`) é a barra de ações
(Cancelar/Repor/Editar/Eliminar/Guardar) usada no rodapé de
[`s-form-two`](form.md) e de qualquer outro formulário orientado a uma
`store`.

## Props

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `store` | `Object` | *obrigatório* | Store do recurso; usa `store.model`, `store.saving`, `store.row`/`store.form` |
| `reform` | `Object` | `null` | Objeto de formulário externo (ex.: `resetForm()`, `delete()`) — se ausente, cai para `store` |
| `buttons` | `Array` | `['cancel','reset','edit','delete','save']` | Que botões mostrar |

## Emits

`save`, `cancel`, `reset`, `delete`

## Comportamento

- `isEdit` = `!!(store.row?.id || store.form?.id)`; **Editar** só é
  visível em edição, **Guardar** só em criação.
- Cada botão é protegido por permissão: Eliminar exige
  `delete_<model>`, Editar exige `change_<model>`, Guardar exige
  `add_<model>` — ver [Permissions](../features/permissions.md).
- `reset` chama `reform.resetForm()` se existir; `delete` chama
  `reform.delete()` ou, na sua falta, `store.delete()`.

## Uso

``` vue
<s-action-form
  :store="cargoStore"
  :buttons="['cancel', 'save']"
  @cancel="goBack"
  @save="save"
/>
```
