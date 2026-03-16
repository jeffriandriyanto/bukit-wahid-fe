export interface SidebarItem {
  label: string
  icon: string
  to?: string
  isHide?: boolean
  children?: SidebarItem[]
}
