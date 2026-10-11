# Registration page and username suggestions

`pages/auth/RegisterPage.vue` (route `register`) is the public sign-up form. It talks to the
backend through `HTTPClient` (no session yet) — see the backend contract in
[django-resaas security/registration](../../django-resaas/security/registration.md).

## Fields

Full name · username · e-mail **or** phone (tabs) · password + confirmation. Submitting asks
for a code (`register/otp/request/`), then a dialog takes the 6-digit code and creates the
account (`register/`). Registration gives no access to any Entity.

## Username suggestions

`utils/usernameSuggestions.js` builds candidates from the name, deterministically, following
the backend's rules (`^[a-z][a-z0-9._]{2,29}$`, no `..`/`__`/`._`, no trailing `.`/`_`):

```js
import { usernameSuggestions } from 'quasar_resaas/utils/usernameSuggestions' // inside the library

usernameSuggestions('Dias Manuel Chavana')
// ['dias.chavana', 'diaschavana', 'dias_chavana', 'dchavana', 'chavana.dias',
//  'dias.m.chavana', 'diaschavana.m', 'd.chavana', 'dias.c', 'dias.chavana2', ...]
```

- accents removed, hyphens/apostrophes split, connectors (`da`, `de`, `dos`, …) dropped;
- readable forms first; a short counter (`dias.chavana2`) only as the last resort — never
  birth dates, phone numbers or long random digits.

On the page:

- typing the name fills the username with the first suggestion not known to be taken, unless
  the user already typed or picked one (`usernameEdited`); "Use the suggestion" goes back;
- the typed name and the suggestions are checked together (`GET register/username/?candidates=`,
  debounced 400 ms; an answer older than the latest question is ignored);
- the status line says *available*, *taken*, *invalid*, *checking*, *not checked yet* — a local
  suggestion is never shown as available before the server said so;
- if the check fails, registration is **not** blocked: the backend validates on submit;
- errors on submit: a wrong code (or too many attempts) stays in the code dialog; any other
  field error (username taken in the meantime, identifier already registered, weak password)
  closes the dialog and shows the message under its field, with every field kept.

Tests: `utils/usernameSuggestions.spec.js`, `pages/auth/RegisterPage.spec.js`.
