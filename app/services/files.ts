export const fileUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await useApi<any>('/file/upload', {
      method: 'POST',
      body: formData
    })

    if (res.status === 1) return res.data;
    return null;
  } catch (e) {
    console.error('Upload Error:', e);
    return null;
  }
}

export const fileDelete = async (file_url: string) => {
  try {
    return await useApi<any>('/file/remove', {
      method: 'DELETE',
      body: { file: file_url }
    })
  } catch (e) {
    console.error('Delete Error:', e);
  }
}
