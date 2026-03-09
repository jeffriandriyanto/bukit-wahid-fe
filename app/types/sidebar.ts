export interface SidebarItem {
  label: string
  icon: string
  to?: string
  children?: SidebarItem[]
}
