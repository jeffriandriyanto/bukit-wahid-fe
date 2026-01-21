import { nanoid } from 'nanoid'
import { z } from 'zod'
import type { OrgNode, Scope, Mode } from '~/types/org'
import { useConfirmService } from '~/composables/useConfirmService'
import { useRwStructure } from './structure/useRwOrg'
import { useRtStructure } from './structure/useRTOrg'

export const orgFormSchema = z.object({
  level: z.enum(['Dibawah', 'Setara']),
  title: z.string().min(1, 'Jabatan wajib diisi'),
  name: z.string().min(1, 'Nama wajib diisi'),
  address: z.string().min(1, 'Alamat wajib diisi')
})

export type OrgFormSchema = z.infer<typeof orgFormSchema>

export const useOrgStructure = () => {

  const isOpen = ref(false)
  const scope = ref<Scope>('rw')
  const mode = ref<Mode>('add')
  const editingNodeId = ref<string | null>(null)

  const StructureItems = ['Dibawah', 'Setara']

  const toast = useToast()
  const confirm = useConfirmService()

  const { rwData } = useRwStructure()
  const { rtData } = useRtStructure()

  /* =========================
    FORM STATE
  ========================= */
  const form = reactive<OrgFormSchema>({
    level: 'Dibawah',
    title: '',
    name: '',
    address: ''
  })

  const resetForm = () => {
    form.level = 'Dibawah'
    form.title = ''
    form.name = ''
    form.address = ''
    editingNodeId.value = null
  }

  /* =========================
    HELPERS
  ========================= */
  const getCurrentRoot = (): OrgNode | null => {
    return scope.value === 'rw' ? rwData.value : rtData.value
  }

  const findNodeById = (node: OrgNode, id: string): OrgNode | null => {
    if (node.id === id) return node
    for (const child of node.children || []) {
      const found = findNodeById(child, id)
      if (found) return found
    }
    return null
  }

  const removeNodeById = (node: OrgNode, id: string): boolean => {
    if (!node.children) return false
    const index = node.children.findIndex((c) => c.id === id)
    if (index !== -1) {
      node.children.splice(index, 1)
      return true
    }
    return node.children.some((child) => removeNodeById(child, id))
  }

  /* =========================
    ACTIONS
  ========================= */
  const openAddModal = (target: Scope) => {
    scope.value = target
    mode.value = 'add'
    resetForm()
    isOpen.value = true
  }

  const openEditModal = (target: Scope, node: OrgNode) => {
    scope.value = target
    mode.value = 'edit'
    editingNodeId.value = node.id

    form.title = node.title
    form.name = node.name
    form.address = node.address

    isOpen.value = true
  }

  const saveData = async (validated: OrgFormSchema) => {
    const root = scope.value === 'rw' ? rwData.value : rtData.value

    if (!root) return

    if (mode.value === 'edit' && editingNodeId.value) {
      const target = findNodeById(root, editingNodeId.value)
      if (target) Object.assign(target, validated)
    } else {
      const newNode: OrgNode = {
        id: nanoid(),
        ...validated,
        children: []
      }

      if (validated.level === 'Setara') {
        root.children?.push(newNode)
      } else {
        root.children?.unshift(newNode)
      }
    }
    isOpen.value = false
  }

  const deleteNode = async () => {
    if (!editingNodeId.value) return

    const root = getCurrentRoot()

    if (!root) return

    if (editingNodeId.value === root.id) {
      toast.add({
        title: 'Aksi tidak diizinkan',
        description: 'Node utama tidak dapat dihapus.',
        color: 'warning'
      })
      return
    }

    isOpen.value = false

    const ok = await confirm.reveal({
      title: 'Hapus Data Organisasi?',
      description: 'Data yang dihapus tidak dapat dikembalikan.',
      confirmLabel: 'Hapus',
      cancelLabel: 'Batal',
      color: 'error'
    })

    if (!ok) return

    removeNodeById(root, editingNodeId.value)
  }

  return {
    orgFormSchema,
    isOpen,
    scope,
    mode,
    form,
    StructureItems,
    openAddModal,
    openEditModal,
    saveData,
    deleteNode,
  }
}
