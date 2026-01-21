import type { OrgNode } from '~/types/org'

export const buildOrgTree = (list: any[]): OrgNode | null => {
  if (!list || list.length === 0) return null
  const map: Record<string, OrgNode> = {}
  let root: OrgNode | null = null

  list.forEach((item) => {
    map[item.id] = {
      id: item.id,
      title: item.name,
      name: item.incumbent?.name || 'Belum diisi',
      address: '-',
      children: []
    }
  })

  list.forEach((item) => {
    if (item.parent && map[item.parent]) {
      map[item.parent].children?.push(map[item.id])
    } else {
      root = map[item.id]
    }
  })
  return root
}
