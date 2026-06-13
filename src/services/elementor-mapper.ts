// ─── ELEMENTOR MAPPER ────────────────────────────────────────────────────────
// Converte Section[] em ElementorElement[] (JSON Elementor v0.4)
// [MAPPING DECISION]: usa section→column→widget(html) para preservar 100% do CSS
// [MAINTENANCE: mapeamento]: adicionar novos widgetTypes aqui

import { generateUniqueId } from '@/utils/generateId'
import { WEBKEEPER_STYLES, WEBKEEPER_FIRST_WIDGET_SETUP } from '@/utils/constants'
import type { Section } from '@/types/layout.types'
import type { ElementorElement, ElementorPadding } from '@/types/elementor.types'

const idRegistry = new Set<string>()

function freshId(): string {
  return generateUniqueId(idRegistry)
}

function resetRegistry(): void {
  idRegistry.clear()
}

function zeroPadding(): ElementorPadding {
  return { unit: 'px', top: '0', right: '0', bottom: '0', left: '0', isLinked: true }
}

const SELF_CLOSING_TAGS = ['img', 'hr', 'br', 'input', 'meta', 'link']

function escapeAttrValue(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function nodeToHtmlString(node: Section['nodes'][0]): string {
  const tag = node.tag
  const attrs = Object.entries(node.attributes).map(([k, v]) => `${k}="${escapeAttrValue(v)}"`).join(' ')
  const attrStr = attrs ? ' ' + attrs : ''
  if (SELF_CLOSING_TAGS.includes(tag)) return `<${tag}${attrStr} />`
  if (node.children.length === 0) return `<${tag}${attrStr}>${node.textContent ?? ''}</${tag}>`
  const childrenHtml = node.children.map(nodeToHtmlString).join('\n')
  return `<${tag}${attrStr}>\n${childrenHtml}\n</${tag}>`
}

function sectionNodeToHtml(nodes: Section['nodes']): string {
  return nodes.map(n => n.rawHtml ?? nodeToHtmlString(n)).join('\n')
}

function buildHtmlWidget(html: string, isFirst = false): ElementorElement {
  const setup = isFirst ? WEBKEEPER_FIRST_WIDGET_SETUP : WEBKEEPER_STYLES
  return {
    id: freshId(),
    elType: 'widget',
    widgetType: 'html',
    isInner: false,
    settings: { html: `${setup}\n${html}` },
    elements: [],
  }
}

function buildColumn(widgets: ElementorElement[]): ElementorElement {
  return {
    id: freshId(),
    elType: 'column',
    isInner: false,
    settings: { _column_size: 100, _inline_size: null },
    elements: widgets,
  }
}

function buildSection(columns: ElementorElement[], bgColor = '#000000'): ElementorElement {
  return {
    id: freshId(),
    elType: 'section',
    isInner: false,
    settings: {
      stretch_section: 'section-stretched',
      layout: 'full_width',
      background_background: 'classic',
      background_color: bgColor,
      padding: zeroPadding(),
    },
    elements: columns,
  }
}

/**
 * Converte um array de Section em ElementorElement[].
 * Cada seção vira: section → column → widget(html) preservando CSS Tailwind.
 * @param sections - Seções detectadas com seus nós HTML
 * @returns Array de elementos Elementor prontos para exportação
 */
export function mapSectionsToElementor(sections: Section[]): ElementorElement[] {
  resetRegistry()
  return sections.map((section, index) => {
    const html = sectionNodeToHtml(section.nodes)
    const widget = buildHtmlWidget(html, index === 0)
    const column = buildColumn([widget])
    return buildSection([column])
  })
}

/**
 * Converte uma única Section em ElementorElement.
 * Útil para exportação individual por seção — sempre injeta setup completo.
 */
export function mapSingleSection(section: Section): ElementorElement {
  const html = sectionNodeToHtml(section.nodes)
  const widget = buildHtmlWidget(html, true)
  const column = buildColumn([widget])
  return buildSection([column])
}
