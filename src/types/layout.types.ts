// ─── LAYOUT TYPES ────────────────────────────────────────────────────────────
// Tipos da árvore intermediária de layout (resultado do parse do HTML)

export type NodeType =
  | 'container'
  | 'heading'
  | 'text-editor'
  | 'image'
  | 'button'
  | 'icon-list'
  | 'accordion'
  | 'divider'
  | 'video'
  | 'spacer'
  | 'unknown'

export type SectionName = 'header' | 'hero' | 'about' | 'services' | 'cases' | 'faq' | 'cta' | 'footer'

export interface LayoutNode {
  id: string
  type: NodeType
  tag: string
  children: LayoutNode[]
  attributes: Record<string, string>
  textContent?: string
  styles?: Record<string, string>
  rawHtml?: string  // outerHTML original preservado para evitar perda de texto misto
}

export interface Section {
  id: string
  name: SectionName
  label: string
  confidence: number
  nodes: LayoutNode[]
  outputFile: string
}

// Resultado da análise heurística de imagem
export interface SectionEstimate {
  type: SectionName
  confidence: number
  yStart: number
  yEnd: number
}
