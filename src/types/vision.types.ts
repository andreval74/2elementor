// ─── VISION TYPES ────────────────────────────────────────────────────────────
// Tipos para análise de imagem com múltiplos provedores de IA

// ── Tipos de seção detectáveis pela IA (mais amplos que SectionName do parser) ──
export type VisionSectionType =
  | 'header' | 'hero' | 'about' | 'services' | 'features'
  | 'testimonials' | 'faq' | 'cta' | 'footer' | 'gallery'
  | 'pricing' | 'team' | 'cases' | 'contact' | 'unknown'

// ── Elemento UI individual ────────────────────────────────────────────────────
export interface UIElement {
  type: 'heading' | 'text' | 'button' | 'image' | 'icon' | 'nav' | 'list' | 'card' | 'divider' | 'badge' | 'logo' | 'input' | 'video' | 'other'
  tag?: string       // h1, h2, p, a, button, img, ...
  content?: string   // texto visível
  alt?: string       // para imagens
  styles: {
    color?: string
    backgroundColor?: string
    fontSize?: string
    fontFamily?: string
    fontWeight?: string
    lineHeight?: string
    letterSpacing?: string
    borderRadius?: string
    border?: string
    padding?: string
    margin?: string
    boxShadow?: string
    width?: string
    height?: string
    display?: string
    flexDirection?: string
    gap?: string
    textAlign?: string
    opacity?: string
    backgroundImage?: string
    [key: string]: string | undefined
  }
  children?: UIElement[]
}

// ── Seção detectada na imagem ─────────────────────────────────────────────────
export interface UISection {
  type: VisionSectionType
  label: string   // nome legível, ex: "Hero Principal"
  background: {
    type: 'solid' | 'gradient' | 'image' | 'transparent'
    value: string  // hex, gradient() ou url()
  }
  layout: {
    direction: 'row' | 'column'
    align: string    // flex align-items value
    justify: string  // flex justify-content value
    gap: string      // ex: "24px"
    columns?: number // para grids
  }
  padding: { top: string; right: string; bottom: string; left: string }
  elements: UIElement[]
}

// ── Design System extraído da imagem ─────────────────────────────────────────
export interface DesignSystem {
  colors: {
    primary: string
    secondary?: string
    accent?: string
    background: string
    surface: string
    text: { primary: string; secondary: string; muted: string }
    border: string
    [key: string]: string | { primary: string; secondary: string; muted: string } | undefined
  }
  typography: {
    fontFamilies: string[]
    scale: Array<{
      name: string           // h1, h2, body, caption, label, ...
      fontSize: string       // ex: "48px"
      fontWeight: string     // ex: "700"
      lineHeight: string     // ex: "1.2"
      letterSpacing?: string // ex: "0.05em"
      textTransform?: string // uppercase, none, ...
    }>
  }
  spacing: Record<string, string>      // { xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "48px" }
  borderRadius: Record<string, string> // { none: "0", sm: "4px", md: "8px", lg: "16px", full: "9999px" }
  shadows: string[]
  gradients?: string[]
  animations?: string[]
}

// ── Resultado completo da análise de imagem ───────────────────────────────────
export interface UIAnalysisResult {
  meta: {
    analyzedAt: string  // ISO timestamp
    model: string       // ex: "gemini-2.5-flash"
    provider: string    // ex: "gemini"
    imageFile?: string  // nome do arquivo original
  }
  sections: UISection[] // quantidade dinâmica — pode ter 2 ou 15
  designSystem: DesignSystem
  code: {
    html: string  // HTML semântico completo pronto para Elementor pipeline
    css: string   // CSS organizado com custom properties
  }
}

// ── Contrato de um provedor de IA ─────────────────────────────────────────────
export type ProviderId = 'gemini' | 'openrouter' | 'together' | 'claude' | 'proxy'

export interface VisionProvider {
  id: ProviderId
  label: string        // ex: "Gemini 2.5 Flash"
  description: string  // ex: "Google AI Studio · Gratuito · 250 req/dia"
  isFree: boolean
  keyPlaceholder: string  // ex: "AIzaSy..."
  keyHelpUrl: string
  analyze(file: File, apiKey: string): Promise<UIAnalysisResult>
}
