export type Scope = 'rw' | 'rt'
export type Mode = 'add' | 'edit'

export interface OrgNode {
  id: string
  title: string
  name: string
  address: string
  children?: OrgNode[]
}

export interface BEResponseNode {
  id: string
  name: string
  type: string
  is_admin: boolean
  children?: BEResponseNode[]
}

export interface BEWrapper {
  status: number
  message: string
  data: BEResponseNode[]
}
