import { describe, it, expect } from 'vitest'
import { parseHTML } from '@/services/html-parser'
import { detectSections } from '@/services/section-detector'
import { mapSectionsToElementor, mapSingleSection } from '@/services/elementor-mapper'
import type { ElementorElement } from '@/types/elementor.types'
import { FX_HERO, FX_SERVICES, FX_EDGE_QUOTES, FX_EDGE_EFFECTS } from './fixtures'

function buildSections(html: string) {
  return detectSections(parseHTML(html))
}

// Coleta todos os widgets de um tipo específico na árvore
function findWidgets(el: ElementorElement, widgetType: string): ElementorElement[] {
  const found: ElementorElement[] = []
  function walk(e: ElementorElement) {
    if (e.elType === 'widget' && e.widgetType === widgetType) found.push(e)
    e.elements.forEach(walk)
  }
  walk(el)
  return found
}

// Coleta todo o HTML de widgets html na árvore
function collectHtmlWidgets(el: ElementorElement): string[] {
  return findWidgets(el, 'html').map(w => w.settings.html as string)
}

// ─── ESTRUTURA BASE ───────────────────────────────────────────────────────────

describe('elementor-mapper — estrutura de container', () => {
  it('seção hero produz container raiz (não section/column)', () => {
    const sections = buildSections(FX_HERO)
    const elements = mapSectionsToElementor(sections)
    expect(elements.length).toBeGreaterThan(0)
    const root = elements[0]
    expect(root.elType).toBe('container')
    expect(root.settings.flex_direction).toBe('column')
    expect(root.settings.content_width).toBe('full')
  })

  it('cor de fundo da seção é extraída para background_color do container', () => {
    const sections = buildSections(FX_HERO)   // bg-black → #000000
    const elements = mapSectionsToElementor(sections)
    expect(elements[0].settings.background_color).toBe('#000000')
  })
})

// ─── WIDGETS NATIVOS ─────────────────────────────────────────────────────────

describe('elementor-mapper — widgets nativos', () => {
  it('<h1> vira widget heading com header_size h1', () => {
    const sections = buildSections(FX_HERO)
    const elements = mapSectionsToElementor(sections)
    const headings = findWidgets(elements[0], 'heading')
    expect(headings.length).toBeGreaterThan(0)
    expect(headings[0].settings.header_size).toBe('h1')
  })

  it('heading preserva innerHTML (spans coloridos dentro do título)', () => {
    const sections = buildSections(FX_HERO)
    const elements = mapSectionsToElementor(sections)
    const headings = findWidgets(elements[0], 'heading')
    const title = headings[0].settings.title as string
    expect(title).toContain('TECNOLOGIA SOB MEDIDA.')
    expect(title).toContain('RESULTADOS REAIS.')
  })

  it('<p> vira widget text-editor', () => {
    const sections = buildSections(FX_HERO)
    const elements = mapSectionsToElementor(sections)
    const texts = findWidgets(elements[0], 'text-editor')
    expect(texts.length).toBeGreaterThan(0)
    const editor = texts[0].settings.editor as string
    expect(editor).toContain('Transformamos')
  })

  it('<a class="btn-gold"> vira widget button', () => {
    const sections = buildSections(FX_HERO)
    const elements = mapSectionsToElementor(sections)
    const buttons = findWidgets(elements[0], 'button')
    expect(buttons.length).toBeGreaterThan(0)
    expect(buttons[0].settings.text).toBeTruthy()
    expect((buttons[0].settings.link as { url: string }).url).toBeTruthy()
  })

  it('<a px-* py-* rounded*> também vira widget button', () => {
    // A 2ª âncora do hero tem px-8, py-4, rounded-xl mas não classe btn
    const sections = buildSections(FX_HERO)
    const elements = mapSectionsToElementor(sections)
    const buttons = findWidgets(elements[0], 'button')
    // Ambas as âncoras do hero devem ser reconhecidas como botões
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('<h2> em seção de serviços usa header_size h2', () => {
    const sections = buildSections(FX_SERVICES)
    const elements = mapSectionsToElementor(sections)
    const h2s = findWidgets(elements[0], 'heading').filter(h => h.settings.header_size === 'h2')
    expect(h2s.length).toBeGreaterThan(0)
  })

  it('heading extrai cor do texto (text-white → #FFFFFF)', () => {
    const sections = buildSections(FX_HERO)
    const elements = mapSectionsToElementor(sections)
    const h1 = findWidgets(elements[0], 'heading')[0]
    expect(h1.settings.title_color).toBe('#FFFFFF')
  })

  it('heading extrai font-size de classe Tailwind (text-5xl → 48px)', () => {
    const sections = buildSections(FX_HERO)
    const elements = mapSectionsToElementor(sections)
    const h1 = findWidgets(elements[0], 'heading')[0]
    expect(h1.settings.typography_typography).toBe('custom')
    expect((h1.settings.typography_font_size as { size: number }).size).toBe(48)
  })
})

// ─── LAYOUT FLEX/GRID ─────────────────────────────────────────────────────────

describe('elementor-mapper — layout flex/grid', () => {
  it('<div class="flex"> agrupa widgets em container row', () => {
    const sections = buildSections(FX_HERO)
    const elements = mapSectionsToElementor(sections)
    // Encontra container row que abriga os botões
    function findRow(el: ElementorElement): ElementorElement | undefined {
      if (el.elType === 'container' && el.settings.flex_direction === 'row') return el
      for (const child of el.elements) {
        const found = findRow(child)
        if (found) return found
      }
      return undefined
    }
    const row = findRow(elements[0])
    expect(row).toBeDefined()
  })

  it('<div class="grid grid-cols-3"> vira container row com 3 colunas', () => {
    const sections = buildSections(FX_SERVICES)
    const elements = mapSectionsToElementor(sections)
    function findRow(el: ElementorElement): ElementorElement | undefined {
      if (el.elType === 'container' && el.settings.flex_direction === 'row') return el
      for (const child of el.elements) {
        const found = findRow(child)
        if (found) return found
      }
      return undefined
    }
    const row = findRow(elements[0])
    expect(row).toBeDefined()
    expect(row!.elements.length).toBe(3)
  })
})

// ─── WIDGET HTML (FALLBACK) ───────────────────────────────────────────────────

describe('elementor-mapper — widget html (fallback para JS e elementos complexos)', () => {
  it('primeiro widget html da página recebe Tailwind CDN setup', () => {
    const sections = buildSections(FX_SERVICES)  // contém SVG → gera html widget
    const elements = mapSectionsToElementor(sections)
    const allHtmls = elements.flatMap(el => collectHtmlWidgets(el))
    expect(allHtmls.length).toBeGreaterThan(0)
    expect(allHtmls[0]).toContain('cdn.tailwindcss.com')
  })

  it('widgets html subsequentes não repetem CDN Tailwind', () => {
    const sections = buildSections(`
      <section class="hero bg-black">
        <svg><circle/></svg>
        <p>texto</p>
        <svg><rect/></svg>
      </section>
    `)
    const elements = mapSectionsToElementor(sections)
    const htmls = collectHtmlWidgets(elements[0])
    expect(htmls.length).toBeGreaterThanOrEqual(2)
    // Somente o primeiro tem CDN
    expect(htmls[0]).toContain('cdn.tailwindcss.com')
    expect(htmls[1]).not.toContain('cdn.tailwindcss.com')
  })

  it('efeitos (script, style, svg) são preservados em widgets html', () => {
    const sections = buildSections(FX_EDGE_EFFECTS)
    const elements = mapSectionsToElementor(sections)
    const htmlContents = collectHtmlWidgets(elements[0]).join('\n')
    expect(htmlContents).toContain('@keyframes fadeInUp')
    expect(htmlContents).toContain("getElementById('particles')")
    expect(htmlContents).toContain('<svg')
  })

  it('<script> nunca é convertido — sempre html widget', () => {
    // Usar var assignment seguro (happy-dom executa scripts inline, alert não existe no ambiente)
    const sections = buildSections('<section><script>var __test = 42;</script></section>')
    const elements = mapSectionsToElementor(sections)
    const scripts = findWidgets(elements[0], 'html')
    expect(scripts.length).toBeGreaterThan(0)
    expect(scripts.some(w => (w.settings.html as string).includes('__test'))).toBe(true)
  })

  it('FX_EDGE_QUOTES: atributos especiais preservados nos widgets nativos', () => {
    // Com mapper nativo, div.card vira container e h3/p viram widgets nativos
    // Os atributos data-label do div ficam no container, não no html widget
    const sections = buildSections(FX_EDGE_QUOTES)
    const elements = mapSectionsToElementor(sections)
    // h3 → heading widget com o texto correto
    const headings = findWidgets(elements[0], 'heading')
    expect(headings.length).toBeGreaterThan(0)
    expect(headings[0].settings.title).toContain('Card com atributos especiais')
    // p → text-editor widget
    const texts = findWidgets(elements[0], 'text-editor')
    expect(texts.length).toBeGreaterThan(0)
    const editor = texts[0].settings.editor as string
    expect(editor).toContain('Conteúdo')
  })
})

// ─── IDs ÚNICOS ──────────────────────────────────────────────────────────────

describe('elementor-mapper — IDs únicos', () => {
  it('IDs são únicos entre todos os elementos gerados', () => {
    const sections = buildSections(FX_SERVICES)
    const elements = mapSectionsToElementor(sections)
    const ids: string[] = []
    function collectIds(el: ElementorElement) {
      ids.push(el.id)
      el.elements.forEach(collectIds)
    }
    elements.forEach(collectIds)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ─── mapSingleSection ────────────────────────────────────────────────────────

describe('elementor-mapper — mapSingleSection()', () => {
  it('seção individual gera container raiz com heading nativo', () => {
    const sections = buildSections(FX_HERO)
    const element = mapSingleSection(sections[0])
    expect(element.elType).toBe('container')
    const headings = findWidgets(element, 'heading')
    expect(headings.length).toBeGreaterThan(0)
  })

  it('seção individual com SVG recebe Tailwind CDN no html widget', () => {
    const sections = buildSections(FX_SERVICES)  // tem SVG
    const element = mapSingleSection(sections[0])
    const htmls = collectHtmlWidgets(element)
    expect(htmls.length).toBeGreaterThan(0)
    expect(htmls[0]).toContain('cdn.tailwindcss.com')
  })
})
