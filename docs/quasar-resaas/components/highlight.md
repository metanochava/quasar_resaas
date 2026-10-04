# s-highlight

`s-highlight` (`components/engine/HighlightText.vue`) renders a text with the part
that matches `search` highlighted (yellow background, bold). Matching is case- and
accent-insensitive (`utils/highlight.js`: "med" finds "Médico"). The text is
rendered as text, never as HTML.

| Prop | |
|---|---|
| `text` | the text to show |
| `search` | what to highlight (empty: plain text) |

```vue
<s-highlight :text="exame.nome" :search="search" />
```

Used by the left menu's search and by lists that filter as the user types (e.g.
the exam catalogue of the exam request page, which also opens every group the
search found).
