// ─── STRUCTURAL CORRECTOR ────────────────────────────────────────────────────
// Aplica correções locais cirúrgicas para cada tipo de violação estrutural.
// Regra: spread-based — nunca substitui settings inteiros, apenas injeta/remove elementos.
// [MAINTENANCE: structural-corrector] — adicionar suporte a novos StructuralViolationType aqui

import { generateUniqueId } from '@/utils/generateId'
import { deepClone } from '@/utils/elementor-utils'
import { collectIds, snapshotWidgetToElement } from '@/services/snapshot-patcher'
import { createSnapshotFromElementor } from '@/services/page-snapshot'
import type { ElementorElement, ElementorTemplate } from '@/types/elementor.types'
import type { SnapshotSection } from '@/types/snapshot.types'
import type { StructuralReport } from '@/types/validation.types'

const MAX_DEPTH = 10

/**
 * Encontra o container raiz correspondente a uma SnapshotSection no evolved template.
 * Tenta em ordem: mesmo ID → mesmo sectionType → mesma posição.
 */
function findEvolvedSection(
  evolvedContent: ElementorElement[],
  origSection: SnapshotSection,
  evolvedSnapshot: ReturnType<typeof createSnapshotFromElementor>,
): ElementorElement | null {
  // Fase 1: mesmo ID (seção sobreviveu ao patch sem remoção)
  const byId = evolvedContent.find(el => el.id === origSection.id)
  if (byId) return byId

  // Fase 2: mesmo sectionType
  if (origSection.sectionType !== 'unknown') {
    const matchSnap = evolvedSnapshot.sections.find(s => s.sectionType === origSection.sectionType)
    if (matchSnap) {
      const byType = evolvedContent.find(el => el.id === matchSnap.id)
      if (byType) return byType
    }
  }

  // Fase 3: mesma posição
  return evolvedContent[origSection.positionIndex] ?? null
}

// ─── ESTRATÉGIAS DE CORREÇÃO ─────────────────────────────────────────────────

/**
 * Re-injeta widgets de um tipo específico que desapareceram.
 * Para cada seção do original que tinha widgets desse tipo, compara com a seção
 * correspondente no evolved e injeta os que faltam no final dos elements[].
 */
function injectMissingWidgetType(
  evolved: ElementorTemplate,
  original: ElementorTemplate,
  widgetType: string,
  existingIds: Set<string>,
): void {
  const origSnapshot = createSnapshotFromElementor(original)
  const evolvedSnapshot = createSnapshotFromElementor(evolved)

  for (const origSection of origSnapshot.sections) {
    const widgetsOfType = origSection.widgets.filter(w => w.widgetType === widgetType)
    if (widgetsOfType.length === 0) continue

    const evolvedSection = findEvolvedSection(evolved.content, origSection, evolvedSnapshot)
    if (!evolvedSection) continue

    // Conta quantos do tipo já existem na seção evoluída (via snapshot flat)
    const matchedEvolvedSection = evolvedSnapshot.sections.find(s => s.id === evolvedSection.id)
    const existingCount = matchedEvolvedSection
      ? matchedEvolvedSection.widgets.filter(w => w.widgetType === widgetType).length
      : 0

    const toInject = widgetsOfType.slice(existingCount)
    for (const widget of toInject) {
      const newEl = snapshotWidgetToElement(widget, existingIds)
      evolvedSection.elements.push(newEl)
    }
  }
}

/**
 * Achata containers intermediários desnecessários:
 * - Remove containers vazios (0 filhos) que não são raiz
 * - Inlina containers com 1 filho que é também container (redundância de nesting)
 * Retorna true se alguma mudança foi aplicada.
 */
function flattenSingleChildContainers(elements: ElementorElement[], depth = 0): boolean {
  if (depth > MAX_DEPTH) return false
  let changed = false

  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i]
    if (el.elements.length > 0) {
      if (flattenSingleChildContainers(el.elements, depth + 1)) changed = true
    }

    // Remove containers vazios (nunca no nível raiz — raiz é content[])
    if (
      depth > 0 &&
      (el.elType === 'container' || el.elType === 'section' || el.elType === 'column') &&
      el.elements.length === 0
    ) {
      elements.splice(i, 1)
      changed = true
      continue
    }

    // Inlina container que só contém outro container (sem widget direto)
    if (
      depth > 0 &&
      (el.elType === 'container' || el.elType === 'section') &&
      el.elements.length === 1 &&
      (el.elements[0].elType === 'container' || el.elements[0].elType === 'section') &&
      el.elements[0].elements.length > 0
    ) {
      const child = el.elements[0]
      elements.splice(i, 1, ...child.elements)
      changed = true
    }
  }
  return changed
}

/**
 * Regenera IDs duplicados encontrados no template evoluído.
 * Mantém o primeiro ID encontrado e substitui as ocorrências subsequentes.
 */
function regenerateDuplicateIds(template: ElementorTemplate, existingIds: Set<string>): void {
  const seenIds = new Set<string>()

  function fixIds(elements: ElementorElement[]): void {
    for (const el of elements) {
      if (seenIds.has(el.id)) {
        const newId = generateUniqueId(existingIds)
        el.id = newId
        existingIds.add(newId)
      } else {
        seenIds.add(el.id)
        existingIds.add(el.id)
      }
      if (el.elements.length > 0) fixIds(el.elements)
    }
  }

  fixIds(template.content)
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────

/**
 * Aplica correções estruturais locais para as violações encontradas no StructuralReport.
 * O template evoluído é deep-clonado antes de qualquer mutação — o input não é mutado.
 * Estratégia best-effort: tenta corrigir cada violação; não garante 100% de resolução.
 * @param evolved   - Template gerado com violações
 * @param original  - Template original (fonte para re-injeção de elementos perdidos)
 * @param report    - Relatório de violações de validateStructuralIntegrity()
 * @returns Novo ElementorTemplate com correções aplicadas
 */
export function applyStructuralCorrections(
  evolved: ElementorTemplate,
  original: ElementorTemplate,
  report: StructuralReport,
): ElementorTemplate {
  const corrected = deepClone(evolved)
  const existingIds = collectIds(corrected.content)

  // Processa violações na ordem: primeiro IDs duplicados (resolve colisões),
  // depois widgets ausentes, depois estrutura (bloat/hierarquia)
  const ordered = [
    ...report.violations.filter(v => v.type === 'duplicate-element'),
    ...report.violations.filter(v => v.type === 'missing-widget-type' || v.type === 'missing-media'),
    ...report.violations.filter(v => v.type === 'missing-form'),
    ...report.violations.filter(v => v.type === 'container-bloat' || v.type === 'hierarchy-change'),
  ]

  for (const violation of ordered) {
    switch (violation.type) {
      case 'duplicate-element':
        regenerateDuplicateIds(corrected, existingIds)
        break

      case 'missing-widget-type':
      case 'missing-media':
        if (violation.widgetType) {
          injectMissingWidgetType(corrected, original, violation.widgetType, existingIds)
        }
        break

      case 'missing-form':
        // Formulários vivem dentro de html widgets — re-injeta todos os html widgets ausentes
        injectMissingWidgetType(corrected, original, 'html', existingIds)
        break

      case 'container-bloat':
      case 'hierarchy-change':
        flattenSingleChildContainers(corrected.content)
        break

      case 'container-loss':
      case 'missing-section':
        // container-loss: pode ser simplificação intencional — não corrige automaticamente
        // missing-section: coberto por validateNoRegression + patcher — não duplicar aqui
        break
    }
  }

  return corrected
}
