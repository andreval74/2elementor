// ─── HTML PARSER ─────────────────────────────────────────────────────────────
// Converte string HTML em árvore LayoutNode[] via DOMParser do browser
// [TECH DECISION]: DOMParser nativo evita dependências externas de parse

import { generateId } from '@/utils/generateId'
import type { LayoutNode, NodeType } from '@/types/layout.types'

const TAG_TO_NODE_TYPE: Record<string, NodeType> = {
  section: 'container', article: 'container', main: 'container', aside: 'container',
  div: 'container', header: 'container', footer: 'container', nav: 'container',
  // SVG é preservado como container via rawHtml — não perde nada
  svg: 'container', g: 'container', path: 'container',
  h1: 'heading', h2: 'heading', h3: 'heading', h4: 'heading', h5: 'heading', h6: 'heading',
  p: 'text-editor', span: 'text-editor', blockquote: 'text-editor',
  img: 'image', figure: 'image', picture: 'image',
  a: 'button', button: 'button',
  ul: 'icon-list', ol: 'icon-list', menu: 'icon-list',
  details: 'accordion', summary: 'accordion',
  hr: 'divider',
  video: 'video', iframe: 'video',
  br: 'spacer',
  // script e style são preservados integralmente via rawHtml no html widget
  script: 'unknown', style: 'unknown', canvas: 'container', noscript: 'container',
}

function resolveNodeType(tag: string): NodeType {
  return TAG_TO_NODE_TYPE[tag.toLowerCase()] ?? 'unknown'
}

function parseAttributes(el: Element): Record<string, string> {
  const attrs: Record<string, string> = {}
  for (const attr of Array.from(el.attributes)) {
    attrs[attr.name] = attr.value
  }
  return attrs
}

function parseInlineStyles(style: string): Record<string, string> {
  const result: Record<string, string> = {}
  style.split(';').forEach(declaration => {
    const [prop, val] = declaration.split(':')
    if (prop && val) result[prop.trim()] = val.trim()
  })
  return result
}

function domNodeToLayoutNode(el: Element): LayoutNode {
  const tag = el.tagName.toLowerCase()
  const attributes = parseAttributes(el)
  const styles = attributes.style ? parseInlineStyles(attributes.style) : undefined
  const directText = Array.from(el.childNodes)
    .filter(n => n.nodeType === Node.TEXT_NODE)
    .map(n => n.textContent?.trim() ?? '')
    .filter(Boolean)
    .join(' ')

  return {
    id: generateId(),
    type: resolveNodeType(tag),
    tag,
    children: parseChildren(el),
    attributes,
    textContent: directText || undefined,
    styles,
    rawHtml: el.outerHTML,  // preserva HTML original completo (texto misto + filhos)
  }
}

function parseChildren(el: Element): LayoutNode[] {
  return Array.from(el.children).map(child => domNodeToLayoutNode(child))
}

/**
 * Converte string HTML bruta em array de LayoutNode.
 * Usa DOMParser do browser — só funciona em ambiente browser (não Node.js puro).
 * @param html - HTML bruto do usuário
 * @returns Array de nós da árvore intermediária
 */
export function parseHTML(html: string): LayoutNode[] {
  if (!html.trim()) return []
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const body = doc.body
  if (!body || body.children.length === 0) return []
  return Array.from(body.children).map(child => domNodeToLayoutNode(child))
}

/**
 * Conta estatísticas dos nós da árvore para exibição no AnalysisPanel.
 */
export function countNodeStats(nodes: LayoutNode[]): Record<string, number> {
  const stats: Record<string, number> = {
    containers: 0, headings: 0, texts: 0, images: 0, buttons: 0, lists: 0, total: 0,
  }
  function walk(n: LayoutNode): void {
    stats.total++
    if (n.type === 'container') stats.containers++
    else if (n.type === 'heading') stats.headings++
    else if (n.type === 'text-editor') stats.texts++
    else if (n.type === 'image') stats.images++
    else if (n.type === 'button') stats.buttons++
    else if (n.type === 'icon-list') stats.lists++
    n.children.forEach(walk)
  }
  nodes.forEach(walk)
  return stats
}
