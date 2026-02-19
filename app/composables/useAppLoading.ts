import AppLoading from "~/components/AppLoading.vue"

const overlayController = ref<any>(null)

export const useAppLoading = () => {
  const overlay = useOverlay()

  const startLoading = () => {
    if (overlayController.value) return

    overlayController.value = overlay.create(AppLoading, {
      props: {},
      destroyOnClose: true
    })

    overlayController.value.open()
  }

  const stopLoading = () => {
    if (overlayController.value) {
      overlayController.value.close()
      overlayController.value = null
    }
  }

  return {
    startLoading,
    stopLoading
  }
}
