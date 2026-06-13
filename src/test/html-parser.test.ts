import { describe, it, expect } from 'vitest'
import { parseHTML, countNodeStats } from '@/services/html-parser'
import { FX_HERO, FX_HEADER, FX_EDGE_EFFECTS, FX_EDGE_QUOTES } from './fixtures'

describe('html-parser — parseHTML()', () => {
  it('retorna array vazio para HTML vazio', () => {
    expect(parseHTML('')).toEqual([])
    expect(parseHTML('   ')).toEqual([])
  })

  it('preserva rawHtml (outerHTML completo) em cada nó', () => {
    const nodes = parseHTML(FX_HEADER)
    expect(nodes.length).toBeGreaterThan(0)
    nodes.forEach(n => {
      expect(n.rawHtml).toBeDefined()
      expect(typeof n.rawHtml).toBe('string')
      expect((n.rawHtml as string).length).toBeGreaterThan(0)
    })
  })

  it('preserva texto misto (h1 com BR + SPAN sem perder texto)', () => {
    const nodes = parseHTML(FX_HERO)
    const section = nodes.find(n => n.tag === 'section')
    // rawHtml do section deve conter o texto "TECNOLOGIA SOB MEDIDA."
    expect(section?.rawHtml).toContain('TECNOLOGIA SOB MEDIDA.')
    expect(section?.rawHtml).toContain('RESULTADOS REAIS.')
  })

  it('detecta heading (h1) corretamente', () => {
    const nodes = parseHTML('<div><h1>Título</h1></div>')
    const div = nodes[0]
    const h1 = div.children.find(c => c.tag === 'h1')
    expect(h1?.type).toBe('heading')
  })

  it('detecta image (img) corretamente', () => {
    const nodes = parseHTML('<div><img src="/test.jpg" alt="teste"/></div>')
    const img = nodes[0].children.find(c => c.tag === 'img')
    expect(img?.type).toBe('image')
  })

  it('detecta accordion (details/summary) corretamente', () => {
    const nodes = parseHTML('<section><details><summary>Pergunta</summary><p>Resposta</p></details></section>')
    const details = nodes[0].children.find(c => c.tag === 'details')
    expect(details?.type).toBe('accordion')
  })

  it('preserva SVG como container via rawHtml', () => {
    const nodes = parseHTML('<div class="icon"><svg viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg></div>')
    const svg = nodes[0].children.find(c => c.tag === 'svg')
    expect(svg?.type).toBe('container')
    expect(svg?.rawHtml).toContain('<path')
  })

  it('preserva script e style via rawHtml nos efeitos', () => {
    const nodes = parseHTML(FX_EDGE_EFFECTS)
    const section = nodes.find(n => n.tag === 'section')
    expect(section?.rawHtml).toContain('@keyframes fadeInUp')
    expect(section?.rawHtml).toContain("getElementById('particles')")
    expect(section?.rawHtml).toContain('<svg')
  })
})

describe('html-parser — countNodeStats()', () => {
  it('conta corretamente headings, images, buttons', () => {
    const nodes = parseHTML('<div><h1>Título</h1><img src="x.jpg"/><a href="#">Link</a></div>')
    const stats = countNodeStats(nodes)
    expect(stats.headings).toBe(1)
    expect(stats.images).toBe(1)
    expect(stats.buttons).toBe(1)
    expect(stats.total).toBeGreaterThanOrEqual(4)
  })

  it('atributos com caracteres especiais são preservados no rawHtml', () => {
    const nodes = parseHTML(FX_EDGE_QUOTES)
    const div = nodes.find(n => n.tag === 'div')
    expect(div?.rawHtml).toContain('data-label')
    expect(div?.rawHtml).toContain('data-value')
  })
})
