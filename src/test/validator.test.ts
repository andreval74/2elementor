import { describe, it, expect } from 'vitest'
import { validateTemplate } from '@/services/validator'
import type { ElementorTemplate } from '@/types/elementor.types'

function makeValidTemplate(overrides: Partial<ElementorTemplate> = {}): ElementorTemplate {
  return {
    title: 'Teste',
    type: 'page',
    version: '0.4',
    is_pro: false,
    page_settings: {},
    content: [
      {
        id: 'aabbccdd',
        elType: 'section',
        isInner: false,
        settings: { stretch_section: 'section-stretched' },
        elements: [
          {
            id: 'bbccddee',
            elType: 'column',
            isInner: false,
            settings: { _column_size: 100 },
            elements: [
              {
                id: 'ccddeeff',
                elType: 'widget',
                widgetType: 'html',
                isInner: false,
                settings: { html: '<p>Conteúdo</p>' },
                elements: [],
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  }
}

describe('validator — validateTemplate()', () => {
  it('template válido retorna valid: true, sem erros', () => {
    const result = validateTemplate(makeValidTemplate())
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('versão errada gera erro', () => {
    const t = makeValidTemplate({ version: '0.3' as '0.4' })
    const result = validateTemplate(t)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('version'))).toBe(true)
  })

  it('type inválido gera erro', () => {
    const t = makeValidTemplate({ type: 'unknown' as 'page' })
    const result = validateTemplate(t)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('type inválido'))).toBe(true)
  })

  it('widget sem widgetType gera erro', () => {
    const t = makeValidTemplate()
    // Remove widgetType do widget via unknown para bypassar o sistema de tipos
    const widget = t.content[0].elements[0].elements[0] as unknown as Record<string, unknown>
    delete widget.widgetType
    const result = validateTemplate(t)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('widgetType'))).toBe(true)
  })

  it('IDs duplicados geram erro', () => {
    const t = makeValidTemplate()
    // Força ID duplicado
    t.content[0].elements[0].id = 'aabbccdd'
    const result = validateTemplate(t)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('duplicado'))).toBe(true)
  })

  it('template sem título gera warning (não error)', () => {
    const t = makeValidTemplate({ title: '' })
    const result = validateTemplate(t)
    expect(result.valid).toBe(true) // não é erro bloqueante
    expect(result.warnings.some(w => w.includes('título'))).toBe(true)
  })
})
