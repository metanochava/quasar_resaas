# s-date, s-date-time, s-time

`s-date` (`components/engine/DateComponent.vue`), `s-date-time`
(`DateTimeComponent.vue`) and `s-time` (`TimeComponent.vue`) wrap `q-input`
with a calendar / clock popup, the RESAAS translation of `label`,
`placeholder` and `hint`, and the layout preference (`dense`), like
[s-input](input.md).

## The language order on screen, ISO in the value

What is shown and typed follows the user's language (`User.Language.code`);
the `v-model` - what is sent to the backend and stored - is always the
English/ISO pattern:

| Component | pt-pt on screen | en-us on screen | `v-model` |
|---|---|---|---|
| `s-date` | `09/11/2026` | `11/09/2026` | `2026-11-09` |
| `s-date-time` | `09/11/2026 14:30` | `11/09/2026 14:30` | `2026-11-09 14:30:00` |
| `s-time` | `14:30` | `14:30` | `14:30` |

- Hours are 24h in every language.
- The empty field shows the pattern as placeholder (`DD/MM/AAAA` in pt-pt).
- A date still being typed, or impossible (`31/02/2026`), emits `null`; the
  field shows "Invalid date".
- The calendar shows the language's month and day names and first day of the
  week (Monday in pt-pt).
- `validators` receive the ISO value.

The conversion lives in `utils/dateFormat.js` (exported): `dateOrder`,
`isoToDisplay`, `displayToIso`, `isoDateTimeToDisplay`,
`displayToIsoDateTime`, `dateLocale`. A new language is one entry in its
`ORDERS` (and `LOCALES` for the calendar names).
