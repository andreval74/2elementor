// ─── IMAGE ANALYZER ──────────────────────────────────────────────────────────
// Analisa imagem via Canvas API e estima seções presentes
// [TECH DECISION]: Canvas API nativa — sem dependências externas para análise de imagem
// [MAINTENANCE: detector]: melhorar heurísticas de acurácia aqui

import type { SectionEstimate, SectionName } from '@/types/layout.types'

interface SliceStats {
  avgBrightness: number
  contrast: number
  hasHighContrast: boolean
  yStart: number
  yEnd: number
}

function loadImageToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      resolve(canvas)
    }
    img.onerror = () => reject(new Error('Falha ao carregar imagem'))
    img.src = url
  })
}

function analyzeSlice(imageData: ImageData, y: number, height: number, width: number): SliceStats {
  const sliceData = imageData.data
  let brightness = 0
  let min = 255
  let max = 0
  const pixelCount = width * height

  for (let i = 0; i < sliceData.length; i += 4) {
    const b = (sliceData[i] + sliceData[i + 1] + sliceData[i + 2]) / 3
    brightness += b
    if (b < min) min = b
    if (b > max) max = b
  }

  const avg = brightness / pixelCount
  const contrast = max - min
  return { avgBrightness: avg, contrast, hasHighContrast: contrast > 80, yStart: y, yEnd: y + height }
}

function estimateSectionFromSlice(slice: SliceStats, index: number, total: number): SectionName {
  if (index === 0 && slice.avgBrightness < 80) return 'header'
  if (index === 0 && slice.avgBrightness >= 80) return 'hero'
  if (index === 1 && slice.hasHighContrast) return 'hero'
  if (index === total - 1) return 'footer'
  if (slice.avgBrightness < 60) return 'cta'
  if (slice.contrast < 40) return 'services'
  return 'services'
}

/**
 * Analisa uma imagem via Canvas API e retorna estimativas de seções presentes.
 * Divide a imagem em fatias horizontais e aplica heurísticas de brilho/contraste.
 * @param file - Arquivo de imagem (PNG, JPG, etc.)
 * @returns Array de SectionEstimate com tipo e confiança (0–1)
 */
export async function analyzeImage(file: File): Promise<SectionEstimate[]> {
  const canvas = await loadImageToCanvas(file)
  const ctx = canvas.getContext('2d')!
  const sliceCount = 6
  const sliceHeight = Math.floor(canvas.height / sliceCount)
  const estimates: SectionEstimate[] = []

  for (let i = 0; i < sliceCount; i++) {
    const y = i * sliceHeight
    const h = i === sliceCount - 1 ? canvas.height - y : sliceHeight
    const imageData = ctx.getImageData(0, y, canvas.width, h)
    const stats = analyzeSlice(imageData, y, h, canvas.width)
    const sectionType = estimateSectionFromSlice(stats, i, sliceCount)
    const confidence = stats.hasHighContrast ? 0.6 : 0.4

    estimates.push({
      type: sectionType,
      confidence: Math.round(confidence * 100) / 100,
      yStart: stats.yStart,
      yEnd: stats.yEnd,
    })
  }

  return estimates
}
