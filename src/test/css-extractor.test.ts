import { describe, it, expect } from 'vitest'
import { extractCSS, extractPageAssets } from '@/services/css-extractor'

describe('css-extractor.ts — extractCSS()', () => {
  it('extrai cor de texto da classe Tailwind', () => {
    const css = extractCSS('text-yellow-400', {})
    expect(css.colors?.text).toMatch(/#EAB308|yellow/)
  })

  it('extrai cor de fundo da classe Tailwind', () => {
    const css = extractCSS('bg-zinc-950', {})
    expect(css.colors?.bg).toBeDefined()
  })

  it('extrai padding da classe Tailwind', () => {
    const css = extractCSS('p-4', {})
    expect(css.spacing?.p).toBe('16px')
  })

  it('extrai border-radius da classe Tailwind', () => {
    const css = extractCSS('rounded-lg', {})
    expect(css.border?.radius).toBe('8')
  })

  it('extrai sombra da classe Tailwind', () => {
    const css = extractCSS('shadow-md', {})
    expect(css.shadow).toBeDefined()
  })

  it('extrai tamanho de fonte da classe Tailwind', () => {
    const css = extractCSS('text-xl', {})
    expect(css.typography?.fontSize).toBe('20px')
  })

  it('extrai peso de fonte da classe Tailwind', () => {
    const css = extractCSS('font-bold', {})
    expect(css.typography?.fontWeight).toBe('700')
  })

  it('extrai animação da classe Tailwind', () => {
    const css = extractCSS('animate-fadeInUp', {})
    expect(css.animation).toBe('fadeInUp')
  })

  it('extrai valores responsivos (md)', () => {
    const css = extractCSS('p-4 md:p-8', {})
    expect(css.responsive?.md?.spacing?.p).toBe('32px')
  })

  it('prioriza estilos inline sobre classes Tailwind', () => {
    const css = extractCSS('text-yellow-400', { color: '#ff0000' })
    expect(css.colors?.text).toBe('#ff0000')
  })
})

describe('css-extractor.ts — extractPageAssets()', () => {
  it('extrai CSS inline de tags style', () => {
    const assets = extractPageAssets('<style>.test { color: red; }</style>')
    expect(assets.css).toContain('.test')
    expect(assets.css).toContain('color')
  })

  it('extrai font links de tags link', () => {
    const assets = extractPageAssets(
      '<link rel="stylesheet" href="https://fonts.example.com/font.css" />'
    )
    expect(assets.fontLinks).toContain('fonts.example.com')
  })

  it('retorna objetos vazios se não houver assets', () => {
    const assets = extractPageAssets('<div>Conteúdo</div>')
    expect(assets.css).toBe('')
    expect(assets.fontLinks).toBe('')
  })
})
