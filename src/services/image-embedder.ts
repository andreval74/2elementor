// ─── IMAGE EMBEDDER ───────────────────────────────────────────────────────────
// Faz fetch de URLs externas no JSON Elementor e substitui por data URIs base64.
// Estratégia: CORS direto → fallback Worker proxy → mantém URL original + avisa.
// Guard de tamanho: imagens > 512 KB são ignoradas para não inchar o JSON.

const MAX_EMBED_BYTES = 512 * 1024

export interface EmbedResult {
  json: string
  embedded: string[]  // URLs incorporadas com sucesso
  failed: string[]    // URLs que não puderam ser buscadas
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('FileReader error'))
    reader.readAsDataURL(blob)
  })
}

async function fetchViaCors(url: string): Promise<Blob | null> {
  try {
    const resp = await fetch(url, { mode: 'cors', signal: AbortSignal.timeout(8000) })
    if (!resp.ok) return null
    const blob = await resp.blob()
    return blob.size <= MAX_EMBED_BYTES ? blob : null
  } catch {
    return null
  }
}

async function fetchViaProxy(url: string, proxyUrl: string): Promise<string | null> {
  try {
    const resp = await fetch(`${proxyUrl}/image-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: url }),
      signal: AbortSignal.timeout(15000),
    })
    if (!resp.ok) return null
    const data = await resp.json() as { dataUrl?: string }
    if (!data.dataUrl) return null
    // Guard: base64 é ~4/3 do original; length * 0.75 ≈ bytes decodificados
    if (data.dataUrl.length * 0.75 > MAX_EMBED_BYTES) return null
    return data.dataUrl
  } catch {
    return null
  }
}

function collectImageUrls(node: unknown, collected: Set<string>): void {
  if (!node || typeof node !== 'object') return
  const obj = node as Record<string, unknown>
  if (obj.settings && typeof obj.settings === 'object') {
    const s = obj.settings as Record<string, unknown>
    const imgUrl = (s.image as Record<string, unknown> | undefined)?.url
    if (typeof imgUrl === 'string' && /^https?:\/\//.test(imgUrl)) collected.add(imgUrl)
    const bgUrl = (s.background_image as Record<string, unknown> | undefined)?.url
    if (typeof bgUrl === 'string' && /^https?:\/\//.test(bgUrl)) collected.add(bgUrl)
  }
  if (Array.isArray(obj.elements)) obj.elements.forEach(c => collectImageUrls(c, collected))
  if (Array.isArray(obj.content))  obj.content.forEach(c  => collectImageUrls(c, collected))
}

function applyUrlMap(node: unknown, map: Map<string, string>): unknown {
  if (!node || typeof node !== 'object') return node
  if (Array.isArray(node)) return node.map(i => applyUrlMap(i, map))
  const obj = { ...(node as Record<string, unknown>) }
  if (obj.settings && typeof obj.settings === 'object') {
    const s = { ...(obj.settings as Record<string, unknown>) }
    const img = s.image as Record<string, unknown> | undefined
    if (img?.url && map.has(img.url as string)) s.image = { ...img, url: map.get(img.url as string) }
    const bg = s.background_image as Record<string, unknown> | undefined
    if (bg?.url && map.has(bg.url as string)) s.background_image = { ...bg, url: map.get(bg.url as string) }
    obj.settings = s
  }
  if (Array.isArray(obj.elements)) obj.elements = (obj.elements as unknown[]).map(i => applyUrlMap(i, map))
  if (Array.isArray(obj.content))  obj.content  = (obj.content  as unknown[]).map(i => applyUrlMap(i, map))
  return obj
}

export async function embedExternalImages(
  elementorJson: string,
  proxyUrl?: string,
): Promise<EmbedResult> {
  let template: unknown
  try { template = JSON.parse(elementorJson) } catch {
    return { json: elementorJson, embedded: [], failed: [] }
  }

  const urlSet = new Set<string>()
  collectImageUrls(template, urlSet)
  if (urlSet.size === 0) return { json: elementorJson, embedded: [], failed: [] }

  const urlMap  = new Map<string, string>()
  const embedded: string[] = []
  const failed:   string[] = []

  await Promise.allSettled(
    Array.from(urlSet).map(async (url) => {
      const blob = await fetchViaCors(url)
      if (blob) {
        try {
          urlMap.set(url, await blobToDataUrl(blob))
          embedded.push(url)
          return
        } catch { /* fall through to proxy */ }
      }
      if (proxyUrl) {
        const dataUrl = await fetchViaProxy(url, proxyUrl)
        if (dataUrl) { urlMap.set(url, dataUrl); embedded.push(url); return }
      }
      failed.push(url)
    }),
  )

  if (urlMap.size === 0) return { json: elementorJson, embedded, failed }
  return { json: JSON.stringify(applyUrlMap(template, urlMap)), embedded, failed }
}
