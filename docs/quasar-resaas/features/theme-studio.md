# Theme Management (Theme Studio)

`components/theme/ThemeStudioEngine.vue` (`s-theme-studio`), logic in
`components/theme/useThemeStudio.js`. Backend contract: django_resaas
[Themes](../../django-resaas/features/themes.md).

## The level is fixed by the screen that opens it

There is no level selector: each screen passes its `scope`.

| Opened from | `scope` | Edits | Text shown |
|---|---|---|---|
| EntityType page (`EntityTypeSEPage`) | `entity_type` | the type's default look | "Default appearance of every Entity of this type..." |
| Entity page (`EntitySEPage`) | `entity` | the organisation's look | "Appearance of this organisation for all its users..." |
| User page (`UserSEPage`) and header **Appearance** (`MainLayout`, `User.ThemeStudio`) | `user` | the user's personal look | "Your personal appearance: only you see it..." |

Empty values inherit from the level above (User → Entity → EntityType,
`theme/resolveEffectiveConfig.js`).

## Theme tab: templates, customize, edit

- **Themes of this level** - the themes owned by this level (`owner_scope` and the owner id
  match the target): **Use** or **Edit** (PATCH `themes/{id}/`, in place).
- **Templates** - themes without owner: **Use** (puts it in the form; *Save changes* stores
  it as this level's override) or **Customize** - opens the colour editor (name + primary,
  secondary, accent, positive, negative, warning, background, card, header, header text,
  footer, footer text, with `ColorField`) and on *Create and apply* calls
  `POST themes/{id}/customize/ {scope, target, name, values}`. The backend copies the
  theme and applies it to the level, so the form is already saved.

The other tabs (Layout, Typography, Animations) still choose an existing configuration.

## Saving and applying

`save()` stores the four overrides through the level's store: BaseStore `update()` (EntityType,
Entity, admin user page) or `UserStore.updateProfile()` (the signed-in user). After a change of
the user's own look, `MainLayout.onThemeSaved()` reloads `/me/` and `UserStore.setSettings()`
applies the **effective** look (`User.ps`: `/me/`'s `ui_config`, User > Entity > EntityType),
falling back to the Entity's settings until `/me/` answers.

Hooks: `theme-studio-scope-description`, `theme-own`, `theme-templates`, `theme-use`,
`theme-customize`, `theme-edit`, `theme-editor-name`, `theme-editor-save`.
Tests: `components/theme/useThemeStudio.spec.js`.

**Breaking change.** The `allowScopeSelect` prop and the `update:scope` event were removed.
