// ─── STRUCTURAL VALIDATOR ────────────────────────────────────────────────────
// Comparação profunda entre dois ElementorTemplates para detectar perdas estruturais.
// Detecta: widgets perdidos, formulários, container bloat/loss, hierarquia, duplicações.
// [MAINTENANCE: structural-validator] — adicionar novos checks aqui

import { createSnapshotFromElementor } from '@/services/page-snapshot'
import type { ElementorElement, ElementorTemplate, ElementorWidgetType } from '@/types/elementor.types'
import type { PageSnapshot } from '@/types/snapshot.types'
import type { StructuralReport, StructuralViolation } from '@/types/validation.types'

// ─── HELPERS PRIVADOS ────────────────────────────────────────────────────────

/** Conta widgets por widgetType em todo o snapshot. */
function countWidgetsByType(snapshot: PageSnapshot): Map<string, number> {
  const counts = new Map<string, number>()
  for (const section of snapshot.sections) {
    for (const widget of section.widgets) {
      counts.set(widget.widgetType, (counts.get(widget.widgetType) ?? 0) + 1)
    }
  }
  return counts
}

interface ContainerStats {
  total: number
  innerContainers: number
  maxDepth: number
}

/** DFS que acumula estatísticas de containers (total, inner, profundidade máxima). */
function traverseContainerStats(
  elements: ElementorElement[],
  depth: number,
  stats: ContainerStats,
): void {
  for (const el of elements) {
    if (el.elType === 'container' || el.elType === 'section' || el.elType === 'column') {
      stats.total++
      if (el.isInner) stats.innerContainers++
      if (depth > stats.maxDepth) stats.maxDepth = depth
    }
    if (el.elements.length > 0) traverseContainerStats(el.elements, depth + 1, stats)
  }
}

function countContainerStats(template: ElementorTemplate): ContainerStats {
  const stats: ContainerStats = { total: 0, innerContainers: 0, maxDepth: 0 }
  traverseContainerStats(template.content, 0, stats)
  return stats
}

/** Conta ocorrências de <form em html widgets. */
function countFormsInHtmlWidgets(snapshot: PageSnapshot): number {
  let count = 0
  for (const section of snapshot.sections) {
    for (const widget of section.widgets) {
      if (widget.widgetType === 'html') {
        const code = (widget.settings.html as string | undefined) ?? ''
        const matches = code.match(/<form[\s>]/gi)
        if (matches) count += matches.length
      }
    }
  }
  return count
}

/** DFS que coleta IDs e detecta duplicatas. */
function collectIdsWithDuplicates(template: ElementorTemplate): { ids: Set<string>; duplicates: string[] } {
  const ids = new Set<string>()
  const duplicates: string[] = []

  function dfs(elements: ElementorElement[]): void {
    for (const el of elements) {
      if (ids.has(el.id)) {
        if (!duplicates.includes(el.id)) duplicates.push(el.id)
      } else {
        ids.add(el.id)
      }
      if (el.elements.length > 0) dfs(el.elements)
    }
  }

  dfs(template.content)
  return { ids, duplicates }
}

/** Coleta heading titles e detecta duplicatas semânticas. */
function collectHeadingTitles(snapshot: PageSnapshot): { titles: string[]; duplicates: string[] } {
  const seen = new Map<string, number>()
  for (const section of snapshot.sections) {
    for (const widget of section.widgets) {
      if (widget.widgetType === 'heading') {
        const title = ((widget.settings.title as string | undefined) ?? '').trim()
        if (title) seen.set(title, (seen.get(title) ?? 0) + 1)
      }
    }
  }
  const titles = [...seen.keys()]
  const duplicates = [...seen.entries()].filter(([, n]) => n > 1).map(([t]) => t)
  return { titles, duplicates }
}

// ─── CHECKS ──────────────────────────────────────────────────────────────────

const WIDGET_TYPES_TO_CHECK: ElementorWidgetType[] = [
  'heading', 'button', 'image', 'icon-list', 'html', 'video',
]

function checkWidgetTypeCounts(
  origCounts: Map<string, number>,
  evolvedCounts: Map<string, number>,
  violations: StructuralViolation[],
): void {
  for (const wType of WIDGET_TYPES_TO_CHECK) {
    const orig = origCounts.get(wType) ?? 0
    if (orig === 0) continue

    const evolved = evolvedCounts.get(wType) ?? 0
    const lost = orig - evolved
    if (lost <= 0) continue

    const pct = lost / orig
    const isMedia = wType === 'image' || wType === 'video'
    const severity: 'error' | 'warning' = (lost > 2 || pct > 0.3 || isMedia) ? 'error' : 'warning'

    violations.push({
      type: isMedia ? 'missing-media' : 'missing-widget-type',
      severity,
      widgetType: wType,
      message: `${lost} widget(s) "${wType}" perdido(s): ${orig} → ${evolved}`,
      expected: orig,
      actual: evolved,
    })
  }
}

function checkForms(
  origForms: number,
  evolvedForms: number,
  violations: StructuralViolation[],
): void {
  if (origForms === 0) return
  if (evolvedForms < origForms) {
    violations.push({
      type: 'missing-form',
      severity: 'error',
      message: `Formulário(s) perdido(s): ${origForms} → ${evolvedForms} (<form desapareceu)`,
      expected: origForms,
      actual: evolvedForms,
    })
  }
}

function checkContainers(
  origStats: ContainerStats,
  evolvedStats: ContainerStats,
  violations: StructuralViolation[],
): void {
  if (origStats.total === 0) return

  const ratio = evolvedStats.total / origStats.total

  if (ratio > 1.5) {
    violations.push({
      type: 'container-bloat',
      severity: ratio > 2.0 ? 'error' : 'warning',
      message: `Containers aumentaram ${Math.round((ratio - 1) * 100)}%: ${origStats.total} → ${evolvedStats.total}`,
      expected: origStats.total,
      actual: evolvedStats.total,
    })
  } else if (evolvedStats.total < origStats.total * 0.7) {
    violations.push({
      type: 'container-loss',
      severity: 'warning',
      message: `Containers reduziram >30%: ${origStats.total} → ${evolvedStats.total} (possível perda de cards/colunas)`,
      expected: origStats.total,
      actual: evolvedStats.total,
    })
  }

  if (origStats.innerContainers > 0 && evolvedStats.innerContainers < origStats.innerContainers * 0.7) {
    violations.push({
      type: 'container-loss',
      severity: 'warning',
      message: `Inner containers (cards) reduzidos: ${origStats.innerContainers} → ${evolvedStats.innerContainers}`,
      expected: origStats.innerContainers,
      actual: evolvedStats.innerContainers,
    })
  }
}

function checkHierarchy(
  origStats: ContainerStats,
  evolvedStats: ContainerStats,
  violations: StructuralViolation[],
): void {
  const delta = evolvedStats.maxDepth - origStats.maxDepth
  if (delta >= 3) {
    violations.push({
      type: 'hierarchy-change',
      severity: 'error',
      message: `Hierarquia aumentou ${delta} níveis: ${origStats.maxDepth} → ${evolvedStats.maxDepth} (containers desnecessários)`,
      expected: origStats.maxDepth,
      actual: evolvedStats.maxDepth,
    })
  } else if (delta >= 1) {
    violations.push({
      type: 'hierarchy-change',
      severity: 'warning',
      message: `Hierarquia aumentou ${delta} nível(is): ${origStats.maxDepth} → ${evolvedStats.maxDepth}`,
      expected: origStats.maxDepth,
      actual: evolvedStats.maxDepth,
    })
  }
}

function checkDuplicateIds(duplicates: string[], violations: StructuralViolation[]): void {
  for (const id of duplicates) {
    violations.push({
      type: 'duplicate-element',
      severity: 'error',
      message: `ID duplicado no template evoluído: "${id}"`,
    })
  }
}

function checkDuplicateHeadings(headingDuplicates: string[], violations: StructuralViolation[]): void {
  for (const title of headingDuplicates) {
    violations.push({
      type: 'duplicate-element',
      severity: 'warning',
      message: `Título duplicado em heading: "${title.slice(0, 60)}"`,
    })
  }
}

/**
 * Detecta seções do original que desapareceram no evolved sem operação de remoção declarada.
 * Complementa validateNoRegression() com violations tipadas (StructuralViolation) em vez de string[].
 */
function checkMissingSections(
  origSnapshot: PageSnapshot,
  evolvedSnapshot: PageSnapshot,
  violations: StructuralViolation[],
): void {
  const evolvedIds = new Set(evolvedSnapshot.sections.map(s => s.id))
  for (const origSection of origSnapshot.sections) {
    if (!evolvedIds.has(origSection.id)) {
      violations.push({
        type: 'missing-section',
        severity: 'error',
        message: `Seção removida sem operação declarada: id=${origSection.id} (tipo: ${origSection.sectionType})`,
        sectionId: origSection.id,
        sectionType: origSection.sectionType,
      })
    }
  }
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────

/**
 * Compara estruturalmente dois ElementorTemplates e detecta perdas de integridade.
 * Não muta nenhum dos templates — apenas lê.
 * @param original - Template de referência (estado anterior)
 * @param evolved  - Template gerado/evoluído (estado novo)
 * @returns StructuralReport — passed=true somente se não há erros (warnings não bloqueiam)
 */
export function validateStructuralIntegrity(
  original: ElementorTemplate,
  evolved: ElementorTemplate,
): StructuralReport {
  const violations: StructuralViolation[] = []

  const origSnapshot = createSnapshotFromElementor(original)
  const evolvedSnapshot = createSnapshotFromElementor(evolved)
  const origStats = countContainerStats(original)
  const evolvedStats = countContainerStats(evolved)

  checkMissingSections(origSnapshot, evolvedSnapshot, violations)
  checkWidgetTypeCounts(
    countWidgetsByType(origSnapshot),
    countWidgetsByType(evolvedSnapshot),
    violations,
  )
  checkForms(
    countFormsInHtmlWidgets(origSnapshot),
    countFormsInHtmlWidgets(evolvedSnapshot),
    violations,
  )
  checkContainers(origStats, evolvedStats, violations)
  checkHierarchy(origStats, evolvedStats, violations)
  checkDuplicateIds(collectIdsWithDuplicates(evolved).duplicates, violations)
  checkDuplicateHeadings(collectHeadingTitles(evolvedSnapshot).duplicates, violations)

  const errors = violations.filter(v => v.severity === 'error')
  const warnings = violations.filter(v => v.severity === 'warning')

  const parts: string[] = []
  if (errors.length > 0) parts.push(`${errors.length} erro(s)`)
  if (warnings.length > 0) parts.push(`${warnings.length} aviso(s)`)
  const summary = parts.length === 0
    ? 'Validação estrutural: sem violações.'
    : `Validação estrutural: ${parts.join(', ')}.`

  return {
    passed: errors.length === 0,
    violations,
    errors,
    warnings,
    summary,
    generatedAt: new Date().toISOString(),
  }
}
