# s-chart

`s-chart` (`components/engine/ChartComponent.vue`, registered globally in
`boot/components.js`) is the **one** chart component of RESAAS, built on
[ApexCharts](https://apexcharts.com/) (`apexcharts`, a dependency of
`quasar_resaas`). Every chart uses it: the dashboard widgets (`bar_chart`,
`line_chart`, `pie_chart`), the HR dashboard, entity storage, and the apps'
own pages. Do not add another charting library, and do not draw charts in
CSS or SVG by hand.

ApexCharts is loaded on demand (`import('apexcharts')`) the first time a
chart is drawn, so pages without charts don't carry it.

## Usage

```vue
<!-- bars / columns: one or more series over categories -->
<s-chart
  type="bar"
  :labels="['Mon', 'Tue', 'Wed']"
  :series="[{ name: 'Consultations', data: [12, 18, 9] }]"
/>

<!-- horizontal bars, one colour per category (e.g. a status each) -->
<s-chart
  type="bar"
  horizontal
  :labels="['Draft', 'Paid', 'Cancelled']"
  :series="[{ name: 'Payrolls', data: [3, 12, 1] }]"
  :colors="['#9e9e9e', 'positive', 'negative']"
/>

<!-- donut: one value per slice, the total in the middle -->
<s-chart
  type="donut"
  :labels="['Present', 'Late', 'Absent']"
  :series="[38, 5, 2]"
  :colors="['positive', 'warning', 'negative']"
/>

<!-- values that are not plain numbers -->
<s-chart type="donut" :labels="categories" :series="bytes" :format="humanSize" total-label="Used" />
```

| Prop | Default | Meaning |
|---|---|---|
| `type` | `'line'` | `line`, `area`, `bar`, `donut`, `pie`, `radialBar` |
| `series` | `[]` | Axis charts: `[{ name, data: [...], color? }]`. Pie/donut/radialBar: `[n, n, ...]` |
| `labels` | `[]` | Categories (axis charts) or slice names (pie/donut) |
| `colors` | `[]` | One colour per category (slices, or the bars of a single series), same index as `labels` |
| `height` | `260` | Pixels (or any ApexCharts height) |
| `horizontal` | `false` | Bars go horizontally (long labels stay readable) |
| `stacked` | `false` | Stack the series |
| `format` | — | `value => text` for tooltips, axes and the donut total (e.g. sizes, currency) |
| `total-label` | `'Total'` | Caption under the donut total (translated) |
| `options` | `{}` | ApexCharts options merged over the computed ones (escape hatch, use sparingly) |

Event: `select` with `{ index, seriesIndex, label }` when a bar, point or
slice is clicked. The dashboard widgets use it for `item_action`.

Series names, slice names and `total-label` go through `tdc()`. Pass the
canonical English text.

## Colours come from the backend Theme

The chart colours are the Entity's **Theme** (backend configuration,
`django_resaas.saas.models.theme.Theme`, in the frontend `User.Theme`), in a
**fixed order** (`utils/chartTheme.js`):

```
primary, secondary, accent, info, positive, warning, negative
```

A series keeps its colour when the others change. When the Entity changes its
Theme (Theme Studio) or the user switches dark mode, every chart repaints.

A series (`{ name, data, color: 'negative' }`) or a category (`colors`) can
ask for a **semantic colour by name** (`primary`, `secondary`, `accent`,
`info`, `positive`, `warning`, `negative`, `dark`), and the Entity's Theme
value is used. Use this for states, e.g. present/late/absent or
paid/cancelled. A literal colour (`'#9e9e9e'`) is also accepted.

A colour the Theme doesn't define falls back to a validated categorical
palette (eight hues, stepped for light and dark surfaces, checked for
colour-vision deficiency). A colour is never generated. A pie or donut with
more than eight slices folds the rest into "Other".

`utils/chartTheme.js` is exported by `quasar_resaas` (`chartColors`,
`resolveColor`, `themeColor`, `chartSurface`) for pages that need the same
colours outside a chart.

## Look

Fonts are inherited from the app, the background is transparent (the card
shows through), the grid is dashed and faint, lines are 2px and smooth,
points are 8px, bar ends are rounded (4px), and slices and bars are
separated by a 2px gap. Every mark has a tooltip. There is a legend for two
or more series or for any pie/donut, showing each slice's value. There is no
legend box for a single series: the card title names it.

## Dashboard widgets

`components/dashboard/BarChartWidget.vue`, `LineChartWidget.vue` and
`PieChartWidget.vue` render the backend's `{labels, series, codes?}`
contract with `s-chart`. The widget options come from the widget definition
in the module's `dashboard.py`:

| Widget | Options |
|---|---|
| `bar_chart` | `horizontal` (default `true`; `false` draws columns), `stacked`, `height` |
| `line_chart` | `area` (fill under the lines), `height` |
| `pie_chart` | `donut` (default `true`; `false` draws a pie), `height`; `series[0].colors` for per-slice semantic colours |

`series[].color` works on every chart widget. See django_resaas
[Dashboards](https://github.com/metanochava/django_resaas/blob/main/docs/architecture/dashboards.md)
for the backend side.

## Tests

`components/engine/ChartComponent.spec.js` mocks `apexcharts` (jsdom can't
lay out SVG) and checks the options handed to it: Theme colours and order,
semantic colours, legend rules, "Other" folding, the formatter, `select`, and
repainting on data and Theme changes. `utils/chartTheme.spec.js` covers the
colour resolution.

## Troubleshooting

| Symptom | Check |
|---|---|
| The chart is empty | `series` shape: objects `{name, data}` for axis charts, plain numbers for pie/donut |
| Colours don't follow the Theme | The Theme is loaded in `User.Theme` (login / entity switch). A literal hex in `colors` or `series[].color` wins over the Theme |
| `Failed to fetch dynamically imported module .../apexcharts.js` in dev | The dev server is re-optimising dependencies after `apexcharts` was installed: restart it (and clear its cache) |
