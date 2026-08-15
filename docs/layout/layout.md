# Layout

Uma estrutura Quasar típica é:

``` text
q-layout
 ├─ q-header
 ├─ q-drawer
 ├─ q-page-container
 │    └─ router-view
 │         └─ q-page
 └─ footer / scroller
```

## Regra importante

`q-page` deve ser descendente de `q-page-container`.

Caso contrário, o Quasar apresenta:

``` text
QPage needs to be child of QPageContainer
```

## Elementos úteis

``` vue
<q-separator />
<q-space />
```
