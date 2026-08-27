# Translation

**Two** translation systems coexist in the app, with different
responsibilities — they are not interchangeable.

| | `vue-i18n` | `tdc()` (quasar_resaas) |
|---|---|---|
| Source | static files (`src/i18n/en-US/index.js`, ...) | backend API, per entity/language |
| Content | fixed interface text | model/field labels coming from `django_resaas` |
| When it changes | build/deploy | at runtime, when the user switches language |
| Usage | `$t('...')`, `useI18n()` | `tdc('text')` |

The host (`front`) configures `vue-i18n` normally in
`src/boot/i18n.js` (`createI18n(...)`). The library's `tdc()` is independent
of that.

## `tdc(text)`

```js
// services/translation.js
export const tdc = (texto = '') => {
  if (!getActivePinia()) return texto

  const store = useLanguageStore()
  const chave = texto?.toLowerCase()?.trim()

  return store.TraducaoMap[chave] || texto
}
```

-   Lookup key = the original text itself, lowercased — there are no
    `.json` translation files to maintain on the frontend.
-   If there's no active Pinia (e.g. called outside a component/store) or
    the key doesn't exist in the map, it returns the original text — it
    never throws or shows a raw key.
-   Used extensively in routes' `meta.title` (see
    [routing/routes.md](../routing/routes.md)) and in standalone components
    like `PagePermissoes.vue`.

## `TraducaoMap` — where it comes from

`LanguageStore.setTraducao(language)` fetches
`django_resaas/languages/:id/translations`, flattens the response JSON
(regardless of nesting depth) into a flat map
`{ lowercase_key: value }`, and stores it in `TraducaoMap`:

```text
GET django_resaas/languages/:id/translations
        |
        v
flattenTranslations(payload)   // recursive, ignores arrays
        |
        v
TraducaoMap = { "nome": "Nome", "data de nascimento": "Birth date", ... }
```

`HeaderLanguage.vue` triggers the switch:
`Language.change(lang)` → `this.current = lang; this.setTraducao(lang)`.

## `toPlural(word, count)`

A complementary utility, also in `services/translation.js`: pluralizes a
word based on `User.Language.code` (`pt-pt`, `en-en`), with a dictionary of
irregulars and simple morphological rules (endings in `ão`, `l`, `r/z`,
`m`, ...) for the rest. It doesn't depend on `TraducaoMap` — it's purely a
local grammar rule.
