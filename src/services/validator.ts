// ─── VALIDATOR ───────────────────────────────────────────────────────────────
// Valida a estrutura do JSON Elementor antes de exibir/exportar

import { ELEMENTOR_VERSION } from '@/utils/constants'
import type { ElementorElement, ElementorTemplate, ElementorType } from '@/types/elementor.types'
import type { ValidationResult } from '@/types/app.types'

const VALID_TYPES: ElementorType[] = ['page', 'header', 'footer', 'popup', 'post', 'error-404']
const VALID_EL_TYPES = ['container', 'section', 'column', 'widget']
const MAX_DEPTH = 10

function checkElement(el: ElementorElement, errors: string[], warnings: string[], ids: Set<string>, depth: number): void {
  if (depth > MAX_DEPTH) {
    warnings.push(`Elemento com profundidade > ${MAX_DEPTH}: pode causar problemas no Elementor`)
    return
  }
  if (!el.id) errors.push('Elemento sem ID encontrado')
  else if (ids.has(el.id)) errors.push(`ID duplicado: ${el.id}`)
  else ids.add(el.id)

  if (!VALID_EL_TYPES.includes(el.elType)) errors.push(`elType inválido: ${el.elType}`)
  if (el.elType === 'widget' && !el.widgetType) errors.push(`Widget sem widgetType (id: ${el.id})`)
  if (!el.settings || typeof el.settings !== 'object') errors.push(`settings ausente ou inválido (id: ${el.id})`)
  if (!Array.isArray(el.elements)) errors.push(`elements deve ser array (id: ${el.id})`)
  else el.elements.forEach(child => checkElement(child, errors, warnings, ids, depth + 1))
}

/**
 * Valida um ElementorTemplate completo antes da exportação.
 * @param template - Template a ser validado
 * @returns ValidationResult com erros bloqueantes e warnings
 */
export function validateTemplate(template: ElementorTemplate): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (template.version !== ELEMENTOR_VERSION) errors.push(`version deve ser "${ELEMENTOR_VERSION}", encontrado: "${template.version}"`)
  if (!VALID_TYPES.includes(template.type)) errors.push(`type inválido: "${template.type}"`)
  if (!template.title) warnings.push('Template sem título')
  if (!Array.isArray(template.content)) errors.push('content deve ser um array')
  else {
    const ids = new Set<string>()
    template.content.forEach(el => checkElement(el, errors, warnings, ids, 0))
    if (template.content.length === 0) warnings.push('Nenhuma seção gerada — o HTML pode estar vazio')
  }

  return { valid: errors.length === 0, errors, warnings }
}
