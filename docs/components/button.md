# Componente s-btn

`s-btn` funciona como wrapper do `q-btn`.

Pode aplicar:

-   tradução automática do label;
-   `dense`;
-   `round`;
-   `flat`;
-   `outline`;
-   `unelevated`;
-   animações;
-   classes globais.

Exemplo conceptual:

``` vue
<q-btn
  v-bind="btnAttrs"
  :label="translatedLabel"
  :dense="attrs.dense ?? layout.button_dense"
  :round="attrs.round ?? layout.button_round"
/>
```

Ao diagnosticar botões com dimensões inesperadas, verificar tanto as
props recebidas como as configurações globais de layout.
