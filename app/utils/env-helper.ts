export const cleanEnvData = (rawData: any[]) => {
  const result: Record<string, any> = {}

  rawData.forEach((item) => {
    const key = Object.keys(item)[0]
    let value = item[key]

    if (typeof value === 'string') {
      // Bersihkan HTML Entities
      value = value.replace(/&#34;/g, '"')

      // Jika isinya string array (seperti fasum/kegiatan), parse jadi array beneran
      if (value.startsWith('[') && value.endsWith(']')) {
        try { value = JSON.parse(value) } catch (e) { }
      }
    }
    result[key] = value
  })

  return result
}
