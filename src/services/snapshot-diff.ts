// ─── SNAPSHOT DIFF ────────────────────────────────────────────────────────────
// Compara dois PageSnapshot e produz um PageDiff com operações atômicas.
// Matching de seções: por tipo (header→header, hero→hero) como chave primária,
// por posição como chave secundária. Matching de widgets: por widgetType + positionIndex.
// [MAINTENANCE: diff] — melhorar matchSections ou diffSettings aqui

import type {
  PageSnapshot,
  SnapshotSection,
  SnapshotWidget,
  PageDiff,
  DiffOperation,
} from '@/types/snapshot.types'
import type { ElementorSettings } from '@/types/elementor.types'

// ─── MATCHING ────────────────────────────────────────────────────────────────

interface SectionPair {
  original: SnapshotSection
  updated: SnapshotSection | null  // null = seção removida
  isNew: boolean                   // true = não tem contraparte no original
}

/**
 * Fase 1: match por tipo (apenas tipos que aparecem exatamente UMA vez em cada snapshot).
 * Retorna pares unambíguos e listas de seções ainda não pareadas.
 */
function matchByType(
  originals: SnapshotSection[],
  updates: SnapshotSection[],
): { pairs: SectionPair[]; unmatchedOriginals: SnapshotSection[]; unmatchedUpdates: SnapshotSection[] } {
  const pairs: SectionPair[] = []
  const usedOriginalIds = new Set<string>()
  const usedUpdateIdxs = new Set<number>()

  for (const orig of originals) {
    const sameTypeOriginals = originals.filter(s => s.sectionType === orig.sectionType)
    const sameTypeUpdates = updates.filter(s => s.sectionType === orig.sectionType)
    if (sameTypeOriginals.length === 1 && sameTypeUpdates.length === 1) {
      pairs.push({ original: orig, updated: sameTypeUpdates[0], isNew: false })
      usedOriginalIds.add(orig.id)
      usedUpdateIdxs.add(updates.indexOf(sameTypeUpdates[0]))
    }
  }

  const unmatchedOriginals = originals.filter(s => !usedOriginalIds.has(s.id))
  const unmatchedUpdates = updates.filter((_, i) => !usedUpdateIdxs.has(i))
  return { pairs, unmatchedOriginals, unmatchedUpdates }
}

/**
 * Fase 2: match por posição para seções não pareadas na Fase 1.
 * Extras no updated → isNew = true. Faltando no updated → updated = null.
 */
function matchByPosition(
  unmatchedOriginals: SnapshotSection[],
  unmatchedUpdates: SnapshotSection[],
): SectionPair[] {
  const pairs: SectionPair[] = []
  const maxLen = Math.max(unmatchedOriginals.length, unmatchedUpdates.length)
  for (let i = 0; i < maxLen; i++) {
    const orig = unmatchedOriginals[i]
    const upd = unmatchedUpdates[i]
    if (orig && upd) pairs.push({ original: orig, updated: upd, isNew: false })
    else if (orig && !upd) pairs.push({ original: orig, updated: null, isNew: false })
    // Seção nova sem contraparte original: original=upd para que computeDiff() acesse os dados via pair.original ao emitir 'add-section'
    else if (!orig && upd) pairs.push({ original: upd, updated: upd, isNew: true })
  }
  return pairs
}

// ─── WIDGET DIFF ─────────────────────────────────────────────────────────────

/**
 * Compara dois settings e retorna apenas os campos que mudaram.
 * Usa JSON.stringify para comparação profunda de objetos aninhados.
 */
function diffSettings(
  original: ElementorSettings,
  updated: ElementorSettings,
): Partial<ElementorSettings> | null {
  const delta: Partial<ElementorSettings> = {}
  for (const key of Object.keys(updated) as (keyof ElementorSettings)[]) {
    if (JSON.stringify(updated[key]) !== JSON.stringify(original[key])) {
      ;(delta as Record<string, unknown>)[key] = updated[key]
    }
  }
  return Object.keys(delta).length > 0 ? delta : null
}

/**
 * Compara widgets de duas seções pareadas e produz operações de diff.
 * Match por widgetType + positionIndex dentro da lista aplanada.
 */
function diffWidgets(original: SnapshotSection, updated: SnapshotSection): DiffOperation[] {
  const ops: DiffOperation[] = []
  const maxLen = Math.max(original.widgets.length, updated.widgets.length)

  for (let i = 0; i < maxLen; i++) {
    const origW: SnapshotWidget | undefined = original.widgets[i]
    const updW: SnapshotWidget | undefined = updated.widgets[i]

    if (origW && updW) {
      if (origW.widgetType !== updW.widgetType) {
        // Tipo diferente na mesma posição → remove o antigo, adiciona o novo
        ops.push({ type: 'remove-widget', sectionId: original.id, widgetId: origW.id })
        ops.push({ type: 'add-widget', sectionId: original.id, newWidget: updW })
        continue
      }
      const delta = diffSettings(origW.settings, updW.settings)
      if (delta) {
        ops.push({
          type: 'update-widget-settings',
          sectionId: original.id,
          widgetId: origW.id,
          changedSettings: delta,
        })
      }
    } else if (origW && !updW) {
      ops.push({ type: 'remove-widget', sectionId: original.id, widgetId: origW.id })
    } else if (!origW && updW) {
      ops.push({ type: 'add-widget', sectionId: original.id, newWidget: updW })
    }
  }
  return ops
}

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

/**
 * Compara dois PageSnapshot e produz um PageDiff com operações mínimas.
 * @param original - Snapshot do estado atual da página (do JSON original)
 * @param updated  - Snapshot produzido pelo novo HTML (do pipeline HTML)
 * @param scope    - Descrição humana do escopo (ex: 'hero-headline', 'full-page')
 */
export function computeDiff(
  original: PageSnapshot,
  updated: PageSnapshot,
  scope = 'full-page',
): PageDiff {
  const { pairs: typePairs, unmatchedOriginals, unmatchedUpdates } = matchByType(
    original.sections,
    updated.sections,
  )
  const positionPairs = matchByPosition(unmatchedOriginals, unmatchedUpdates)
  const allPairs = [...typePairs, ...positionPairs]

  const operations: DiffOperation[] = []
  let addedSections = 0
  let removedSections = 0
  let modifiedWidgets = 0

  for (const pair of allPairs) {
    if (pair.isNew) {
      operations.push({
        type: 'add-section',
        sectionPositionIndex: pair.original.positionIndex,
        newSection: pair.original,
      })
      addedSections++
    } else if (!pair.updated) {
      operations.push({ type: 'remove-section', sectionId: pair.original.id })
      removedSections++
    } else {
      const widgetOps = diffWidgets(pair.original, pair.updated)
      operations.push(...widgetOps)
      modifiedWidgets += widgetOps.filter(op => op.type === 'update-widget-settings').length
    }
  }

  // Verificar se a ordem das seções mudou (excluindo adições/remoções)
  const origIds = original.sections.map(s => s.id)
  const matchedNewOrder = allPairs
    .filter(p => !p.isNew && p.updated)
    .map(p => p.updated!.sectionType)
  const origOrder = allPairs
    .filter(p => !p.isNew && p.updated)
    .map(p => p.original.sectionType)
  if (JSON.stringify(origOrder) !== JSON.stringify(matchedNewOrder)) {
    operations.push({ type: 'reorder-sections', newOrder: origIds })
  }

  return {
    computedAt: new Date().toISOString(),
    scope,
    originalSectionCount: original.sectionCount,
    updatedSectionCount: updated.sectionCount,
    operations,
    hasChanges: operations.length > 0,
    addedSections,
    removedSections,
    modifiedWidgets,
  }
}

/**
 * Gera um resumo legível do PageDiff em português.
 * @param diff - Diff produzido por computeDiff()
 */
export function summarizeDiff(diff: PageDiff): string {
  if (!diff.hasChanges) return 'Nenhuma alteração detectada.'
  const parts: string[] = []
  if (diff.modifiedWidgets > 0) parts.push(`${diff.modifiedWidgets} widget(s) atualizado(s)`)
  if (diff.addedSections > 0) parts.push(`${diff.addedSections} seção(ões) adicionada(s)`)
  if (diff.removedSections > 0) parts.push(`${diff.removedSections} seção(ões) removida(s)`)
  const addWidgets = diff.operations.filter(op => op.type === 'add-widget').length
  const removeWidgets = diff.operations.filter(op => op.type === 'remove-widget').length
  if (addWidgets > 0) parts.push(`${addWidgets} widget(s) novo(s)`)
  if (removeWidgets > 0) parts.push(`${removeWidgets} widget(s) removido(s)`)
  return parts.join('; ') + '.'
}
