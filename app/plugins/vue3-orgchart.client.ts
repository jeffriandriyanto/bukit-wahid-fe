import OrganizationChartModule from 'vue3-organization-chart'
import 'vue3-organization-chart/dist/orgchart.css'

const OrganizationChart =
  (OrganizationChartModule as any)?.default ?? OrganizationChartModule

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('OrganizationChart', OrganizationChart)
})
