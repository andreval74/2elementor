export interface ExtractedImage {
  filename: string
  src: string
  type: 'base64' | 'external' | 'relative'
  mimeType?: string
  data?: string
}

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/ico': 'ico',
  'image/x-icon': 'ico',
}

function baseName(path: string): string {
  return path.split('/').pop()?.split('?')[0] ?? ''
}

function deduplicateFilename(name: string, existing: ExtractedImage[]): string {
  const names = new Set(existing.map(e => e.filename))
  if (!names.has(name)) return name
  const dot = name.lastIndexOf('.')
  const base = dot >= 0 ? name.slice(0, dot) : name
  const ext = dot >= 0 ? name.slice(dot) : ''
  let n = 2
  while (names.has(`${base}-${n}${ext}`)) n++
  return `${base}-${n}${ext}`
}

export function extractImages(html: string): ExtractedImage[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const imgs = Array.from(doc.querySelectorAll('img'))
  const seen = new Set<string>()
  const result: ExtractedImage[] = []
  let counter = 1

  for (const img of imgs) {
    const src = img.getAttribute('src') ?? ''
    if (!src || seen.has(src)) continue
    seen.add(src)

    if (src.startsWith('data:')) {
      const match = src.match(/^data:(image\/[^;]+);base64,(.+)$/)
      if (!match) continue
      const mimeType = match[1]
      const data = match[2]
      const ext = MIME_TO_EXT[mimeType] ?? 'png'
      const filename = `image-${String(counter++).padStart(3, '0')}.${ext}`
      result.push({ filename, src, type: 'base64', mimeType, data })
    } else if (/^https?:\/\//i.test(src)) {
      const raw = baseName(src) || `image-${String(counter++).padStart(3, '0')}.jpg`
      const filename = deduplicateFilename(raw, result)
      result.push({ filename, src, type: 'external' })
    } else {
      const raw = baseName(src) || `image-${String(counter++).padStart(3, '0')}.jpg`
      const filename = deduplicateFilename(raw, result)
      result.push({ filename, src, type: 'relative' })
    }
  }

  return result
}
