import OrganizationChart from 'vue3-organization-chart'
import 'vue3-organization-chart/dist/orgchart.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('OrganizationChart', OrganizationChart)
})
