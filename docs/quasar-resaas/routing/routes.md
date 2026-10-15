# Router

The library doesn't mount the app's `vue-router` — it exports plain route
arrays for the host to mount however it wants.

## Exported arrays

| Export | File | Contents |
|---|---|---|
| `authRoutes` | `router/authRoutes.js` | `/` (the EntityType site) and `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/resetpassword/:uidb64/:token` (in `AuthLayout`), and the compatibility redirect `/resetpassword/:uidb64/:token` → `resetPasswordConfirm` (reset links e-mailed before the backend used the `/auth/` route; the query string is dropped) |
| `restRoutes` | `router/restRoutes.js` | generic scaffold/crud + `entity`, `entity_type`, `group`, `branch`, `user`, `permission`, `employee` routes |
| `docsRoutes` | `router/docsRoutes.js` | `/docs/:product/:slug(.*)*`, mounted under its own `DocLayout` (not `MainLayout`) — see [documentation (docsRoutes)](../README.md) |

Each page group (`pages/entity/entityRoute.js`, etc.) exports its own array
(`entityRoutes`, ...) which `restRoutes` aggregates via spread.

## `meta` convention

```js
{
  path: '/list_entity',
  name: 'list_entity',
  component: () => import('./EntityLPage.vue'),
  meta: {
    title: tdc('View of') + ' ' + tdc('entity'),
    requiresAuth: true,
    icon: 'list',
    requiredRole: 'list_entity',
  },
}
```

-   `title` — passed through [`tdc()`](../features/translation.md), translated at runtime.
-   `requiresAuth` — required by the host's authentication guard.
-   `icon` — used by the menu (e.g. `TopMenu`/`LeftMenu`) when listing routes.
-   `requiredRole` — permission codename, checked with
    [`User.can()`](../features/permissions.md). By convention the route
    name matches `requiredRole` (`list_entity` → `list_entity`).

Navigation-only routes (e.g. `docsRoutes`, `/`) omit `requiredRole`.

## Route names the library relies on

The library navigates by name to three routes; `site` comes from `authRoutes`,
the host app must define the other two:

| Name | Path | Page | Used by |
|---|---|---|---|
| `dashboard` | `/dashboard` | the host's dashboards page (`IndexPage.vue`, `<s-dashboard-home/>`) | brand link, `TopMenu`/`LeftMenu` home button, `GroupSelector` after a profile change, `RegisterEntity`, `HeaderUser`, and `installAuthGuard` (`forbiddenRouteName`) when a route is not allowed |
| `site` | `/` | `EntityTypeSitePage.vue` (`authRoutes`) | `EntityStore` when the signed-in user has no Entity (or cancels choosing one) - it also clears the previous session's Entity hint |
| `welcome` | `/welcome` | the host's Entity welcome page | `GroupStore` / `BranchStore` after the Entity is chosen, before a profile |

`MainLayout` hides the top q-bar and the left menu on `welcome`, and does not
store it as the user's last route.

## `/` - the site of the host's EntityType

`authRoutes` starts with `/` (name `site`): `pages/EntityTypeSitePage.vue`
inside `AuthLayout` (the login's header and footer, whose look is the
EntityType's theme/layout configured in the backend).

1. The page reads the EntityType catalogue (`GET django_resaas/entitytypes/`,
   PUBLIC list: `id`, `name`, `label`, `icon`, `ordem`).
2. It picks this host's type with `findEntityType()` (`utils/entityTypeHost.js`,
   the same rule as the header's services menu): the first subdomain label
   (`saude.example.com` → `Saude`, `www` skipped) or, on an IP address, the
   first path segment. The comparison ignores case.
3. It loads that type's theme, layout, typography and animation
   (`EntityTypeStore.getLayoutSettings(id, { force: true })`, PUBLIC reads), so
   the page wears the type's colours (`--q-primary`, `--q-secondary`,
   `--q-accent`, set on `body` by `applyTheme()`).
4. It renders the site an application registered for the type, or the
   generic one, `components/site/EntityTypeDefaultSite.vue`.

**Who is looking** (props `signedIn` and `hasEntity`, from `UserStore`):

| Visitor | Hero call to action |
|---|---|
| Not signed in | Sign In / Create Account |
| Signed in, working in an Entity (`User.Entity`) | Open dashboard |
| Signed in, no Entity | a notice ("not linked to any organisation yet - ask an administrator") and Logout (`@logout` → `UserStore.logout()`); the closing call band is hidden |

The no-Entity case is where `EntityStore` sends a user with no Entity after the
login. Hooks: `site-dashboard`, `site-no-entity`, `site-logout`. A host that
   matches no type shows the list of sectors, each linking to its subdomain
   (`entityTypeUrl()`).

### The content is code of the application (`registerEntityTypeSiteContent`)

`EntityTypeDefaultSite.vue` draws everything from the content the application
registered for the type's `name` (case-insensitive). It is never stored in the
database: the backend only serves the catalogue and the Theme.

```js
// dev/front: src/entity-type-sites/saude.js + index.js, boot/entity_type_sites.js
import { registerEntityTypeSiteContent } from 'quasar_resaas'

registerEntityTypeSiteContent('Saude', {
  layout: 'orbit',
  hero: { title: 'Care for your patients, not the paperwork', icons: ['medical_services'] },
  faq: { title: 'Frequently asked questions', items: [{ question: '…', answer: '…' }] },
})
```

Every key is optional; texts are canonical English, translated with `tdc()`.
Their pt/es/fr translations go to the backend's static lang files
(django_resaas `saas/lang/{ptpt,eses,frfr}.py`, or the lang files of the
application's own module), the same as any other frontend string - see django_resaas
[Public sites](../../django-resaas/features/public-sites.md#entity-type-sites).
The content of the other types is read from the same registry (the sector
list shows each one's `hero.title`).

| Key | Renders |
|---|---|
| `layout` | The look: `orbit` (default; the type's icon orbited by `hero.icons`), `centered` (one column, icon chips, a wave), `split` (deep striped hero with a card listing the first four features; accent on the call to action), `mosaic` (the other sectors as floating tiles). An unknown value is `orbit` |
| `hero` | `eyebrow`, `title`, `subtitle`, `badges[]`, `icons[]` (Material icon names, up to 6) |
| `stats[]` | `{value, label}` band under the hero |
| `features` | `title`, `subtitle`, `items[]` of `{icon, title, text}` |
| `steps` | `title`, `items[]` of `{title, text}` |
| `faq` | `title`, `items[]` of `{question, answer}` |
| `cta` | `title`, `text` - the closing band |
| `show_sectors` | `true` lists the other types (the platform's own site) |

Without content the page shows "Welcome to {name}" (or "Choose your sector"),
Sign In / Create Account, or Open dashboard when signed in. Colours come from
the type's Theme (`primary`, `secondary`, `accent`), never from the content.
Hooks: `entity-type-default-site` (with `data-layout`), `site-title`,
`site-stats`, `site-features`, `site-steps`, `site-sectors`, `site-faq`,
`site-cta`.

### Override: a site per EntityType in code

An application may still replace the body for a type (lazy):

```js
import { registerEntityTypeSite } from 'quasar_resaas'

registerEntityTypeSite('Saude', () => import('./sites/SaudeSite.vue'))
```

A registered site gets the props `entityType`, `entityTypes` and `signedIn`
and renders only the body (no header/footer). Only public data reaches this
page; it never needs a session. Tests: `services/entityTypeSites.spec.js`,
`utils/entityTypeHost.spec.js`.

| Symptom | Check |
|---|---|
| `/` shows the list of sectors on a type's host | The subdomain's first label must equal the EntityType `name` (e.g. `farmacia.…` needs a type named `Farmacia`) |
| Only "Welcome to {name}" | No content registered for that `name`: check the `registerEntityTypeSiteContent` key and that its boot file is in `quasar.config.js` |
| All types look the same | Their Themes have the same `primary`/`secondary`/`accent`; set them with `manage.py load_entity_type_themes` |
| Texts stay in English | The key is missing from the static lang files (exact English text), the backend copy was not updated, or the browser still holds the old translation map (sign out/in or switch language) |
| The generic site instead of the application's | `registerEntityTypeSite` name differs from the EntityType `name`, or the registering module is not imported |
| Endless loading | The API is unreachable (a 502 shows in the console as a CORS error) |

> **Breaking change (renamed routes).** Before, these were `home` (`/home`,
> dashboards), `welcome` (`/welcome`, no Entity) and `authwelcome`
> (`/authwelcome`, Entity welcome). A host app must rename its own routes to
> `dashboard` and `welcome` together with this version; `dev/front` keeps
> `/authwelcome` as a redirect to `welcome`.

> **Breaking change (`home` removed).** `/home` (`WelcomeGuestPage.vue`, the
> start page of a signed-in user without an Entity) no longer exists: the site
> at `/` handles that user. `/home` is a "not found" now; a host that navigates
> to `{ name: 'home' }` must use `{ name: 'site' }`. `WelcomeGuestPage.vue` was
> deleted.

## Mounting in the host

Confirmed in `/var/www/dev/front/src/router/routes.js` — the app consumes
the three arrays exactly as the README describes:

```js
import { restRoutes, authRoutes, docsRoutes } from 'quasar_resaas'
import { MainLayout, CrudPage } from 'quasar_resaas'

routes = [
  ...authRoutes,
  ...docsRoutes,
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '/dashboard', component: () => import('src/pages/IndexPage.vue'), name: 'dashboard' },
      { path: 'welcome', component: () => import('src/pages/WelcomePage.vue'), name: 'welcome' },
      { path: 'crud', component: CrudPage, name: 'crud_state' },
      { path: 'crud/:module/:model/go', component: CrudPage, name: 'crud_route' },
      ...restRoutes,
      ...stockRoutes,
      ...saudeRoutes,
      ...vendasRoutes,
    ],
  },
]
```

> [!NOTE]
> `docsRoutes` is a **top-level** entry (its own `DocLayout`, no app
> chrome) — it must sit alongside `authRoutes`, never nested inside
> `MainLayout`'s `children`. It used to be spread into `restRoutes` itself;
> that's no longer the case, so a host project upgrading past that change
> needs this import added explicitly, exactly as shown above.

The app's own module routes (`rhRoutes`, `saudeRoutes`, ...) follow the same
`meta` convention as the library's routes — there's no special handling.

## "Not found" route

`restRoutes` includes `/route/:route/:id` → `RotaEnexistente.vue`, used as
the fallback target when a resource route doesn't exist.
