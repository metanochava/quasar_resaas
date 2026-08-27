# Tradução

Coexistem **dois** sistemas de tradução na app, com responsabilidades
diferentes — não são intercambiáveis.

| | `vue-i18n` | `tdc()` (quasar_resaas) |
|---|---|---|
| Fonte | ficheiros estáticos (`src/i18n/en-US/index.js`, ...) | API do backend, por entidade/idioma |
| Conteúdo | textos fixos da interface | labels de modelos/campos vindos do `django_resaas` |
| Quando muda | build/deploy | em runtime, quando o utilizador troca de idioma |
| Uso | `$t('...')`, `useI18n()` | `tdc('texto')` |

O host (`front`) configura o `vue-i18n` normalmente em
`src/boot/i18n.js` (`createI18n(...)`). O `tdc()` da lib é independente
disso.

## `tdc(texto)`

```js
// services/translation.js
export const tdc = (texto = '') => {
  if (!getActivePinia()) return texto

  const store = useLanguageStore()
  const chave = texto?.toLowerCase()?.trim()

  return store.TraducaoMap[chave] || texto
}
```

-   Chave de lookup = o próprio texto original, em minúsculas — não há
    ficheiros `.json` de tradução a manter no frontend.
-   Se não houver Pinia ativo (ex. chamado fora de um componente/store) ou
    a chave não existir no mapa, devolve o texto original — nunca lança
    erro nem mostra chave em bruto.
-   Usado extensivamente em `meta.title` das rotas (ver
    [routing/routes.md](../routing/routes.md)) e em componentes soltos como
    `PagePermissoes.vue`.

## `TraducaoMap` — de onde vem

`LanguageStore.setTraducao(language)` busca
`django_resaas/languages/:id/translations`, achata o JSON de resposta
(seja qual for a profundidade de aninhamento) para um mapa plano
`{ chave_minuscula: valor }`, e guarda em `TraducaoMap`:

```text
GET django_resaas/languages/:id/translations
        |
        v
flattenTranslations(payload)   // recursivo, ignora arrays
        |
        v
TraducaoMap = { "nome": "Nome", "data de nascimento": "Birth date", ... }
```

`HeaderLanguage.vue` dispara a troca:
`Language.change(lang)` → `this.current = lang; this.setTraducao(lang)`.

## `toPlural(word, count)`

Utilitário complementar, também em `services/translation.js`: pluraliza
uma palavra consoante `User.Language.code` (`pt-pt`, `en-en`), com um
dicionário de irregulares e regras morfológicas simples (terminações em
`ão`, `l`, `r/z`, `m`, ...) para os restantes casos. Não depende de
`TraducaoMap` — é puramente uma regra gramatical local.
