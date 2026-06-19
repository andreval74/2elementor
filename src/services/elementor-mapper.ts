// ─── ELEMENTOR MAPPER ────────────────────────────────────────────────────────
// Converte Section[] em ElementorElement[] (JSON Elementor v0.4)
// Estratégia: cada nó HTML é mapeado para o widget Elementor nativo equivalente.
// Fallback para widget html em: script, style, svg, canvas, accordion, estruturas complexas.
// JS é sempre preservado em widget html — nunca convertido para nativo.

import { generateUniqueId } from '@/utils/generateId'
import { WEBKEEPER_FIRST_WIDGET_SETUP } from '@/utils/constants'
import type { Section, LayoutNode } from '@/types/layout.types'
import type { ExtractedCSS } from '@/services/css-extractor'
import type {
  ElementorElement,
  ElementorPadding,
  ElementorSettings,
  ElementorIconListItem,
  ElementorTypographySize,
} from '@/types/elementor.types'

// ─── REGISTRY ────────────────────────────────────────────────────────────────

const idRegistry = new Set<string>()

function freshId(): string {
  return generateUniqueId(idRegistry)
}

function resetRegistry(): void {
  idRegistry.clear()
}

// ─── TAILWIND SCALE LOOKUPS ───────────────────────────────────────────────────

const TAILWIND_FONT_SIZES: Record<string, number> = {
  'text-xs': 12, 'text-sm': 14, 'text-base': 16, 'text-lg': 18,
  'text-xl': 20, 'text-2xl': 24, 'text-3xl': 30, 'text-4xl': 36,
  'text-5xl': 48, 'text-6xl': 60, 'text-7xl': 72, 'text-8xl': 96,
}

const TAILWIND_FONT_WEIGHTS: Record<string, string> = {
  'font-thin': '100', 'font-light': '300', 'font-normal': '400',
  'font-medium': '500', 'font-semibold': '600', 'font-bold': '700',
  'font-extrabold': '800', 'font-black': '900',
}

const TW_SPACING: Record<string, number> = {
  '0': 0, '0.5': 2, '1': 4, '1.5': 6, '2': 8, '2.5': 10, '3': 12, '3.5': 14,
  '4': 16, '5': 20, '6': 24, '7': 28, '8': 32, '9': 36, '10': 40, '11': 44,
  '12': 48, '14': 56, '16': 64, '20': 80, '24': 96, '28': 112, '32': 128,
}

const TW_BORDER_RADIUS: Record<string, number> = {
  'rounded-full': 9999, 'rounded-3xl': 24, 'rounded-2xl': 16,
  'rounded-xl': 12, 'rounded-lg': 8, 'rounded-md': 6,
  'rounded-sm': 2, 'rounded': 4,
}

// RGB base de cores Tailwind para resolver rgba() com opacidade
const TW_COLOR_RGB: Record<string, [number, number, number]> = {
  'white':       [255, 255, 255],
  'black':       [0,   0,   0  ],
  'brand-gold':  [234, 179, 8  ],
  'gold':        [234, 179, 8  ],
  'brand-dark':  [10,  10,  10 ],
  'brand-card':  [18,  18,  18 ],
  'zinc-950':    [9,   9,   11 ],
  'zinc-900':    [24,  24,  27 ],
  'zinc-800':    [39,  39,  42 ],
  'zinc-700':    [63,  63,  70 ],
  'zinc-600':    [82,  82,  91 ],
  'zinc-500':    [113, 113, 122],
  'zinc-400':    [161, 161, 170],
  'zinc-300':    [212, 212, 216],
  'zinc-200':    [228, 228, 231],
  'zinc-100':    [244, 244, 245],
  'gray-900':    [17,  24,  39 ],
  'gray-800':    [31,  41,  55 ],
  'gray-700':    [55,  65,  81 ],
  'gray-600':    [75,  85,  99 ],
  'gray-500':    [107, 114, 128],
  'gray-400':    [156, 163, 175],
  'gray-300':    [209, 213, 219],
}

// ─── STYLE HELPERS (NOVOS: USANDO extractedCSS) ───────────────────────────────

function nodeClass(node: LayoutNode): string {
  return node.attributes.class ?? ''
}

function parseColorWithOpacity(colorName: string, opacityStr?: string): string | undefined {
  const opacity = opacityStr !== undefined ? parseInt(opacityStr) / 100 : 1
  const hex = colorName.match(/^#([0-9a-fA-F]{3,6})$/)
  if (hex) {
    const h = hex[1]
    const r = parseInt(h.length === 3 ? h[0]+h[0] : h.slice(0, 2), 16)
    const g = parseInt(h.length === 3 ? h[1]+h[1] : h.slice(2, 4), 16)
    const b = parseInt(h.length === 3 ? h[2]+h[2] : h.slice(4, 6), 16)
    return opacity === 1 ? `#${h}` : `rgba(${r},${g},${b},${opacity})`
  }
  const rgb = TW_COLOR_RGB[colorName]
  if (!rgb) return undefined
  const [r, g, b] = rgb
  return opacity === 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${opacity})`
}

function applyExtractedColors(settings: ElementorSettings, css: ExtractedCSS): void {
  if (css.colors?.text) settings.text_color = css.colors.text

  // Handle background first: check for gradient → image → color
  if (css.gradient) {
    settings.background_background = 'gradient'
    // Elementor gradient settings: we'll put the full gradient CSS in background_background_image as a fallback
    // TODO: Parse gradient into Elementor's structured gradient fields (requires more work)
    // For now, we also add a custom CSS class with the gradient
    if (!settings._css_classes) settings._css_classes = ''
    settings._css_classes += ' wk-gradient'
    // Also put the raw CSS in background_image for compatibility
    settings.background_image = { url: '', url_bypass: '', size: 'cover', position: 'center center', repeat: 'no-repeat' }
    settings.background_background_image = css.gradient
  } else if (css.bgImage) {
    settings.background_background = 'classic'
    settings.background_image = { url: css.bgImage, url_bypass: '', size: 'cover', position: 'center center', repeat: 'no-repeat' }
  } else if (css.colors?.bg) {
    settings.background_background = 'classic'
    settings.background_color = css.colors.bg
  }

  if (css.colors?.border) {
    settings.border_border = 'solid'
    settings.border_color = { color: css.colors.border }
  }
}

function applyExtractedSpacing(settings: ElementorSettings, css: ExtractedCSS): void {
  if (css.spacing?.p) {
    const val = parseInt(css.spacing.p)
    if (!isNaN(val)) {
      const v = String(val)
      settings.padding = { unit: 'px', top: v, right: v, bottom: v, left: v, isLinked: true }
    }
  }
  if (css.spacing?.gap) {
    const val = parseInt(css.spacing.gap)
    if (!isNaN(val)) {
      const v = String(val)
      settings.gap = { column: v, row: v }
    }
  }
}

function applyExtractedBorder(settings: ElementorSettings, css: ExtractedCSS): void {
  if (css.border?.width) {
    settings.border_border = 'solid'
    const v = css.border.width.replace('px', '')
    settings.border_width = { unit: 'px', top: v, right: v, bottom: v, left: v, isLinked: true }
  }
  if (css.border?.radius) {
    const v = css.border.radius.replace('px', '')
    settings.border_radius = { unit: 'px', top: v, right: v, bottom: v, left: v, isLinked: true }
  }
}

function applyExtractedShadow(settings: ElementorSettings, css: ExtractedCSS): void {
  if (css.shadow) {
    // Elementor usa um objeto para sombra, por simplicidade, adicionamos uma classe custom
    // ou podemos usar o campo css_classes
    if (!settings._css_classes) settings._css_classes = ''
    settings._css_classes += ' wk-shadow'
    // TODO: Mapear sombra exata para Elementor settings (requer parser da string)
  }
}

function applyExtractedTypography(settings: ElementorSettings, css: ExtractedCSS): void {
  settings.typography_typography = 'custom'
  settings.typography_font_family = 'Inter'
  if (css.typography?.fontSize) {
    const size = parseInt(css.typography.fontSize.replace('px', ''))
    if (!isNaN(size)) {
      settings.typography_font_size = { size, unit: 'px' }
    }
  }
  if (css.typography?.fontWeight) {
    settings.typography_font_weight = css.typography.fontWeight
  }
  if (css.typography?.lineHeight) {
    // Try to parse line-height as number, if not, just use 1.4 as fallback
    let num = parseFloat(css.typography.lineHeight)
    if (!isNaN(num)) {
      settings.typography_line_height = { size: num, unit: 'em' }
    }
  }
  if (css.typography?.letterSpacing) {
    // Try to parse letter-spacing as number in em/px
    let num = parseFloat(css.typography.letterSpacing.replace(/[a-z]/g, ''))
    if (!isNaN(num)) {
      settings.typography_letter_spacing = { size: num, unit: 'em' }
    }
  }
}

function applyExtractedCss(settings: ElementorSettings, css: ExtractedCSS): void {
  // Aplica o base
  applyExtractedColors(settings, css)
  applyExtractedSpacing(settings, css)
  applyExtractedBorder(settings, css)
  applyExtractedShadow(settings, css)
  applyExtractedTypography(settings, css)

  // Aplica Motion Effects (animações)
  if (css.animation) {
    // Elementor usa "_animation" para os efeitos de entrada
    settings._animation = css.animation
    // Habilita a animação
    settings._animation_popup = 'yes'
  }

  // Helper para aplicar breakpoints
  const applyBreakpoint = (breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl', breakpointCss: ExtractedCSS) => {
    const breakpointSettings: ElementorSettings = {}
    applyExtractedColors(breakpointSettings, breakpointCss)
    applyExtractedSpacing(breakpointSettings, breakpointCss)
    applyExtractedBorder(breakpointSettings, breakpointCss)
    applyExtractedShadow(breakpointSettings, breakpointCss)
    applyExtractedTypography(breakpointSettings, breakpointCss)
    for (const [key, value] of Object.entries(breakpointSettings)) {
      settings[`${key}_${breakpoint}`] = value
    }
  }

  // Aplica valores responsivos
  if (css.responsive?.sm) applyBreakpoint('sm', css.responsive.sm)
  if (css.responsive?.md) applyBreakpoint('md', css.responsive.md)
  if (css.responsive?.lg) applyBreakpoint('lg', css.responsive.lg)
  if (css.responsive?.xl) applyBreakpoint('xl', css.responsive.xl)
  if (css.responsive?.['2xl']) applyBreakpoint('2xl', css.responsive['2xl'])
}

// ─── STYLE HELPERS (EXISTENTES: FALLBACK SE extractedCSS NÃO EXISTIR) ─────────

function extractColor(node: LayoutNode): string | undefined {
  if (node.extractedCSS?.colors?.text) return node.extractedCSS.colors.text
  const inlineColor = node.styles?.['color']
  if (inlineColor) {
    const cleaned = inlineColor.trim()
    if (/^#[0-9a-fA-F]{3,8}$/.test(cleaned) || /^rgba?\(/.test(cleaned)) return cleaned
  }
  const c = nodeClass(node)
  const hex = c.match(/text-\[#([0-9a-fA-F]{3,6})\]/)
  if (hex) return `#${hex[1]}`
  const opMatch = c.match(/\btext-([a-z][a-zA-Z0-9-]*)\/(\d+)\b/)
  if (opMatch) {
    const r = parseColorWithOpacity(opMatch[1], opMatch[2])
    if (r) return r
  }
  if (c.includes('text-white')) return '#FFFFFF'
  if (/text-brand-gold|text-gold\b/.test(c)) return '#EAB308'
  if (c.includes('text-zinc-100')) return '#f4f4f5'
  if (c.includes('text-zinc-200')) return '#e4e4e7'
  if (c.includes('text-zinc-300')) return '#d4d4d8'
  if (c.includes('text-zinc-400')) return '#a1a1aa'
  if (c.includes('text-zinc-500')) return '#71717a'
  if (c.includes('text-zinc-600')) return '#52525b'
  if (c.includes('text-gray-400')) return '#9CA3AF'
  if (c.includes('text-gray-500')) return '#6B7280'
  if (c.includes('text-black')) return '#000000'
  if (c.includes('btn-gold')) return '#000000'
  return undefined
}

function extractBgColor(node: LayoutNode): string | undefined {
  if (node.extractedCSS?.colors?.bg) return node.extractedCSS.colors.bg
  const inlineBg = node.styles?.['background-color'] ?? node.styles?.['background']
  if (inlineBg) {
    const cleaned = inlineBg.trim()
    if (/^#[0-9a-fA-F]{3,8}$/.test(cleaned) || /^rgba?\(/.test(cleaned)) return cleaned
  }
  const c = nodeClass(node)
  const hex = c.match(/bg-\[#([0-9a-fA-F]{3,6})\]/)
  if (hex) return `#${hex[1]}`
  const opMatch = c.match(/\bbg-([a-z][a-zA-Z0-9-]*)\/(\d+)\b/)
  if (opMatch) {
    const r = parseColorWithOpacity(opMatch[1], opMatch[2])
    if (r) return r
  }
  if (c.includes('bg-zinc-950')) return '#09090b'
  if (c.includes('bg-zinc-900')) return '#18181b'
  if (c.includes('bg-zinc-800')) return '#27272a'
  if (c.includes('bg-zinc-700')) return '#3f3f46'
  if (c.includes('bg-zinc-600')) return '#52525b'
  if (c.includes('bg-black')) return '#000000'
  if (c.includes('bg-brand-dark')) return '#0A0A0A'
  if (c.includes('bg-brand-card')) return '#121212'
  if (/bg-brand-gold|bg-gold\b/.test(c)) return '#EAB308'
  if (c.includes('bg-white')) return '#FFFFFF'
  if (c.includes('bg-gray-900')) return '#111827'
  if (c.includes('bg-gray-800')) return '#1F2937'
  if (c.includes('btn-gold')) return '#EAB308'
  return undefined
}

function extractBgImage(node: LayoutNode): { url: string } | undefined {
  if (node.extractedCSS?.bgImage) return { url: node.extractedCSS.bgImage }
  const bg = node.styles?.['background-image']
  if (!bg) return undefined
  const m = bg.match(/url\(['"]?([^'")\s]+)['"]?\)/)
  return m ? { url: m[1] } : undefined
}

// Detecta padrão de imagem usada como overlay de fundo via position:absolute
// Ex: <div class="absolute inset-0"><img src="..." /></div>
function extractAbsoluteBgImg(node: LayoutNode): { url: string } | undefined {
  for (const child of node.children) {
    const cc = nodeClass(child)
    if (cc.includes('absolute') && cc.includes('inset-0')) {
      const img = child.tag === 'img'
        ? child
        : child.children.find(n => n.tag === 'img')
      if (img?.attributes.src) return { url: img.attributes.src }
    }
  }
  return undefined
}

function extractFontSize(node: LayoutNode): ElementorTypographySize | undefined {
  if (node.extractedCSS?.typography?.fontSize) {
    const size = parseInt(node.extractedCSS.typography.fontSize.replace('px', ''))
    if (!isNaN(size)) return { size, unit: 'px' }
  }
  const fs = node.styles?.['font-size']
  if (fs) {
    const m = fs.match(/^(\d+(?:\.\d+)?)(px|rem|em)$/)
    if (m) {
      const v = parseFloat(m[1])
      return { size: m[2] === 'rem' ? Math.round(v * 16) : v, unit: 'px' }
    }
  }
  const c = nodeClass(node)
  const parts = c.split(/\s+/)
  for (const [tw, px] of Object.entries(TAILWIND_FONT_SIZES)) {
    if (parts.includes(tw)) return { size: px, unit: 'px' }
  }
  return undefined
}

function extractFontWeight(node: LayoutNode): string | undefined {
  if (node.extractedCSS?.typography?.fontWeight) return node.extractedCSS.typography.fontWeight
  if (node.styles?.['font-weight']) return node.styles['font-weight']
  const c = nodeClass(node)
  const parts = c.split(/\s+/)
  for (const [tw, w] of Object.entries(TAILWIND_FONT_WEIGHTS)) {
    if (parts.includes(tw)) return w
  }
  return undefined
}

function extractFlexAlign(node: LayoutNode): { flex_align_items?: string; flex_justify_content?: string } {
  const c = nodeClass(node)
  const result: { flex_align_items?: string; flex_justify_content?: string } = {}
  if (c.includes('items-center')) result.flex_align_items = 'center'
  else if (c.includes('items-start') || c.includes('items-baseline')) result.flex_align_items = 'flex-start'
  else if (c.includes('items-end')) result.flex_align_items = 'flex-end'
  else if (c.includes('items-stretch')) result.flex_align_items = 'stretch'
  if (c.includes('justify-center')) result.flex_justify_content = 'center'
  else if (c.includes('justify-between')) result.flex_justify_content = 'space-between'
  else if (c.includes('justify-around')) result.flex_justify_content = 'space-around'
  else if (c.includes('justify-evenly')) result.flex_justify_content = 'space-evenly'
  else if (c.includes('justify-end')) result.flex_justify_content = 'flex-end'
  return result
}

function extractAlign(node: LayoutNode): 'left' | 'center' | 'right' | undefined {
  const c = nodeClass(node)
  if (c.includes('text-center') || c.includes('justify-center')) return 'center'
  if (c.includes('text-right')) return 'right'
  if (c.includes('text-left')) return 'left'
  const sa = node.styles?.['text-align']
  if (sa === 'center' || sa === 'right' || sa === 'left') return sa
  return undefined
}

function extractPadding(node: LayoutNode): ElementorPadding | undefined {
  if (node.extractedCSS?.spacing?.p) {
    const val = parseInt(node.extractedCSS.spacing.p)
    if (!isNaN(val)) {
      const v = String(val)
      return { unit: 'px', top: v, right: v, bottom: v, left: v, isLinked: true }
    }
  }
  const c = nodeClass(node)
  let top = 0, right = 0, bottom = 0, left = 0, found = false

  const pAll = c.match(/\bp-(\d+(?:\.\d+)?)\b/)
  if (pAll && TW_SPACING[pAll[1]] !== undefined) {
    top = right = bottom = left = TW_SPACING[pAll[1]]; found = true
  }
  const pY = c.match(/\bpy-(\d+(?:\.\d+)?)\b/)
  if (pY && TW_SPACING[pY[1]] !== undefined) { top = bottom = TW_SPACING[pY[1]]; found = true }
  const pX = c.match(/\bpx-(\d+(?:\.\d+)?)\b/)
  if (pX && TW_SPACING[pX[1]] !== undefined) { right = left = TW_SPACING[pX[1]]; found = true }
  const pt = c.match(/\bpt-(\d+(?:\.\d+)?)\b/)
  if (pt && TW_SPACING[pt[1]] !== undefined) { top = TW_SPACING[pt[1]]; found = true }
  const pr = c.match(/\bpr-(\d+(?:\.\d+)?)\b/)
  if (pr && TW_SPACING[pr[1]] !== undefined) { right = TW_SPACING[pr[1]]; found = true }
  const pb = c.match(/\bpb-(\d+(?:\.\d+)?)\b/)
  if (pb && TW_SPACING[pb[1]] !== undefined) { bottom = TW_SPACING[pb[1]]; found = true }
  const pl = c.match(/\bpl-(\d+(?:\.\d+)?)\b/)
  if (pl && TW_SPACING[pl[1]] !== undefined) { left = TW_SPACING[pl[1]]; found = true }

  if (!found) return undefined
  const isLinked = top === right && right === bottom && bottom === left
  return { unit: 'px', top: String(top), right: String(right), bottom: String(bottom), left: String(left), isLinked }
}

function extractBorderRadius(node: LayoutNode): ElementorPadding | undefined {
  if (node.extractedCSS?.border?.radius) {
    const v = node.extractedCSS.border.radius.replace('px', '')
    if (!isNaN(parseInt(v))) {
      return { unit: 'px', top: v, right: v, bottom: v, left: v, isLinked: true }
    }
  }
  const c = nodeClass(node)
  const parts = c.split(/\s+/)
  // Iteração em ordem de especificidade (mais específico primeiro — já ordenado no objeto)
  for (const [tw, px] of Object.entries(TW_BORDER_RADIUS)) {
    if (parts.includes(tw)) {
      const v = String(px)
      return { unit: 'px', top: v, right: v, bottom: v, left: v, isLinked: true }
    }
  }
  const custom = c.match(/rounded-\[(\d+)px\]/)
  if (custom) {
    const v = custom[1]
    return { unit: 'px', top: v, right: v, bottom: v, left: v, isLinked: true }
  }
  return undefined
}

function extractBorder(
  node: LayoutNode,
): { border_border: 'solid'; border_width: ElementorPadding; border_color: { color: string } } | undefined {
  if (node.extractedCSS?.border?.width || node.extractedCSS?.colors?.border) {
    const width = node.extractedCSS.border?.width ? parseInt(node.extractedCSS.border.width.replace('px', '')) : 1
    const color = node.extractedCSS.colors?.border || '#000000'
    const ws = String(isNaN(width) ? 1 : width)
    return {
      border_border: 'solid',
      border_width: { unit: 'px', top: ws, right: ws, bottom: ws, left: ws, isLinked: true },
      border_color: { color },
    }
  }
  const c = nodeClass(node)
  const parts = c.split(/\s+/)
  const hasBorder = parts.some(p => p === 'border' || p.startsWith('border-'))
  if (!hasBorder) return undefined

  let width = 1
  for (const p of parts) {
    const wm = p.match(/^border-(\d+)$/)
    if (wm) { width = parseInt(wm[1]); break }
  }

  let color = ''
  for (const p of parts) {
    if (p === 'border' || /^border-\d+$/.test(p)) continue
    const cm = p.match(/^border-([a-z][a-zA-Z0-9-]*)(?:\/(\d+))?$/)
    if (cm) {
      const [, colorName, opacityStr] = cm
      // Ignora classes direcionais e utilitárias de borda
      if (['t', 'r', 'b', 'l', 'x', 'y', 'none', 'collapse', 'separate', 'opacity'].includes(colorName)) continue
      const resolved = parseColorWithOpacity(colorName, opacityStr)
      if (resolved) { color = resolved; break }
    }
  }

  if (!color) return undefined
  const ws = String(width)
  return {
    border_border: 'solid',
    border_width: { unit: 'px', top: ws, right: ws, bottom: ws, left: ws, isLinked: true },
    border_color: { color },
  }
}

function extractGap(node: LayoutNode): { column: string; row: string } {
  if (node.extractedCSS?.spacing?.gap) {
    const val = parseInt(node.extractedCSS.spacing.gap)
    if (!isNaN(val)) {
      const v = String(val)
      return { column: v, row: v }
    }
  }
  const c = nodeClass(node)
  let col = 20, row = 0

  const gapAll = c.match(/\bgap-(\d+(?:\.\d+)?)\b/)
  if (gapAll && TW_SPACING[gapAll[1]] !== undefined) { col = row = TW_SPACING[gapAll[1]] }
  const gapX = c.match(/\bgap-x-(\d+(?:\.\d+)?)\b/)
  if (gapX && TW_SPACING[gapX[1]] !== undefined) { col = TW_SPACING[gapX[1]] }
  const gapY = c.match(/\bgap-y-(\d+(?:\.\d+)?)\b/)
  if (gapY && TW_SPACING[gapY[1]] !== undefined) { row = TW_SPACING[gapY[1]] }

  return { column: String(col), row: String(row) }
}

function applyTypography(settings: ElementorSettings, node: LayoutNode): void {
  if (node.extractedCSS) {
    applyExtractedTypography(settings, node.extractedCSS)
    return
  }
  settings.typography_typography = 'custom'
  settings.typography_font_family = 'Inter'
  const fontSize = extractFontSize(node)
  const fontWeight = extractFontWeight(node)
  if (fontSize) settings.typography_font_size = fontSize
  if (fontWeight) settings.typography_font_weight = fontWeight
}

function zeroPadding(): ElementorPadding {
  return { unit: 'px', top: '0', right: '0', bottom: '0', left: '0', isLinked: true }
}

// ─── WIDGET BUILDERS ─────────────────────────────────────────────────────────

function buildHeadingWidget(node: LayoutNode): ElementorElement {
  const tag = node.tag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  // Preserva innerHTML para manter spans coloridos dentro do título
  const raw = node.rawHtml ?? ''
  const inner = raw.match(/^<h[1-6][^>]*>([\s\S]*)<\/h[1-6]>$/i)
  const title = inner ? inner[1].trim() : (node.textContent ?? '')

  const settings: ElementorSettings = { title, header_size: tag }
  const cssClasses = (node.attributes.class ?? '').trim()
  if (cssClasses) settings._css_classes = cssClasses
  const align = extractAlign(node)
  if (align) settings.align = align
  if (node.extractedCSS) {
    if (node.extractedCSS.colors?.text) settings.title_color = node.extractedCSS.colors.text
    applyExtractedTypography(settings, node.extractedCSS)
  } else {
    const color = extractColor(node)
    if (color) settings.title_color = color
    applyTypography(settings, node)
  }

  return { id: freshId(), elType: 'widget', widgetType: 'heading', isInner: false, settings, elements: [] }
}

function buildTextEditorWidget(node: LayoutNode): ElementorElement {
  const editor = node.rawHtml ?? `<${node.tag}>${node.textContent ?? ''}</${node.tag}>`
  const settings: ElementorSettings = { editor }
  const cssClasses = (node.attributes.class ?? '').trim()
  if (cssClasses) settings._css_classes = cssClasses
  if (node.extractedCSS) {
    applyExtractedCss(settings, node.extractedCSS)
  } else {
    const color = extractColor(node)
    if (color) settings.text_color = color
    applyTypography(settings, node)
  }
  return { id: freshId(), elType: 'widget', widgetType: 'text-editor', isInner: false, settings, elements: [] }
}

function buildImageWidget(node: LayoutNode): ElementorElement {
  let url = node.attributes.src ?? node.attributes['data-src'] ?? ''
  let alt = node.attributes.alt ?? ''
  let figcaptionText = ''

  // Check if it's a figure: find img and figcaption inside
  if (node.tag === 'figure') {
    const imgNode = node.children.find(c => c.tag === 'img')
    if (imgNode) {
      url = imgNode.attributes.src ?? imgNode.attributes['data-src'] ?? ''
      alt = imgNode.attributes.alt ?? ''
    }
    const figcapNode = node.children.find(c => c.tag === 'figcaption')
    if (figcapNode) {
      figcaptionText = figcapNode.textContent ?? ''
    }
  }

  const settings: ElementorSettings = { 
    image: { url, id: 0, alt }, 
    image_size: 'full' 
  }

  // Add srcset and sizes if available
  if (node.attributes.srcset) {
    // Elementor doesn't have a direct srcset field, so add as custom class or use raw HTML fallback
    if (!settings._css_classes) settings._css_classes = ''
    settings._css_classes += ' wk-has-srcset'
    // Also, we can add the srcset as an attribute in a custom CSS class, or use a fallback widget
    // For now, just store for reference
  }

  // Add caption if available
  if (figcaptionText) {
    settings.caption = figcaptionText
  }

  const cssClasses = (node.attributes.class ?? '').trim()
  if (cssClasses) settings._css_classes = (settings._css_classes ?? '') + ' ' + cssClasses

  const align = extractAlign(node)
  if (align) settings.align = align

  // Apply extracted CSS
  if (node.extractedCSS) {
    applyExtractedCss(settings, node.extractedCSS)
  }

  return { id: freshId(), elType: 'widget', widgetType: 'image', isInner: false, settings, elements: [] }
}

// Detecta se um nó <a> ou <button> funciona como CTA/botão visual
function isButtonNode(node: LayoutNode): boolean {
  if (node.tag === 'button') return true
  const c = nodeClass(node)
  if (/\bbtn\b|\bbutton\b|\bcta\b/.test(c)) return true
  return c.includes('px-') && c.includes('py-') && c.includes('rounded')
}

function buildButtonWidget(node: LayoutNode): ElementorElement {
  const text = (node.textContent ?? '').trim() || 'Botão'
  const href = node.attributes.href ?? '#'
  const settings: ElementorSettings = {
    text,
    link: { url: href, is_external: false, nofollow: false },
    button_type: '',
  }
  const cssClasses = (node.attributes.class ?? '').trim()
  if (cssClasses) settings._css_classes = cssClasses
  const align = extractAlign(node)
  if (align) settings.align = align
  
  if (node.extractedCSS) {
    if (node.extractedCSS.colors?.bg) {
      settings.background_background = 'classic'
      settings.background_color = node.extractedCSS.colors.bg
    }
    if (node.extractedCSS.colors?.text) settings.button_text_color = node.extractedCSS.colors.text
    if (node.extractedCSS.border?.radius) {
      const v = node.extractedCSS.border.radius.replace('px', '')
      settings.border_radius = { unit: 'px', top: v, right: v, bottom: v, left: v, isLinked: true }
    }
    if (node.extractedCSS.spacing?.p) {
      const val = parseInt(node.extractedCSS.spacing.p)
      if (!isNaN(val)) {
        const v = String(val)
        settings.text_padding = { unit: 'px', top: v, right: v, bottom: v, left: v, isLinked: true }
      }
    }
  } else {
    const bgColor = extractBgColor(node)
    if (bgColor) settings.background_color = bgColor
    const color = extractColor(node)
    if (color) settings.button_text_color = color
    const br = extractBorderRadius(node)
    if (br) settings.border_radius = br
    // Padding interno do botão (px-8 py-4 → text_padding no Elementor, não padding)
    const textPadding = extractPadding(node)
    if (textPadding) settings.text_padding = textPadding
  }
  return { id: freshId(), elType: 'widget', widgetType: 'button', isInner: false, settings, elements: [] }
}

function buildIconListWidget(node: LayoutNode): ElementorElement {
  const items: ElementorIconListItem[] = node.children
    .filter(li => li.tag === 'li')
    .map(li => {
      const link = li.children.find(c => c.tag === 'a')
      // <li><a>texto</a></li> → textContent do <li> é vazio; busca no filho <a>
      const text = (li.textContent ?? link?.textContent ?? '').trim()
      return {
        id: freshId(),
        text,
        link: { url: link?.attributes.href ?? '#', is_external: false, nofollow: false },
        icon: { value: '', library: 'none' },
      }
    })
  const cssClasses = (node.attributes.class ?? '').trim()
  return {
    id: freshId(), elType: 'widget', widgetType: 'icon-list', isInner: false,
    settings: { icon_list: items, ...(cssClasses ? { _css_classes: cssClasses } : {}) }, elements: [],
  }
}

function buildDividerWidget(): ElementorElement {
  return {
    id: freshId(), elType: 'widget', widgetType: 'divider', isInner: false,
    settings: { color: { color: '#3A3A42' } }, elements: [],
  }
}

function buildVideoWidget(node: LayoutNode): ElementorElement {
  const src = node.attributes.src ?? node.attributes['data-src'] ?? ''
  const isYt = /youtube\.com|youtu\.be/.test(src)
  const isVimeo = /vimeo\.com/.test(src)
  return {
    id: freshId(), elType: 'widget', widgetType: 'video', isInner: false,
    settings: {
      video_type: isYt ? 'youtube' : isVimeo ? 'vimeo' : 'other',
      youtube_url: src,
      vimeo_url: src,
    },
    elements: [],
  }
}

// Fallback: widget html — CSS global via page_settings.custom_css (não duplicar por widget)
function buildHtmlWidget(html: string): ElementorElement {
  return {
    id: freshId(), elType: 'widget', widgetType: 'html', isInner: false,
    settings: { html }, elements: [],
  }
}

// FAQ accordion — mapeia <details>/<summary> para o widget nativo do Elementor
function buildAccordionWidget(node: LayoutNode): ElementorElement {
  const detailNodes = node.tag === 'details'
    ? [node]
    : node.children.filter(c => c.tag === 'details')

  const tabs = detailNodes.map(d => {
    const summary = d.children.find(c => c.tag === 'summary')
    const body = d.children
      .filter(c => c.tag !== 'summary')
      .map(c => c.rawHtml ?? '')
      .join('')
    const title = (summary?.textContent ?? '')
      .replace(/[▼▲▾▴⌄⌃]+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    return { _id: freshId(), tab_title: title, tab_content: body }
  })

  return {
    id: freshId(), elType: 'widget', widgetType: 'accordion', isInner: false,
    settings: { tabs }, elements: [],
  }
}

// Widget de setup Tailwind — sempre injetado como primeiro elemento da página/seção
function buildTailwindSetup(fontLinks = ''): ElementorElement {
  const extra = fontLinks ? `\n${fontLinks}` : ''
  return {
    id: freshId(), elType: 'widget', widgetType: 'html', isInner: false,
    settings: { html: `${WEBKEEPER_FIRST_WIDGET_SETUP}${extra}` }, elements: [],
  }
}

// ─── CONTAINER BUILDERS ───────────────────────────────────────────────────────

function buildContainerEl(
  widgets: ElementorElement[],
  settings: ElementorSettings,
  isInner: boolean,
): ElementorElement {
  return { id: freshId(), elType: 'container', isInner, settings, elements: widgets }
}

// Tags que nunca devem ser convertidas para widgets nativos — sempre html widget
// Nota: 'details' e 'summary' são tratados por buildAccordionWidget (não entram aqui)
const ALWAYS_HTML_TAGS = new Set([
  'svg', 'canvas', 'table', 'form',
  'select', 'fieldset', 'object', 'embed', 'noscript',
])

function isAlwaysHtml(node: LayoutNode): boolean {
  return ALWAYS_HTML_TAGS.has(node.tag) || node.type === 'unknown'
}

// Detecta layout flex/grid (linha com múltiplas colunas)
function isFlexRow(node: LayoutNode): boolean {
  const c = nodeClass(node)
  return /\bflex\b/.test(c) || /\bgrid\b/.test(c) || /\bgrid-cols-\d/.test(c)
}

// ─── PROCESSAMENTO RECURSIVO ──────────────────────────────────────────────────

function processNode(node: LayoutNode, depth: number): ElementorElement | null {
  if (node.type === 'spacer') return null
  // FAQ accordion: nó de detalhes individual ou container com filhos <details>
  if (node.type === 'accordion' || node.tag === 'details') return buildAccordionWidget(node)
  if (node.type === 'container' && node.children.some(c => c.tag === 'details' || c.type === 'accordion'))
    return buildAccordionWidget(node)
  if (isAlwaysHtml(node)) return buildHtmlWidget(node.rawHtml ?? '')
  if (node.type === 'heading') return buildHeadingWidget(node)
  if (node.type === 'divider') return buildDividerWidget()
  if (node.type === 'image') return buildImageWidget(node)
  if (node.type === 'video') return buildVideoWidget(node)
  if (node.type === 'button') {
    return isButtonNode(node) ? buildButtonWidget(node) : buildTextEditorWidget(node)
  }
  if (node.type === 'text-editor') return buildTextEditorWidget(node)
  if (node.type === 'icon-list') return buildIconListWidget(node)

  if (node.type === 'container') {
    if (depth > 4) return buildHtmlWidget(node.rawHtml ?? '')

    const children = processChildren(node.children, depth + 1)
    if (children.length === 0) {
      return node.textContent ? buildTextEditorWidget(node) : null
    }

    const cssClasses = nodeClass(node).trim()

    if (isFlexRow(node)) {
      const cols = children.map(c =>
        c.elType === 'container' ? c : buildContainerEl([c], { flex_direction: 'column' }, true),
      )
      const gap = extractGap(node)
      const rowAlign = extractFlexAlign(node)
      const rowSettings: ElementorSettings = {
        flex_direction: 'row',
        flex_direction_mobile: 'column',
        gap,
      }
      if (cssClasses) rowSettings._css_classes = cssClasses
      if (rowAlign.flex_align_items) rowSettings.flex_align_items = rowAlign.flex_align_items
      if (rowAlign.flex_justify_content) rowSettings.flex_justify_content = rowAlign.flex_justify_content
      return buildContainerEl(cols, rowSettings, true)
    }

    const settings: ElementorSettings = { flex_direction: 'column' }
    if (cssClasses) settings._css_classes = cssClasses
    const bgColor = extractBgColor(node)
    if (bgColor) {
      // background_background: 'classic' é OBRIGATÓRIO para background_color funcionar no Elementor
      settings.background_background = 'classic'
      settings.background_color = bgColor
    }
    const bgImage = extractBgImage(node)
    if (bgImage) {
      settings.background_background = 'classic'
      settings.background_image = { url: bgImage.url, id: 0 }
      settings.background_size = 'cover'
      settings.background_position = 'center center'
    }
    const padding = extractPadding(node)
    if (padding) settings.padding = padding
    const borderRadius = extractBorderRadius(node)
    if (borderRadius) settings.border_radius = borderRadius
    const border = extractBorder(node)
    if (border) {
      settings.border_border = border.border_border
      settings.border_width = border.border_width
      settings.border_color = border.border_color
    }
    const flexAlign = extractFlexAlign(node)
    if (flexAlign.flex_align_items) settings.flex_align_items = flexAlign.flex_align_items
    if (flexAlign.flex_justify_content) settings.flex_justify_content = flexAlign.flex_justify_content
    return buildContainerEl(children, settings, true)
  }

  return buildHtmlWidget(node.rawHtml ?? '')
}

function processChildren(nodes: LayoutNode[], depth: number): ElementorElement[] {
  return nodes
    .map(n => processNode(n, depth))
    .filter((el): el is ElementorElement => el !== null)
}

// ─── SEÇÃO → CONTAINER ELEMENTOR ─────────────────────────────────────────────

// isFirst = true injeta Tailwind CDN + fontes UMA VEZ na primeira seção
// Tailwind Play CDN usa MutationObserver — processa classes de TODA a página após carregar
function mapSectionNodeToContainer(section: Section, fontLinks = '', isFirst = false): ElementorElement {
  const topNode = section.nodes[0]

  if (!topNode) {
    return buildContainerEl([], {
      flex_direction: 'column', content_width: 'full',
      background_background: 'classic', background_color: '#000000', padding: zeroPadding(),
    }, false)
  }

  const bgColor = extractBgColor(topNode) ?? '#000000'
  const absoluteBgImg = extractAbsoluteBgImg(topNode)
  // Exclui o overlay absoluto dos filhos processados quando vira background
  const sourceNodes = topNode.children.length > 0
    ? (absoluteBgImg
        ? topNode.children.filter(c => !(nodeClass(c).includes('absolute') && nodeClass(c).includes('inset-0')))
        : topNode.children)
    : [topNode]
  const widgets = processChildren(sourceNodes, 1)

  const sectionSettings: ElementorSettings = {
    flex_direction: 'column',
    content_width: 'full',
    background_background: 'classic',
    background_color: bgColor,
    padding: zeroPadding(),
  }

  const cssClasses = nodeClass(topNode).trim()
  if (cssClasses) sectionSettings._css_classes = cssClasses

  const bgImage = extractBgImage(topNode) ?? absoluteBgImg
  if (bgImage) {
    sectionSettings.background_background = 'classic'
    sectionSettings.background_image = { url: bgImage.url, id: 0 }
    sectionSettings.background_size = 'cover'
    sectionSettings.background_position = 'center center'
  }

  // Extrai padding real da seção (ex: py-24 na <section>)
  const sectionPadding = extractPadding(topNode)
  if (sectionPadding) sectionSettings.padding = sectionPadding

  // Extrai borda da seção (ex: border-y border-white/5)
  const sectionBorder = extractBorder(topNode)
  if (sectionBorder) {
    sectionSettings.border_border = sectionBorder.border_border
    sectionSettings.border_width = sectionBorder.border_width
    sectionSettings.border_color = sectionBorder.border_color
  }

  // Tailwind CDN carregado UMA VEZ — MutationObserver aplica a todas as seções
  if (isFirst) widgets.unshift(buildTailwindSetup(fontLinks))

  return buildContainerEl(widgets, sectionSettings, false)
}

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

/**
 * Converte um array de Section em ElementorElement[].
 * Tailwind CDN injetado apenas na primeira seção — aplica globalmente via MutationObserver.
 * @param fontLinks - Tags <link> de fontes extraídas do <head>
 */
export function mapSectionsToElementor(sections: Section[], fontLinks = ''): ElementorElement[] {
  resetRegistry()
  return sections.map((section, i) =>
    mapSectionNodeToContainer(section, fontLinks, i === 0),
  )
}

/**
 * Converte uma única Section em ElementorElement.
 * Sempre injeta Tailwind CDN (seção única = primeira da página).
 * @param fontLinks - Tags <link> de fontes extraídas do <head>
 */
export function mapSingleSection(section: Section, fontLinks = ''): ElementorElement {
  resetRegistry()
  return mapSectionNodeToContainer(section, fontLinks, true)
}
