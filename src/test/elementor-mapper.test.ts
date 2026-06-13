import { describe, it, expect } from 'vitest'
import { parseHTML } from '@/services/html-parser'
import { detectSections } from '@/services/section-detector'
import { mapSectionsToElementor, mapSingleSection } from '@/services/elementor-mapper'
import { FX_HERO, FX_SERVICES, FX_EDGE_QUOTES, FX_EDGE_EFFECTS } from './fixtures'

function buildSections(html: string) {
  return detectSections(parseHTML(html))
}

describe('elementor-mapper — estrutura JSON', () => {
  it('section → column → widget(html) para seção hero', () => {
    const sections = buildSections(FX_HERO)
    const elements = mapSectionsToElementor(sections)
    expect(elements.length).toBeGreaterThan(0)
    const sec = elements[0]
    expect(sec.elType).toBe('section')
    expect(sec.elements[0].elType).toBe('column')
    expect(sec.elements[0].elements[0].elType).toBe('widget')
    expect(sec.elements[0].elements[0].widgetType).toBe('html')
  })

  it('primeiro widget recebe Tailwind CDN setup', () => {
    const sections = buildSections(FX_SERVICES)
    const elements = mapSectionsToElementor(sections)
    const firstHtml = elements[0].elements[0].elements[0].settings.html as string
    expect(firstHtml).toContain('cdn.tailwindcss.com')
    expect(firstHtml).toContain('tailwind.config')
  })

  it('widgets subsequentes não repetem script Tailwind', () => {
    const sections = buildSections(`
      <header class="navbar"><nav><a href="#">Link</a></nav></header>
      <section class="hero"><h1>Hero</h1></section>
      <section class="services"><div class="grid grid-cols-3"><div>S1</div><div>S2</div><div>S3</div></div></section>
    `)
    const elements = mapSectionsToElementor(sections)
    if (elements.length > 1) {
      const secondHtml = elements[1].elements[0].elements[0].settings.html as string
      expect(secondHtml).not.toContain('cdn.tailwindcss.com')
    }
  })

  it('rawHtml preserva texto misto (h1 com BR+SPAN)', () => {
    const sections = buildSections(FX_HERO)
    const elements = mapSectionsToElementor(sections)
    const firstHtml = elements[0].elements[0].elements[0].settings.html as string
    expect(firstHtml).toContain('TECNOLOGIA SOB MEDIDA.')
    expect(firstHtml).toContain('RESULTADOS REAIS.')
  })

  it('IDs são únicos entre todos os elementos gerados', () => {
    const sections = buildSections(FX_SERVICES)
    const elements = mapSectionsToElementor(sections)
    const ids: string[] = []
    function collectIds(el: { id: string; elements: typeof el[] }) {
      ids.push(el.id)
      el.elements.forEach(collectIds)
    }
    elements.forEach(collectIds)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('atributos com aspas no valor são escapados corretamente', () => {
    const sections = buildSections(FX_EDGE_QUOTES)
    const elements = mapSectionsToElementor(sections)
    const html = elements[0].elements[0].elements[0].settings.html as string
    // rawHtml preserva o HTML via DOMParser.outerHTML — aspas ficam como &quot; entidades
    expect(html).toContain('data-label')
    // O valor deve conter &quot; (codificado) e não aspas duplas brutas quebrando o atributo
    expect(html).toContain('&quot;')
    // &amp; também deve estar presente no data-value="A &amp; B"
    expect(html).toContain('&amp;')
  })

  it('efeitos (script, style, svg) são preservados no html widget', () => {
    const sections = buildSections(FX_EDGE_EFFECTS)
    const elements = mapSectionsToElementor(sections)
    const html = elements[0].elements[0].elements[0].settings.html as string
    expect(html).toContain('@keyframes fadeInUp')
    expect(html).toContain("getElementById('particles')")
    expect(html).toContain('<svg')
  })
})

describe('elementor-mapper — mapSingleSection()', () => {
  it('seção individual também recebe Tailwind setup completo', () => {
    const sections = buildSections(FX_HERO)
    const element = mapSingleSection(sections[0])
    const html = element.elements[0].elements[0].settings.html as string
    expect(html).toContain('cdn.tailwindcss.com')
  })
})
