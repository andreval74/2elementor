// ─── VISION ELEMENTOR MAPPER ─────────────────────────────────────────────────
// Converte UIAnalysisResult diretamente em ElementorElement[]
// Bypass completo do pipeline HTML → html-parser → elementor-mapper
// Usa sections[].elements[].styles (dados estruturados da IA) para settings nativos

import { generateUniqueId } from '@/utils/generateId'
import type { UIAnalysisResult, UISection, UIElement } from '@/types/vision.types'
import type {
  ElementorElement,
  ElementorSettings,
  ElementorPadding,
  ElementorTypographySize,
  ElementorIconListItem,
} from '@/types/elementor.types'

const idRegistry = new Set<string>()
function freshId(): string { return generateUniqueId(idRegistry) }
function resetIds(): void { idRegistry.clear() }

// ─── PARSERS ──────────────────────────────────────────────────────────────────

function parsePx(value?: string): number {
  if (!value) return 0
  return parseFloat(value) || 0
}

function parseFontSize(value?: string): ElementorTypographySize | undefined {
  if (!value) return undefined
  const m = value.match(/^(\d+(?:\.\d+)?)(px|rem|em)$/)
  if (!m) return undefined
  const v = parseFloat(m[1])
  const unit = m[2] as 'px' | 'em' | 'rem'
  return { size: unit === 'rem' ? Math.round(v * 16) : v, unit: unit === 'rem' ? 'px' : unit }
}

function parsePadding(
  pad?: { top: string; right: string; bottom: string; left: string },
): ElementorPadding | undefined {
  if (!pad) return undefined
  const t = String(parsePx(pad.top))
  const r = String(parsePx(pad.right))
  const b = String(parsePx(pad.bottom))
  const l = String(parsePx(pad.left))
  return { unit: 'px', top: t, right: r, bottom: b, left: l, isLinked: t === r && r === b && b === l }
}

function parsePaddingShorthand(value?: string): ElementorPadding | undefined {
  if (!value) return undefined
  const parts = value.trim().split(/\s+/).map(p => String(parsePx(p)))
  if (parts.length === 1) return { unit: 'px', top: parts[0], right: parts[0], bottom: parts[0], left: parts[0], isLinked: true }
  if (parts.length === 2) return { unit: 'px', top: parts[0], right: parts[1], bottom: parts[0], left: parts[1], isLinked: false }
  return { unit: 'px', top: parts[0], right: parts[1], bottom: parts[2] ?? parts[0], left: parts[3] ?? parts[1], isLinked: false }
}

function parseBorderRadius(value?: string): ElementorPadding | undefined {
  if (!value) return undefined
  const v = String(parsePx(value.split(/\s+/)[0]))
  return { unit: 'px', top: v, right: v, bottom: v, left: v, isLinked: true }
}

function parseBorder(border?: string): {
  border_border: 'solid'
  border_width: ElementorPadding
  border_color: { color: string }
} | undefined {
  if (!border) return undefined
  const m = border.match(/(\d+(?:\.\d+)?)px\s+\w+\s+(#[0-9a-fA-F]{3,6})/)
  if (!m) return undefined
  const w = m[1]
  return {
    border_border: 'solid',
    border_width: { unit: 'px', top: w, right: w, bottom: w, left: w, isLinked: true },
    border_color: { color: m[2] },
  }
}

function applyTypography(settings: ElementorSettings, styles: UIElement['styles']): void {
  const has = styles.fontSize || styles.fontFamily || styles.fontWeight || styles.lineHeight || styles.letterSpacing
  if (!has) return
  settings.typography_typography = 'custom'
  if (styles.fontFamily) {
    settings.typography_font_family = styles.fontFamily.split(',')[0].trim().replace(/['"]/g, '')
  }
  const fs = parseFontSize(styles.fontSize)
  if (fs) settings.typography_font_size = fs
  if (styles.fontWeight) settings.typography_font_weight = styles.fontWeight
  if (styles.lineHeight) {
    const lh = parseFloat(styles.lineHeight)
    if (!isNaN(lh)) settings.typography_line_height = { size: lh, unit: 'em' }
  }
  if (styles.letterSpacing) {
    const ls = parseFloat(styles.letterSpacing)
    if (!isNaN(ls)) settings.typography_letter_spacing = { size: ls, unit: 'em' }
  }
}

// Lê backgroundColor (camelCase da IA) ou background-color (kebab-case fallback)
function readBgColor(el: UIElement): string | undefined {
  return el.styles?.backgroundColor ?? el.styles?.['background-color']
}

// ─── WIDGET BUILDERS ──────────────────────────────────────────────────────────

function buildContainer(
  elements: ElementorElement[],
  settings: ElementorSettings,
  isInner: boolean,
): ElementorElement {
  return { id: freshId(), elType: 'container', isInner, settings, elements }
}

function mapHeading(el: UIElement): ElementorElement {
  const validTags = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
  const tag = (el.tag && validTags.has(el.tag) ? el.tag : 'h2') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  const settings: ElementorSettings = {
    title: el.content ?? '',
    header_size: tag,
  }
  if (el.styles?.color) settings.title_color = el.styles.color
  if (el.styles?.textAlign) settings.align = el.styles.textAlign as 'left' | 'center' | 'right'
  applyTypography(settings, el.styles ?? {})
  return { id: freshId(), elType: 'widget', widgetType: 'heading', isInner: false, settings, elements: [] }
}

function mapText(el: UIElement): ElementorElement {
  const tag = el.tag ?? 'p'
  const settings: ElementorSettings = {
    editor: `<${tag}>${el.content ?? ''}</${tag}>`,
  }
  if (el.styles?.color) settings.text_color = el.styles.color
  applyTypography(settings, el.styles ?? {})
  return { id: freshId(), elType: 'widget', widgetType: 'text-editor', isInner: false, settings, elements: [] }
}

function mapButton(el: UIElement): ElementorElement {
  const settings: ElementorSettings = {
    text: el.content ?? 'Botão',
    link: { url: '#', is_external: false, nofollow: false },
    button_type: 'info',
  }
  if (el.styles?.color) settings.button_text_color = el.styles.color
  const bg = readBgColor(el)
  if (bg) settings.background_color = bg
  if (el.styles?.textAlign) settings.align = el.styles.textAlign as 'left' | 'center' | 'right'
  if (el.styles?.borderRadius) settings.border_radius = parseBorderRadius(el.styles.borderRadius)
  if (el.styles?.padding) settings.text_padding = parsePaddingShorthand(el.styles.padding)
  applyTypography(settings, el.styles ?? {})
  return { id: freshId(), elType: 'widget', widgetType: 'button', isInner: false, settings, elements: [] }
}

function mapImage(el: UIElement): ElementorElement {
  const url =
    (el.content?.startsWith('http') ? el.content : undefined) ??
    el.styles?.backgroundImage?.match(/url\(['"]?([^'")\s]+)/)?.[1] ??
    'https://placehold.co/800x400/333/fff?text=Image'
  const settings: ElementorSettings = {
    image: { url, id: 0, alt: el.alt ?? '' },
    image_size: 'full',
  }
  if (el.styles?.textAlign) settings.align = el.styles.textAlign as 'left' | 'center' | 'right'
  return { id: freshId(), elType: 'widget', widgetType: 'image', isInner: false, settings, elements: [] }
}

function mapList(el: UIElement): ElementorElement {
  const items: ElementorIconListItem[] = (el.children ?? []).map(child => ({
    id: freshId(),
    text: child.content ?? '',
    link: { url: '#', is_external: false, nofollow: false },
    icon: { value: '', library: 'none' },
  }))
  if (items.length === 0 && el.content) {
    items.push({
      id: freshId(),
      text: el.content,
      link: { url: '#', is_external: false, nofollow: false },
      icon: { value: '', library: 'none' },
    })
  }
  return {
    id: freshId(), elType: 'widget', widgetType: 'icon-list', isInner: false,
    settings: { icon_list: items }, elements: [],
  }
}

function mapCard(el: UIElement): ElementorElement {
  const children = (el.children ?? []).map(mapElement).filter(Boolean) as ElementorElement[]
  const settings: ElementorSettings = { flex_direction: 'column' }
  const bg = readBgColor(el)
  if (bg) {
    settings.background_background = 'classic'
    settings.background_color = bg
  }
  if (el.styles?.padding) settings.padding = parsePaddingShorthand(el.styles.padding)
  if (el.styles?.borderRadius) settings.border_radius = parseBorderRadius(el.styles.borderRadius)
  const bdr = parseBorder(el.styles?.border)
  if (bdr) {
    settings.border_border = bdr.border_border
    settings.border_width = bdr.border_width
    settings.border_color = bdr.border_color
  }
  return buildContainer(children, settings, true)
}

function mapDivider(): ElementorElement {
  return {
    id: freshId(), elType: 'widget', widgetType: 'divider', isInner: false,
    settings: {}, elements: [],
  }
}

function mapHtmlFallback(el: UIElement): ElementorElement {
  const tag = el.tag ?? 'div'
  const inner = el.children?.length
    ? el.children.map(c => `<${c.tag ?? 'span'}>${c.content ?? ''}</${c.tag ?? 'span'}>`).join('')
    : (el.content ?? '')
  return {
    id: freshId(), elType: 'widget', widgetType: 'html', isInner: false,
    settings: { html: `<${tag}>${inner}</${tag}>` }, elements: [],
  }
}

function mapElement(el: UIElement): ElementorElement {
  switch (el.type) {
    case 'heading': return mapHeading(el)
    case 'text': return mapText(el)
    case 'button': return mapButton(el)
    case 'image': return mapImage(el)
    case 'list':
    case 'nav': return mapList(el)
    case 'card': return mapCard(el)
    case 'divider': return mapDivider()
    default: return mapHtmlFallback(el)
  }
}

// ─── SECTION MAPPER ───────────────────────────────────────────────────────────

function buildFontLinksHtml(families: string[]): string {
  return families
    .map(f => f.trim().replace(/['"]/g, ''))
    .filter(Boolean)
    .map(family =>
      `<link rel="preconnect" href="https://fonts.googleapis.com">` +
      `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}` +
      `:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">`
    )
    .join('\n')
}

function mapSection(section: UISection, fontLinksHtml: string, isFirst: boolean): ElementorElement {
  const sectionSettings: ElementorSettings = {
    flex_direction: 'column',
    content_width: 'full',
  }

  // Background
  if (section.background?.type === 'solid' && section.background.value) {
    sectionSettings.background_background = 'classic'
    sectionSettings.background_color = section.background.value
  } else if (section.background?.type === 'gradient' && section.background.value) {
    sectionSettings.background_background = 'classic'
    // Extrai a primeira cor hex do gradient como fallback simplificado
    const firstHex = section.background.value.match(/#[0-9a-fA-F]{3,6}/)?.[0]
    if (firstHex) sectionSettings.background_color = firstHex
  } else if (section.background?.type === 'image') {
    sectionSettings.background_background = 'classic'
    const url = section.background.value.match(/url\(['"]?([^'")\s]+)/)?.[1] ?? section.background.value
    if (url?.startsWith('http')) {
      sectionSettings.background_image = { url, id: 0 }
      sectionSettings.background_size = 'cover'
      sectionSettings.background_position = 'center center'
    }
  }

  const padding = parsePadding(section.padding)
  if (padding) sectionSettings.padding = padding

  const widgets = section.elements.map(mapElement)

  let innerElements: ElementorElement[]
  const columns = section.layout?.columns ?? 0
  const isRow = section.layout?.direction === 'row'

  if (columns > 1) {
    // Round-robin entre N colunas → N inner containers em row
    const colArrays: ElementorElement[][] = Array.from({ length: columns }, () => [])
    widgets.forEach((w, i) => colArrays[i % columns].push(w))
    innerElements = colArrays
      .filter(col => col.length > 0)
      .map(col => buildContainer(col, { flex_direction: 'column' }, true))
    sectionSettings.flex_direction = 'row'
    sectionSettings.flex_direction_mobile = 'column'
    if (section.layout.gap) {
      const gapPx = String(parsePx(section.layout.gap))
      sectionSettings.gap = { column: gapPx, row: '0' }
    }
    if (section.layout.align) sectionSettings.flex_align_items = section.layout.align
    if (section.layout.justify) sectionSettings.flex_justify_content = section.layout.justify
  } else if (isRow) {
    innerElements = widgets
    sectionSettings.flex_direction = 'row'
    sectionSettings.flex_direction_mobile = 'column'
    if (section.layout.gap) {
      const gapPx = String(parsePx(section.layout.gap))
      sectionSettings.gap = { column: gapPx, row: '0' }
    }
    if (section.layout.align) sectionSettings.flex_align_items = section.layout.align
    if (section.layout.justify) sectionSettings.flex_justify_content = section.layout.justify
  } else {
    innerElements = widgets
  }

  // Injeta links de fontes como widget HTML na primeira seção
  if (isFirst && fontLinksHtml) {
    innerElements.unshift({
      id: freshId(),
      elType: 'widget',
      widgetType: 'html',
      isInner: false,
      settings: { html: fontLinksHtml },
      elements: [],
    })
  }

  return buildContainer(innerElements, sectionSettings, false)
}

// ─── EXPORT PRINCIPAL ─────────────────────────────────────────────────────────

/**
 * Converte UIAnalysisResult (saída da IA Vision) diretamente em ElementorElement[].
 * Não usa HTML parser, section-detector, nem elementor-mapper.
 * Lê sections[].elements[].styles → settings nativos Elementor (cores, tipografia, padding, grid).
 */
export function mapVisionToElementor(result: UIAnalysisResult): ElementorElement[] {
  resetIds()
  const fontFamilies = result.designSystem?.typography?.fontFamilies ?? []
  const fontLinksHtml = buildFontLinksHtml(fontFamilies)
  return result.sections.map((section, i) => mapSection(section, fontLinksHtml, i === 0))
}