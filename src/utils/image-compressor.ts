/**
 * Comprime e redimensiona uma imagem antes de enviar à IA.
 * Mantém legibilidade para análise de UI mas reduz o tamanho do base64.
 * Max: 1440px de largura, 85% de qualidade JPEG.
 */
export function compressImage(file: File, maxWidth = 1440, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const ratio  = Math.min(1, maxWidth / img.naturalWidth)
      const width  = Math.round(img.naturalWidth  * ratio)
      const height = Math.round(img.naturalHeight * ratio)

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(file); return }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
          })
          // Só usa a versão comprimida se for menor que o original
          resolve(compressed.size < file.size ? compressed : file)
        },
        'image/jpeg',
        quality,
      )
    }

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}
