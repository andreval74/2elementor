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

// Configurações de qualquer elemento Elementor
export type ElementorSettings = Record<string, unknown>

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
