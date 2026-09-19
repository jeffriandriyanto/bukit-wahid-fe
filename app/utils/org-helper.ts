import type { OrgNode } from '~/types/org'

export const buildOrgTree = (list: any[]): OrgNode | null => {
  if (!list || list.length === 0) return null
  const map: Record<string, OrgNode> = {}
  const createdAt: Record<string, string> = {}
  let root: OrgNode | null = null

  list.forEach((item) => {
    map[item.id] = {
      id: item.id,
      title: item.name,
      name: item.incumbent?.name || 'Belum diisi',
      incumbent_id: item?.incumbent?.id || null,
      avatar: item?.incumbent?.avatar || '',
      signature: item?.incumbent?.signature || '',
      children: []
    }
    createdAt[item.id] = item.created_at || ''
  })

  list.forEach((item) => {
    if (item.parent && map[item.parent]) {
      map[item.parent].children?.push(map[item.id])
    } else {
      root = map[item.id]
    }
  })

  const sortChildren = (node: OrgNode) => {
    node.children?.sort((a, b) =>
      (createdAt[a.id] || '').localeCompare(createdAt[b.id] || '')
    )
    node.children?.forEach(sortChildren)
  }
  if (root) sortChildren(root)

  return root
}
