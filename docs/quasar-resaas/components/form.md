# Form (`s-form-two`)

`s-form-two` (`components/auto/FormTwo.vue`) é o formulário de página
inteira para criar/editar um registo. Ao contrário de `s-auto-form`, não
recebe `schema`/`module`/`model` diretamente — recebe a instância de
[store](../stores/base-store.md) já carregada.

## Props

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `store` | `Object` | — | Instância da store (ver [BaseStore](../stores/base-store.md)); expõe `form`, `row`, `model`, `saving` |
| `ignoreFields` | `Array` | `[]` | Campos a esconder do form |
| `leftCol` / `centerCol` / `rightCol` | `String` | `col-3` / `col` / `col-4` | Classes das colunas quando os slots `left`/`right` são usados |

## Slots

`header`, `left`, `center`, `right`, `footer` — quando ausentes, o
componente desenha o seu próprio cabeçalho (título + Cancelar/Guardar),
o formulário via `s-form` (engine) no centro, e o rodapé via
[`s-action-form`](action-form.md).

## Uso

``` vue
<s-form-two
  :store="cargoStore"
  :ignore-fields="['created_at', 'updated_at', 'created_by', 'updated_by']"
  @saved="onSaved"
/>
```

`isEdit` é calculado a partir de `store.form?.id`. O botão de gravar
(`add_<model>`) ou editar (`change_<model>`) só aparece se
`User.can(...)` autorizar — ver [Permissions](../features/permissions.md).

## Relação com outros componentes

- **`s-auto-form`** (`AutoForm.vue`) é o formulário em **diálogo/modal**,
  guiado por `schema` + `app`/`model` recebidos como props soltas em vez
  de uma store — usado dentro de `s-form-modal`.
- **`s-auto-crud`** (`AutoCrud.vue`) combina `s-auto-table` +
  `s-form-modal` (que embrulha `s-auto-form`) + `s-auto-filter` numa
  página de listagem completa. `s-form-two` é a alternativa de página
  dedicada (não-modal) ao mesmo fluxo de edição.

> ⚠️ Nota de versão: a API de `s-form-two` baseada em `store` é a atual
> no código-fonte. Consumidores a usar props soltas (`schema`, `module`,
> `model`, `data`, `can-do`) estão numa versão publicada anterior —
> verificar a versão instalada antes de copiar exemplos.
