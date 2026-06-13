import { describe, it, expect } from 'vitest'
import { parseHTML } from '@/services/html-parser'
import { detectSections } from '@/services/section-detector'
import { resolveTokens } from '@/services/token-resolver'
import { exportFullPage, exportSection, templateToJson } from '@/services/elementor-exporter'
import { validateTemplate } from '@/services/validator'
import type { TokenMap } from '@/types/app.types'
import {
  FX_HERO, FX_FAQ, FX_CTA,
  FX_FOOTER, FX_FULL_PAGE, FX_EDGE_EFFECTS,
} from './fixtures'

const tokens: TokenMap = {
  WHATSAPP_NUMBER: '5511988887777',
  WHATSAPP_MSG: 'Quero saber mais sobre os serviços',
  EMAIL_CONTATO: 'ola@webkeeper.com.br',
  INSTAGRAM_URL: 'https://instagram.com/webkeeper',
  LINKEDIN_URL: 'https://linkedin.com/company/webkeeper',
  FACEBOOK_URL: 'https://facebook.com/webkeeper',
  NOME_EMPRESA: 'WebKeeper Digital',
  TELEFONE: '(11) 9 8888-7777',
  SITE_URL: 'https://webkeeper.com.br',
}

function fullPipeline(html: string) {
  const nodes = parseHTML(html)
  const sections = detectSections(nodes)
  const resolved = sections.map(section => ({
    ...section,
    nodes: section.nodes.map(node => ({
      ...node,
      textContent: node.textContent ? resolveTokens(node.textContent, tokens) : node.textContent,
      rawHtml: node.rawHtml ? resolveTokens(node.rawHtml, tokens) : node.rawHtml,
    })),
  }))
  const template = exportFullPage(resolved)
  const json = templateToJson(template)
  const validation = validateTemplate(template)
  return { sections, resolved, template, json, validation }
}

describe('pipeline completo — HTML → JSON Elementor válido', () => {
  it('hero: gera JSON válido sem erros de validação', () => {
    const { validation } = fullPipeline(FX_HERO)
    expect(validation.valid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('FAQ: accordion detectado, JSON válido', () => {
    const { sections, validation } = fullPipeline(FX_FAQ)
    expect(sections.some(s => s.name === 'faq')).toBe(true)
    expect(validation.valid).toBe(true)
  })

  it('CTA: tokens {{WHATSAPP_LINK}} e {{EMAIL_CONTATO}} resolvidos no JSON', () => {
    const { json } = fullPipeline(FX_CTA)
    expect(json).toContain('wa.me/5511988887777')
    expect(json).toContain('ola@webkeeper.com.br')
    expect(json).not.toContain('{{WHATSAPP_LINK}}')
    expect(json).not.toContain('{{EMAIL_CONTATO}}')
  })

  it('página completa: ≥ 4 seções, JSON parseável, content array correto', () => {
    const { template, json } = fullPipeline(FX_FULL_PAGE)
    expect(template.content.length).toBeGreaterThanOrEqual(4)
    const parsed = JSON.parse(json)
    expect(parsed.version).toBe('0.4')
    expect(parsed.page_settings.page_layout).toBe('elementor_full_width')
    expect(parsed.page_settings.hide_title).toBe('yes')
    expect(Array.isArray(parsed.content)).toBe(true)
  })

  it('efeitos (script/style/svg/canvas): preservados integralmente no json', () => {
    const { json } = fullPipeline(FX_EDGE_EFFECTS)
    expect(json).toContain('@keyframes fadeInUp')
    expect(json).toContain('getElementById')
    expect(json).toContain('<svg')
    expect(json).toContain('<canvas')
  })

  it('FOOTER: {{NOME_EMPRESA}} resolvido, tipo "footer" correto', () => {
    const nodes = parseHTML(FX_FOOTER)
    const sections = detectSections(nodes)
    const footer = sections.find(s => s.name === 'footer')!
    expect(footer).toBeDefined()
    const resolved = {
      ...footer,
      nodes: footer.nodes.map(n => ({
        ...n,
        rawHtml: n.rawHtml ? resolveTokens(n.rawHtml, tokens) : n.rawHtml,
      })),
    }
    const template = exportSection(resolved)
    expect(template.type).toBe('footer')
    const json = templateToJson(template)
    expect(json).toContain('WebKeeper Digital')
    expect(json).not.toContain('{{NOME_EMPRESA}}')
  })
})
