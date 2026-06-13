import type { ExtractedImage } from '@/services/image-extractor'

export function injectImagePlaceholders(html: string, images: ExtractedImage[]): string {
  return html.replace(/<img([^>]*?)\/?>/gi, (_match, attrs: string) => {
    const srcMatch = attrs.match(/src=["']([^"']*)["']/i)
    const altMatch = attrs.match(/alt=["']([^"']*)["']/i)
    const src = srcMatch?.[1] ?? ''
    const alt = altMatch?.[1] ?? ''
    const img = images.find(i => i.src === src)
    const name = img?.filename ?? src.split('/').pop()?.slice(0, 40) ?? 'imagem'
    return `<div style="background:#1a1a2e;border:2px dashed #EAB308;border-radius:8px;padding:20px;text-align:center;min-height:80px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#EAB308;font-family:monospace;font-size:12px"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.7"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span style="font-weight:600">${name}</span>${alt ? `<span style="font-size:10px;color:#9CA3AF">${alt}</span>` : ''}<span style="font-size:10px;color:#6B7280">não convertida · assets/images/</span></div>`
  })
}
