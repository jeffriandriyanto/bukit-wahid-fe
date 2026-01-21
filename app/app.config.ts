const defaultUI = {
  slots: {
    root: '!w-full',
    base: 'rounded-xl w-full'
  },
  defaultVariants: {
    size: 'lg'
  }
}
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'primary',
      secondary: 'secondary',
      neutral: 'neutral'
    },
    input: { ...defaultUI },
    textarea: { ...defaultUI },
    select: { ...defaultUI },
    selectMenu: { ...defaultUI },
    inputDate: { ...defaultUI },
    inputTime: { ...defaultUI },
    button: {
      slots: {
        base: 'rounded-xl'
      },
      defaultVariants: {
        size: 'lg'
      }
    }
  }
})
