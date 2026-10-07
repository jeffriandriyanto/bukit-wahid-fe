/**
 * Memeriksa apakah user memiliki hak akses untuk masuk ke Web Admin.
 * Hanya Super Admin ('sa'), Estate Management ('em'), dan Pejabat RW yang diizinkan.
 */
export const canAccessWebAdmin = (user: any): boolean => {
  if (!user) return false

  const roles: string[] = Array.isArray(user.roles) ? user.roles : []
  const category = user.person?.category

  // 1. Super Admin
  if (roles.includes('sa')) {
    return true
  }

  // 2. Estate Management (EM)
  if (roles.includes('em') || category === 'em') {
    return true
  }

  // 3. Pejabat / Pengurus RW
  const positions: any[] = Array.isArray(user.positions) ? user.positions : []
  const hasRwPosition = positions.some((pos: any) => {
    const orgType = pos?.organizationDetail?.type || pos?.organization_detail?.type
    return typeof orgType === 'string' && orgType.toLowerCase() === 'rw'
  })

  return hasRwPosition
}

