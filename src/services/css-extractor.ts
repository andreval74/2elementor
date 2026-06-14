// ─── CSS EXTRACTOR ───────────────────────────────────────────────────────────
// Extrai <style> blocks e <link> de fontes do HTML completo (head + body)
// Necessário porque parseHTML() só processa body.children — o head é ignorado.
// Este passo roda ANTES do parse para capturar todo o CSS da página original.

export interface PageAssets {
  css: string       // conteúdo de todos os <style> blocks (head + body)
  fontLinks: string // tags <link> de Google Fonts para injetar no setup widget
}

/**
 * Extrai todo o CSS e os links de fontes de uma string HTML completa.
 * Funciona para HTML parcial (body only) ou completo (com <head>).
 */
export function extractPageAssets(html: string): PageAssets {
  if (!html.trim()) return { css: '', fontLinks: '' }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const cssBlocks: string[] = []
  const fontLinkTags: string[] = []

  // Extrai <style> do <head>
  doc.head.querySelectorAll('style').forEach(el => {
    const content = el.textContent?.trim()
    if (content) cssBlocks.push(content)
  })

  // Extrai <style> do <body> (além dos que já viram HTML widgets)
  doc.body.querySelectorAll('style').forEach(el => {
    const content = el.textContent?.trim()
    if (content) cssBlocks.push(content)
  })

  // Extrai links de Google Fonts do <head>
  doc.head.querySelectorAll('link[rel="stylesheet"]').forEach(el => {
    const href = el.getAttribute('href') ?? ''
    if (href.includes('fonts.googleapis.com') || href.includes('fonts.gstatic.com')) {
      fontLinkTags.push(`<link rel="stylesheet" href="${href}">`)
    }
  })

  return {
    css: cssBlocks.join('\n\n'),
    fontLinks: fontLinkTags.join('\n'),
  }
}
