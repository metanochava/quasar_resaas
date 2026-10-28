# Layout

The library provides two ready-made layouts (`MainLayout.vue`, `AuthLayout.vue`)
that the host mounts directly on the router — there are no slots to fill in,
composition happens via store/route, not props.

## AuthLayout

Minimal layout for the public pages (`/` - the EntityType site -,
`/auth/login`, `/auth/register`, `/auth/forgot-password`): header (brand,
dark mode, fullscreen, language, services, the notifications
(`HeaderNotifications`) only **while signed in** (`User.isSignedIn()`:
`User.isLogin`, or a stored refresh token that has not expired; a leftover
expired or invalid token does not count, so the login page never shows them),
and always the user menu - for a visitor only Register and Login - (`HeaderUser`: profile, Entity / Branch /
profile choice - the Entity and Branch entries only when the user has at least
one, and the actions Go to site (`/`, `header-site`), Settings
(`header-settings`), Appearance (`header-appearance`) and Logout - each in its own Theme colour:
`primary`, `secondary`, `accent`, `negative`) as
MainLayout) + `router-view` + footer. No drawers, no menus.

**Its look.** On mount it applies a theme:

1. signed in with an Entity → the Entity's theme
   (`EntityStore.getLayoutSettings`; those endpoints need a session);
2. otherwise → the theme of **this host's EntityType** (`findEntityType()`
   over the PUBLIC EntityType list, then
   `EntityTypeStore.getLayoutSettings(id, { force: true })`), so
   `saude.example.com/#/auth/register` wears Saude's colours on a direct load.

The page area (`.auth-bg`) is a very translucent wash of the theme's
`primary`/`secondary` (about 4-10%, darker in dark mode); the login
(`FormLogin`), register and forgot-password cards are light glass panels over
it. Colours come only from the Theme (`--q-primary`, `--q-secondary`), never
hardcoded per type.

The login page keeps its own configurable background (`login_config` of the
Entity, else of the EntityType: ThemeSurface area `login` - image, gradient
or colour, plus overlay); when none is configured it is transparent, so the
wash above shows. Before, that default was opaque white/`#121212`.

### Very small screens (xs, below 600px)

Both layouts hide `HeaderDarkMode`, `HeaderFullScreen` and `HeaderLanguage`
(Quasar class `gt-xs`) and the user menu (`HeaderUser`) shows the same three as
menu items instead (`components/header/HeaderPreferences.vue`): a Dark mode
switch, a Full screen switch (only where the browser supports it -
`document.fullscreenEnabled`; not on iPhone Safari) and Language (the list,
current one ticked). The hidden buttons stay mounted on purpose: `HeaderDarkMode`
restores the saved dark mode and `HeaderLanguage` keeps Quasar's language in
step. The items do what the buttons do (`$q.dark` + `localStorage` `dark`,
Fullscreen API, `Language.change` + `User.setLanguage`); they are 48px tall for
touch. Tests: `components/header/HeaderPreferences.spec.js`.

## MainLayout

``` text
q-layout
  |
  +-- q-header
  |     +-- toolbar: s-btn(menu) + HeaderBrand + spacer
  |     |            + HeaderSite + HeaderDarkMode + HeaderFullScreen + HeaderLanguage
  |     |            + HeaderServices + HeaderNotifications + HeaderUser
  |     |            + s-btn(right menu)
  |     +-- q-bar: TopMenu (hidden on 'welcome')
  |
  +-- q-drawer (left)  -> LeftMenu
  +-- q-drawer (right) -> RightMenu
  +-- q-page-container -> router-view (with optional transition)
  +-- Footer (footer/MainFooter.vue)
```

Layout state lives in `UserStore`: `User.LeftTop` / `User.RightTop` control
the drawers and are persisted to `localStorage`
(`ui_left_menu`/`ui_right_menu`), as is the scroll position. The last
visited route is stored **per user** (`getUserPreference`/`setUserPreference`,
key `resaas:v1:user:<id>:pref:last_route`) and restored only for that user.
Another user signing in on the same browser never lands on it, and logout
removes it ([Persistence](../stores/persistence.md#logout)). The old shared
`last_route` key is deleted on the next load.

### Header brand and website button

`components/header/HeaderBrand.vue` (`s-header-brand`) shows the Entity's logo
and name (or the EntityType's icon and name before an Entity is chosen). With
`to` (`MainLayout` passes `{ name: 'dashboard' }`) logo and name are one link to that
route; without it (`AuthLayout`) it is a plain brand. A name that does not fit
stays on one line and is cut with an ellipsis (`…`), so the header never grows;
the tooltip shows the full name (and the Branch, when there is one).

### Browser tab icon (favicon) and title

The tab icon is chosen like the header brand: the logo of the active Entity
or, before an Entity is chosen (or when it has no logo), the icon of its
EntityType (Saude, Farmacia, ...) - one or the other, never both. `MainLayout`
and `AuthLayout` call `useBrandFavicon()` (`composables/useBrandIcon.js`,
exported from the package):

- the logo is `User.Entity.logo.url` (the selected Entity);
- the EntityType is the one of the selected Entity (`User.Entity.entity_type`,
  `{id, value, label}`) or, before an Entity is chosen, the EntityType of the
  host (`User.EntityType`, set by `AuthLayout`). Its icon is the square PNG the
  backend already serves for the installable app:
  `GET django_resaas/entitytypes/{id}/app_icon/?size=192` - a PUBLIC read
  (`public_actions` of the EntityType view), so it also works on the login page;
- every `<link rel="icon">` of `index.html` points at it; with no brand (or
  when the layout unmounts) the original icons and types come back. A page
  with no icon link gets one.

`setFavicon(href)` is the low-level helper (`null` restores the index.html
icons): an application's own site layouts use it for the logo of their
institution. `useBrandIcon()` gives the same URL (`iconUrl`) to any component
that needs it. Tests: `composables/useBrandIcon.spec.js`.

The tab title comes from `installPageTitle(router, options)`
(`services/pageTitle.js`): by default `"<page title> | <app name>"`, the app
name being the `<title>` of index.html. With `{ suffix: false }` the page
title is shown alone, and the app name only for a page without a title.
Tests: `services/pageTitle.spec.js`.

Troubleshooting: the tab keeps the default icon when no brand is known yet (no
Entity selected and the host is not an EntityType domain), or shows the
browser's fallback when the EntityType has no readable image (`app_icon`
answers 404).

The footer (`components/footer/MainFooter.vue`) follows the same rule: the
copyright line (`© <since> - <year> <EntityType>: <Entity>`) is one line cut with
an ellipsis, with the full text as its `title`, and "Send comment or feedback"
keeps its place on the right. Tests: `components/footer/MainFooter.spec.js`.

`components/header/HeaderSite.vue` (`s-header-site`, a globe icon `public`, just
before the dark-mode button) opens the current Entity's website
(`User.Entity.site`: the selected Entity comes from
`django_resaas/users/{id}/userEntitys/`, which carries `site`; before sign-in,
from the public `site/` endpoint). The selected Entity is cached in
`localStorage` (`userEntity`), so after the backend starts sending `site` the
user must select the Entity again (or sign in again) to see the button. It is shown only when the Entity has a site:

| Click | Double click |
|---|---|
| the site in **this tab** (after 250 ms, so a double click can claim it) | the site in a **new tab** only (`noopener`) |

The rule lives in `composables/useEntitySite.js` (`useEntitySite()`,
`safeSiteUrl()`): only an absolute `http(s)` URL is followed; any other value
(`javascript:`, a relative path) hides the button. Tests:
`components/header/HeaderSite.spec.js`, `components/header/HeaderBrand.spec.js`.

### Left menu search

`SearchMenu.vue` (the field on top of the left menu) filters `User.AllMenus`
into `User.Menus` as the user types (`User.search`):

- A menu matches by what the user reads (its translated label, and the plural
  shown in the submenus) or by its canonical name. The match is case- and
  accent-insensitive (`utils/highlight.js`). A matching group keeps all its
  children; otherwise only the path to a match is kept.
- `LeftMenuSegundo.vue` opens every app left by the filter, and `SubMenu.vue`
  shows sub-menus inline instead of as a popup while searching. Clearing the
  search closes them again.
- The matching part of each label is highlighted (`HighlightText`).

Global dialogs also live here, as two deliberately separate modals/toggles
— "my account" and "how this entity looks for everyone" are not the same
screen:

- `User.Settings` (`User.toggleSettings()`) opens `UserAccountModal` — the
  logged-in user's own profile/security (personal data, password, phone
  number).
- `User.ThemeStudio` (`User.toggleThemeStudio()`, header **Appearance**) opens the
  Theme Studio at the **user** level - the signed-in user's personal look. See
  [Theme Management](../features/theme-studio.md).

> [!NOTE]
> There's also a page-permissions dialog (`PagePermissoes`) mounted here —
> still a placeholder, no logic.

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

> [!NOTE]
> If the current route has no registered menu, `RightMenuSegundo` just
> shows an empty space — this isn't an error, it's the default state.

## LeftMenu / TopMenu

Navigation bars with a `Group` selector for the user
(`User.Group`/`User.Groups`, switched via `User.selectGroup()`) and a `home`
button. `TopMenu` is the compact variant shown in the header's `q-bar` when
the left drawer is closed.
