import { useConfirmDialog } from '@vueuse/core'
import { reactive } from 'vue'

type ConfirmOptions = {
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  color?: 'error' | 'primary' | 'neutral'
}

const state = reactive<ConfirmOptions>({
  title: 'Konfirmasi',
  description: '',
  confirmLabel: 'OK',
  cancelLabel: 'Batal',
  color: 'primary'
})

const dialog = useConfirmDialog()

export const useConfirmService = () => {
  const reveal = async (options?: ConfirmOptions) => {
    Object.assign(state, {
      title: 'Konfirmasi',
      description: '',
      confirmLabel: 'OK',
      cancelLabel: 'Batal',
      color: 'primary',
      ...options
    })

    const { isCanceled } = await dialog.reveal()
    return !isCanceled
  }

  return {
    // state
    state,
    isOpen: dialog.isRevealed,

    // actions
    reveal,
    confirm: dialog.confirm,
    cancel: dialog.cancel
  }
}
