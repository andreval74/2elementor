import { describe, it, expect } from 'vitest'
import { parseHTML } from '@/services/html-parser'
import { detectSections } from '@/services/section-detector'
import {
  FX_HEADER, FX_HERO, FX_SERVICES, FX_CASES,
  FX_FAQ, FX_CTA, FX_ABOUT, FX_FOOTER, FX_FULL_PAGE,
} from './fixtures'

function detect(html: string) {
  return detectSections(parseHTML(html))
}

describe('section-detector — detectSections()', () => {
  it('detecta header com confiança ≥ 0.6', () => {
    const sections = detect(FX_HEADER)
    const s = sections.find(s => s.name === 'header')
    expect(s).toBeDefined()
    expect(s!.confidence).toBeGreaterThanOrEqual(0.6)
  })

  it('detecta hero com confiança ≥ 0.5', () => {
    const sections = detect(FX_HERO)
    const s = sections.find(s => s.name === 'hero')
    expect(s).toBeDefined()
    expect(s!.confidence).toBeGreaterThanOrEqual(0.5)
  })

  it('detecta services com confiança ≥ 0.3', () => {
    const sections = detect(FX_SERVICES)
    const s = sections.find(s => s.name === 'services')
    expect(s).toBeDefined()
    expect(s!.confidence).toBeGreaterThanOrEqual(0.3)
  })

  it('detecta cases/portfolio com confiança ≥ 0.3', () => {
    const sections = detect(FX_CASES)
    const s = sections.find(s => s.name === 'cases')
    expect(s).toBeDefined()
    expect(s!.confidence).toBeGreaterThanOrEqual(0.3)
  })

  it('detecta faq (details/summary) com confiança ≥ 0.5', () => {
    const sections = detect(FX_FAQ)
    const s = sections.find(s => s.name === 'faq')
    expect(s).toBeDefined()
    expect(s!.confidence).toBeGreaterThanOrEqual(0.5)
  })

  it('detecta cta com confiança ≥ 0.3', () => {
    const sections = detect(FX_CTA)
    const s = sections.find(s => s.name === 'cta')
    expect(s).toBeDefined()
    expect(s!.confidence).toBeGreaterThanOrEqual(0.3)
  })

  it('detecta about com confiança ≥ 0.3', () => {
    const sections = detect(FX_ABOUT)
    const s = sections.find(s => s.name === 'about')
    expect(s).toBeDefined()
    expect(s!.confidence).toBeGreaterThanOrEqual(0.3)
  })

  it('detecta footer com confiança ≥ 0.6', () => {
    const sections = detect(FX_FOOTER)
    const s = sections.find(s => s.name === 'footer')
    expect(s).toBeDefined()
    expect(s!.confidence).toBeGreaterThanOrEqual(0.6)
  })

  it('página completa detecta 4 seções distintas', () => {
    const sections = detect(FX_FULL_PAGE)
    const names = sections.map(s => s.name)
    expect(names).toContain('header')
    expect(names).toContain('footer')
    expect(sections.length).toBeGreaterThanOrEqual(4)
  })

  it('fallback: HTML desconhecido → confidence baixa (≤ 0.3)', () => {
    // index=0 ganha 0.2 do scoreHero por posição, então confidence real é 0.2
    // Importante: não deve classificar erroneamente com alta confiança
    const sections = detect('<div class="xyz-unknown">Texto aleatório</div>')
    expect(sections.length).toBe(1)
    expect(sections[0].confidence).toBeLessThanOrEqual(0.3)
  })
})
