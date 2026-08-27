# Layout

A lib fornece dois layouts prontos (`MainLayout.vue`, `AuthLayout.vue`) que o
host monta diretamente no router — não há slots a preencher, a composição é
feita por store/route, não por props.

## AuthLayout

Layout mínimo para páginas públicas (`/auth/login`, `/welcome`): header
(marca, dark mode, fullscreen, idioma, serviços) + `router-view` + footer.
Sem drawers, sem menus.

## MainLayout

``` text
q-layout
  |
  +-- q-header
  |     +-- toolbar: s-btn(menu) + HeaderBrand + espaço
  |     |            + HeaderDarkMode + HeaderFullScreen + HeaderLanguage
  |     |            + HeaderServices + HeaderNotifications + HeaderUser
  |     |            + s-btn(menu direito)
  |     +-- q-bar: TopMenu (escondido em 'authwelcome'/'welcome')
  |
  +-- q-drawer (left)  -> LeftMenu
  +-- q-drawer (right) -> RightMenu
  +-- q-page-container -> router-view (com transição opcional)
  +-- Rodape (footer/MainFooter.vue)
```

Estado do layout vive em `UserStore`: `User.LeftTop` / `User.RightTop`
controlam os drawers e são persistidos em `localStorage`
(`ui_left_menu`/`ui_right_menu`), tal como a última rota visitada
(`last_route`) e a posição de scroll.

Diálogos globais também vivem aqui: `User.Settings` (abre
`DefinicoesLayout`) e um dialog de permissões de página
(`PagePermissoes` — ainda placeholder, sem lógica).

## RightMenu — menu contextual por rota

`RightMenu.vue` → `RightMenuSegundo.vue` resolve **dinamicamente** qual
componente mostrar, a partir de `MenuStore`:

```js
// RightMenuSegundo.vue
const component = computed(() => menu.rightMenus?.[route.name] || null)
```

`MenuStore.init()` (chamado automaticamente no primeiro render) faz:

```js
import('src/core/rightMenus').then(({ setupRightMenus }) => {
  setupRightMenus(this)
})
```

Ou seja: **o host é obrigado a expor `src/core/rightMenus.js`**, exportando
uma função `setupRightMenus(menu)` que regista um componente por nome de
rota via `menu.registerRightMenu(routeName, component)`. Exemplo real
(`front/src/core/rightMenus.js`):

```js
import AtestadomedicoRightMenu from './../pages/saude/atestadomedico/RightMenu.vue'

export function setupRightMenus(menu) {
  menu.registerRightMenu('view_atestadomedico', AtestadomedicoRightMenu)
  menu.registerRightMenu('add_atestadomedico', AtestadomedicoRightMenu)
  menu.registerRightMenu('list_atestadomedico', AtestadomedicoRightMenu)
}
```

Um `RightMenu.vue` de página não tem contrato especial de export — é um
componente Vue normal (`<script setup>`), tipicamente combinando
`s-pdf-render` e um `HistoryList` ligado à store do recurso:

```vue
<!-- pages/saude/atestadomedico/RightMenu.vue -->
<template>
  <s-pdf-render v-model="Store.showPdf" :src="Store.pdf" title="Atestado Medico" />
  <HistoryList title="Atestado Medico" :store="Store" :actions="['pdf']" @action="onClick" />
</template>
```

Se a rota atual não tiver menu registado, `RightMenuSegundo` mostra apenas
um espaço vazio — não é erro, é o estado por omissão.

## LeftMenu / TopMenu

Barras de navegação com seletor de `Group` do utilizador
(`User.Group`/`User.Groups`, troca via `User.selectGroup()`) e um botão
`home`. `TopMenu` é a variante compacta mostrada na `q-bar` do header
quando o drawer esquerdo está fechado.
