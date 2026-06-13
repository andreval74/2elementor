import { describe, it, expect } from 'vitest'
import { parseHTML } from '@/services/html-parser'
import { detectSections } from '@/services/section-detector'
import { exportSection, exportFullPage, templateToJson } from '@/services/elementor-exporter'
import { FX_HEADER, FX_FOOTER, FX_HERO, FX_FULL_PAGE } from './fixtures'

function sectionsFrom(html: string) {
  return detectSections(parseHTML(html))
}

describe('elementor-exporter — exportSection()', () => {
  it('versão sempre é "0.4"', () => {
    const s = sectionsFrom(FX_HERO)
    const t = exportSection(s[0])
    expect(t.version).toBe('0.4')
  })

  it('header section → type "header"', () => {
    const s = sectionsFrom(FX_HEADER)
    const headerSection = s.find(x => x.name === 'header')!
    const t = exportSection(headerSection)
    expect(t.type).toBe('header')
  })

  it('footer section → type "footer"', () => {
    const s = sectionsFrom(FX_FOOTER)
    const footerSection = s.find(x => x.name === 'footer')!
    const t = exportSection(footerSection)
    expect(t.type).toBe('footer')
  })

  it('page_settings contém hide_title, page_layout, body_background_color', () => {
    const s = sectionsFrom(FX_HERO)
    const t = exportSection(s[0])
    const ps = t.page_settings as Record<string, unknown>
    expect(ps.hide_title).toBe('yes')
    expect(ps.page_layout).toBe('elementor_full_width')
    expect(ps.body_background_color).toBe('#000000')
  })

  it('page_settings.custom_css contém brand colors', () => {
    const s = sectionsFrom(FX_HERO)
    const t = exportSection(s[0])
    const ps = t.page_settings as Record<string, string>
    expect(ps.custom_css).toContain('#EAB308')
    expect(ps.custom_css).toContain('Inter')
  })
})

describe('elementor-exporter — exportFullPage()', () => {
  it('monta página completa com todas as seções como content[]', () => {
    const sections = sectionsFrom(FX_FULL_PAGE)
    const t = exportFullPage(sections)
    expect(t.type).toBe('page')
    expect(t.content.length).toBe(sections.length)
    expect(t.version).toBe('0.4')
  })

  it('templateToJson gera JSON válido e parseável', () => {
    const sections = sectionsFrom(FX_FULL_PAGE)
    const t = exportFullPage(sections)
    const json = templateToJson(t)
    expect(() => JSON.parse(json)).not.toThrow()
    const parsed = JSON.parse(json)
    expect(parsed.version).toBe('0.4')
    expect(Array.isArray(parsed.content)).toBe(true)
  })
})
