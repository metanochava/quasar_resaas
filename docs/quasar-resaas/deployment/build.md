# Build & Instalação

## Como é publicado

`quasar_resaas` não vai ao npm — é consumido diretamente do GitHub:

```json
// front/package.json
"quasar_resaas": "github:metanochava/quasar_resaas"
```

Consequência prática: não há semver. `npm install` fixa o commit da branch por defeito (normalmente `main`) na altura da instalação; para apanhar commits novos da lib é preciso `npm update quasar_resaas` (ou remover `node_modules/quasar_resaas` + reinstalar), não basta correr `npm install` outra vez.

## CommonJS num host ESM

`package.json` da lib declara:

```json
"type": "commonjs",
"main": "index.js",
"exports": {
  ".": "./index.js",
  "./auto-imports": "./auto-imports.cjs",
  "./core/*": "./core/*"
}
```

enquanto `front/package.json` é `"type": "module"`. O Vite (usado pelo `@quasar/app-vite`) resolve isto na maior parte dos casos porque interpreta o `exports` map e faz interop CJS→ESM automaticamente — mas qualquer `require()` dentro da própria lib (ex.: `services/token.js`, `boot/cripto.js` usam `require('crypto-js')` em vez de `import`) só funciona porque o ficheiro onde estão é tratado como CJS pelo `"type": "commonjs"` da lib. Copiar esse padrão para código novo dentro do host (`front`, que é ESM) não funciona.

## Auto-imports

`quasar.config.js` do host importa o mapa de auto-imports da lib e regista-o junto dos presets do `unplugin-auto-import`:

```js
import RESAAS_AUTO_IMPORTS from 'quasar_resaas/auto-imports'
// ...
imports: [
  'vue', 'vue-router', 'pinia', /* ... */,
  { quasar_resaas: RESAAS_AUTO_IMPORTS }
]
```

`auto-imports.cjs` só exporta *nomes* (`useUserStore`, `HTTPAuth`, `tdc`, …) — a lista de stores/API/utils disponíveis sem `import` explícito nas SFCs. Só cobre o que está listado ali; um export novo em `index.js` da lib que não seja também adicionado a `auto-imports.cjs` continua a exigir `import { X } from 'quasar_resaas'` manual.

## Passos de instalação num host novo

```bash
npm install
# postinstall corre automaticamente:
quasar prepare
```

`quasar prepare` gera `src/auto-imports.d.ts` (declarações para o editor) a partir da configuração acima — sem isto o editor não reconhece os globais da lib, mas o build continua a funcionar.

## Componentes globais

Os componentes `s-*` (ver `components/button.md`, `components/form.md`) só existem depois de o host chamar explicitamente o `Components` exportado pela lib dentro de um dos seus próprios boot files — não é algo que aconteça por adicionar a lib ao array `boot` do `quasar.config.js` (esse array só aceita ficheiros dentro de `src/boot` do host):

```js
// front/src/boot/theme_engine.js
import { Components } from 'quasar_resaas'
export default ({ app }) => { Components({ app }) }
```

e esse boot próprio (`theme_engine`) tem de estar listado em `quasar.config.js`:

```js
boot: ['pinia', 'quasar_saas', 'i18n', 'axios', 'app_ready', 'theme_engine']
```

Sem isto, `<s-auto-crud>`/`<s-btn>`/etc. nas SFCs falham com "Failed to resolve component" no build/dev.

Da mesma forma, `setPinia()` (ver `stores/base-store.md`) é chamado no boot `quasar_saas.js` do host, não pela lib sozinha — omitir este passo faz `getPinia()` lançar `Pinia not initialized` na primeira store acedida.
