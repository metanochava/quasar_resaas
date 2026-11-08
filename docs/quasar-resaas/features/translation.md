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

  const traducao = store.TraducaoMap[chave]

  if (!traducao) return texto

  return capitalizeLike(String(texto).trim(), traducao)
}
```

-   Lookup key = the original text itself, lowercased — there are no
    `.json` translation files to maintain on the frontend.
-   The key is matched without case, so a row stored in lower case
    (`"exam request result": "resultado de pedido de exame"`) also answers
    `tdc('Exam request result')`. `capitalizeLike()` then gives the
    translation a capital when the original text starts with one
    ("Resultado de pedido de exame"). A lower-case text, used mid-sentence as
    in `tdc('Add') + ' ' + tdc('exam request result')`, keeps the
    translation as stored. A translation is never lowered.
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

## Backend messages (`Translate.tdc`)

Messages the backend translates (API errors and alerts, PDF texts) use
`Translate.tdc(request, text)` (`django_resaas/saas/core/utils/translate.py`).
It follows the same two rules as the frontend:

- **Language:** the `L` header that `services/api.js` sends carries the
  **Language id**. `Translate.tdc` resolves it to the code (`pt-pt`, …) that
  the `<app>/lang/<code>.py` modules and the `Translation` rows are keyed by.
  A code is accepted too. Until 2026-09-25 only a code worked, so every
  backend message stayed in English.
- **Key:** an exact match first. If there is none, the key is matched
  regardless of case and surrounding spaces, as `tdc()` does with its
  lowercase `TraducaoMap` ("Latest vital signs" finds "Latest Vital Signs").

Translations are cached for an hour (`translation:<code>`). A key added to a
`lang/*.py` module shows up after the cache expires or is cleared.

## `toPlural(word, count)`

A complementary utility, also in `services/translation.js`: pluralizes a
word based on `User.Language.code` (`pt-pt`, `en-en`), with a dictionary of
irregulars and simple morphological rules (endings in `ão`, `l`, `r/z`,
`m`, ...) for the rest. It doesn't depend on `TraducaoMap` — it's purely a
local grammar rule.
