/**
 * Extrai cores dominantes de uma imagem usando Canvas API (sem dependências externas).
 * Algoritmo: redimensiona para 80×80 → amostra pixels → quantiza → retorna top N por frequência.
 */
export function extractDominantColors(file: File, count = 10): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const canvas = document.createElement('canvas')
      canvas.width = 80
      canvas.height = 80

      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve([]); return }

      ctx.drawImage(img, 0, 0, 80, 80)
      const { data } = ctx.getImageData(0, 0, 80, 80)

      const freq: Record<string, number> = {}
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue // skip transparent pixels

        // Quantize to reduce color space (step of 24 ~= 11 levels per channel)
        const r = Math.round(data[i]     / 24) * 24
        const g = Math.round(data[i + 1] / 24) * 24
        const b = Math.round(data[i + 2] / 24) * 24
        const key = `${r},${g},${b}`
        freq[key] = (freq[key] ?? 0) + 1
      }

      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])

      const result: string[] = []
      for (const [key] of sorted) {
        const [r, g, b] = key.split(',').map(Number)
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`

        // Skip if perceptually too similar to an already-selected color
        const tooSimilar = result.some(existing => {
          const er = parseInt(existing.slice(1, 3), 16)
          const eg = parseInt(existing.slice(3, 5), 16)
          const eb = parseInt(existing.slice(5, 7), 16)
          return Math.abs(r - er) + Math.abs(g - eg) + Math.abs(b - eb) < 60
        })

        if (!tooSimilar) result.push(hex)
        if (result.length >= count) break
      }

      resolve(result)
    }

    img.onerror = () => { URL.revokeObjectURL(url); resolve([]) }
    img.src = url
  })
}