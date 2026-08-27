# Layout

The library provides two ready-made layouts (`MainLayout.vue`, `AuthLayout.vue`)
that the host mounts directly on the router — there are no slots to fill in,
composition happens via store/route, not props.

## AuthLayout

Minimal layout for public pages (`/auth/login`, `/welcome`): header (brand,
dark mode, fullscreen, language, services) + `router-view` + footer. No
drawers, no menus.

## MainLayout

``` text
q-layout
  |
  +-- q-header
  |     +-- toolbar: s-btn(menu) + HeaderBrand + spacer
  |     |            + HeaderDarkMode + HeaderFullScreen + HeaderLanguage
  |     |            + HeaderServices + HeaderNotifications + HeaderUser
  |     |            + s-btn(right menu)
  |     +-- q-bar: TopMenu (hidden on 'authwelcome'/'welcome')
  |
  +-- q-drawer (left)  -> LeftMenu
  +-- q-drawer (right) -> RightMenu
  +-- q-page-container -> router-view (with optional transition)
  +-- Footer (footer/MainFooter.vue)
```

Layout state lives in `UserStore`: `User.LeftTop` / `User.RightTop` control
the drawers and are persisted to `localStorage`
(`ui_left_menu`/`ui_right_menu`), as is the last visited route
(`last_route`) and the scroll position.

Global dialogs also live here: `User.Settings` (opens
`DefinicoesLayout`) and a page-permissions dialog
(`PagePermissoes` — still a placeholder, no logic).

## RightMenu — per-route contextual menu

`RightMenu.vue` → `RightMenuSegundo.vue` **dynamically** resolves which
component to show, from `MenuStore`:

```js
// RightMenuSegundo.vue
const component = computed(() => menu.rightMenus?.[route.name] || null)
```

`MenuStore.init()` (called automatically on first render) does:

```js
import('src/core/rightMenus').then(({ setupRightMenus }) => {
  setupRightMenus(this)
})
```

In other words: **the host is required to expose `src/core/rightMenus.js`**,
exporting a `setupRightMenus(menu)` function that registers a component per
route name via `menu.registerRightMenu(routeName, component)`. Real example
(`front/src/core/rightMenus.js`):

```js
import AtestadomedicoRightMenu from './../pages/saude/atestadomedico/RightMenu.vue'

export function setupRightMenus(menu) {
  menu.registerRightMenu('view_atestadomedico', AtestadomedicoRightMenu)
  menu.registerRightMenu('add_atestadomedico', AtestadomedicoRightMenu)
  menu.registerRightMenu('list_atestadomedico', AtestadomedicoRightMenu)
}
```

A page's `RightMenu.vue` has no special export contract — it's a normal Vue
component (`<script setup>`), typically combining `s-pdf-render` and a
`HistoryList` bound to the resource's store:

```vue
<!-- pages/saude/atestadomedico/RightMenu.vue -->
<template>
  <s-pdf-render v-model="Store.showPdf" :src="Store.pdf" title="Atestado Medico" />
  <HistoryList title="Atestado Medico" :store="Store" :actions="['pdf']" @action="onClick" />
</template>
```

If the current route has no registered menu, `RightMenuSegundo` just shows
an empty space — this isn't an error, it's the default state.

## LeftMenu / TopMenu

Navigation bars with a `Group` selector for the user
(`User.Group`/`User.Groups`, switched via `User.selectGroup()`) and a `home`
button. `TopMenu` is the compact variant shown in the header's `q-bar` when
the left drawer is closed.
