// ─── ELEMENTOR TYPES ─────────────────────────────────────────────────────────
// Tipos do JSON final compatível com Elementor v0.4 (imutável)

export type ElementorType = 'page' | 'header' | 'footer' | 'popup' | 'post' | 'error-404'

export type ElementorElType = 'container' | 'section' | 'column' | 'widget'

export type ElementorWidgetType =
  | 'heading'
  | 'text-editor'
  | 'image'
  | 'button'
  | 'icon-list'
  | 'accordion'
  | 'divider'
  | 'video'
  | 'spacer'
  | 'html'

export interface ElementorPadding {
  unit: 'px' | 'em' | '%'
  top: string
  right: string
  bottom: string
  left: string
  isLinked: boolean
}

export interface ElementorImageValue {
  url: string
  id: number
  alt: string
}

export interface ElementorLinkValue {
  url: string
  is_external: boolean
  nofollow: boolean
}

export interface ElementorIconListItem {
  id: string
  text: string
  link: ElementorLinkValue
  icon: { value: string; library: string }
}

export interface ElementorTypographySize {
  size: number
  unit: 'px' | 'em' | 'rem' | 'vw'
}

// Settings tipadas por widget — usadas pelo mapper para garantir JSON correto
export interface ElementorSettings {
  // ── Advanced / cross-widget ───────────────────────────────────────────────
  _css_classes?: string

  // ── Heading ──────────────────────────────────────────────────────────────
  title?: string
  header_size?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  title_color?: string
  align?: 'left' | 'center' | 'right' | 'justify'

  // ── Text Editor ──────────────────────────────────────────────────────────
  editor?: string
  text_color?: string

  // ── Image ────────────────────────────────────────────────────────────────
  image?: ElementorImageValue
  image_size?: string

  // ── Button ───────────────────────────────────────────────────────────────
  text?: string
  link?: ElementorLinkValue
  button_type?: string
  button_text_color?: string

  // ── Icon List ────────────────────────────────────────────────────────────
  icon_list?: ElementorIconListItem[]

  // ── Video ────────────────────────────────────────────────────────────────
  video_type?: 'youtube' | 'vimeo' | 'dailymotion' | 'other'
  youtube_url?: string
  vimeo_url?: string

  // ── HTML widget ──────────────────────────────────────────────────────────
  html?: string

  // ── Typography (todos os widgets de texto) ───────────────────────────────
  typography_typography?: 'custom'
  typography_font_family?: string
  typography_font_size?: ElementorTypographySize
  typography_font_weight?: string
  typography_line_height?: ElementorTypographySize
  typography_letter_spacing?: ElementorTypographySize

  // ── Border (containers e botões) ─────────────────────────────────────────
  border_radius?: ElementorTypographySize | ElementorPadding
  border_border?: 'solid' | 'dashed' | 'dotted' | 'none'
  border_width?: ElementorPadding
  border_color?: { color: string }

  // ── Button interno ───────────────────────────────────────────────────────
  text_padding?: ElementorPadding

  // ── Container / Layout (shared também com Button para background_color) ──
  background_color?: string
  flex_direction?: 'row' | 'column'
  flex_direction_mobile?: 'row' | 'column'
  flex_align_items?: string
  flex_justify_content?: string
  content_width?: 'full' | 'boxed'
  background_background?: string
  padding?: ElementorPadding
  gap?: { column: string; row: string }

  // ── Container background image ────────────────────────────────────────────
  background_image?: { url: string; id: number }
  background_size?: 'auto' | 'cover' | 'contain'
  background_position?: string
  background_repeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'

  // ── Section (legado) ─────────────────────────────────────────────────────
  stretch_section?: string
  layout?: string

  // ── Column (legado) ──────────────────────────────────────────────────────
  _column_size?: number
  _inline_size?: null

  [key: string]: unknown
}

export interface ElementorElement {
  id: string
  elType: ElementorElType
  widgetType?: ElementorWidgetType
  isInner: boolean
  settings: ElementorSettings
  elements: ElementorElement[]
}

// Template completo pronto para importar no Elementor
// is_pro: false obrigatório para Elementor 3.x+ aceitar a importação
export interface ElementorTemplate {
  title: string
  type: ElementorType
  version: '0.4'
  is_pro: false
  page_settings: Record<string, unknown> | []
  content: ElementorElement[]
}
