// Registry central de tipos de widget - resolve widget.type -> componente
// Vue. Adicionar um novo tipo de widget é só chamar registerWidgetType()
// (ou acrescentar a widgetComponents), nunca `if (widget.type === ...)`
// espalhado pelos componentes (DashboardRenderer/WidgetContainer nunca
// conhecem tipos concretos).
//
// Não confundir com services/dashboardRegistry.js (registry de
// DASHBOARDS custom inteiros, consumido por <s-dashboard>) - este é o
// registry de TIPOS DE WIDGET do motor novo, âmbito diferente.

import StatCardWidget from './StatCardWidget.vue'
import BarChartWidget from './BarChartWidget.vue'
import LineChartWidget from './LineChartWidget.vue'
import PieChartWidget from './PieChartWidget.vue'
import TableWidget from './TableWidget.vue'
import ListWidget from './ListWidget.vue'
import CalendarWidget from './CalendarWidget.vue'

export const widgetComponents = {
  stat: StatCardWidget,
  bar_chart: BarChartWidget,
  line_chart: LineChartWidget,
  pie_chart: PieChartWidget,
  table: TableWidget,
  list: ListWidget,
  calendar: CalendarWidget,
}

export function registerWidgetType(type, component) {
  widgetComponents[type] = component
}

export function resolveWidgetComponent(type) {
  return widgetComponents[type] || null
}
