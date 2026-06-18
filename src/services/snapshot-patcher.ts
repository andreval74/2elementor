// ─── SNAPSHOT PATCHER ─────────────────────────────────────────────────────────
// Aplica um PageDiff cirurgicamente sobre um ElementorTemplate original.
// Regra fundamental: spread-based — widget.settings = { ...original, ...delta }
// Nunca substitui o settings inteiro. Preserva TODOS os campos não no diff.
// [MAINTENANCE: patcher] — adicionar suporte a novos DiffOperationType aqui

import { generateUniqueId } from '@/utils/generateId'
import { deepClone } from '@/utils/elementor-utils'
import type { ElementorElement, ElementorTemplate } from '@/types/elementor.types'
import type { PageDiff, DiffOperation, SnapshotSection, SnapshotWidget } from '@/types/snapshot.types'

const MAX_SEARCH_DEPTH = 10

// ─── HELPERS (alguns exportados para structural-corrector.ts) ─────────────────

/** Coleta todos os IDs existentes na árvore para garantir unicidade em novos elementos. */
export function collectIds(elements: ElementorElement[], ids = new Set<string>()): Set<string> {
  for (const el of elements) {
    ids.add(el.id)
    if (el.elements.length > 0) collectIds(el.elements, ids)
  }
  return ids
}

/** DFS para encontrar um elemento pelo ID. Retorna null se não encontrado. */
function findElementById(
  elements: ElementorElement[],
  id: string,
  depth = 0,
): ElementorElement | null {
  if (depth > MAX_SEARCH_DEPTH) return null
  for (const el of elements) {
    if (el.id === id) return el
    const found = findElementById(el.elements, id, depth + 1)
    if (found) return found
  }
  return null
}

/** Remove um elemento pelo ID em qualquer ponto da árvore. */
function removeElementById(elements: ElementorElement[], id: string, depth = 0): boolean {
  if (depth > MAX_SEARCH_DEPTH) return false
  const idx = elements.findIndex(el => el.id === id)
  if (idx !== -1) { elements.splice(idx, 1); return true }
  return elements.some(el => removeElementById(el.elements, id, depth + 1))
}

/** Constrói um ElementorElement widget básico a partir de um SnapshotWidget. */
export function snapshotWidgetToElement(
  widget: SnapshotWidget,
  existingIds: Set<string>,
): ElementorElement {
  return {
    id: generateUniqueId(existingIds),
    elType: 'widget',
    widgetType: widget.widgetType,
    isInner: true,
    settings: { ...widget.settings },
    elements: [],
  }
}

/** Constrói um ElementorElement container a partir de uma SnapshotSection. */
function snapshotSectionToElement(
  section: SnapshotSection,
  existingIds: Set<string>,
): ElementorElement {
  const widgets = section.widgets.map(w => snapshotWidgetToElement(w, existingIds))
  return {
    id: generateUniqueId(existingIds),
    elType: 'container',
    isInner: false,
    settings: {
      flex_direction: 'column',
      content_width: 'full',
      background_background: 'classic',
      background_color: section.backgroundColor ?? '#000000',
    },
    elements: widgets,
  }
}

// ─── APLICADORES DE OPERAÇÃO ──────────────────────────────────────────────────

function applyUpdateWidgetSettings(content: ElementorElement[], op: DiffOperation): void {
  if (!op.widgetId || !op.changedSettings) return
  const widget = findElementById(content, op.widgetId)
  if (!widget) return
  // Spread-based: preserva todos os settings não declarados no delta
  widget.settings = { ...widget.settings, ...op.changedSettings }
}

function applyAddSection(
  content: ElementorElement[],
  op: DiffOperation,
  existingIds: Set<string>,
): void {
  if (!op.newSection) return
  const newEl = snapshotSectionToElement(op.newSection, existingIds)
  const insertAt = op.sectionPositionIndex ?? content.length
  content.splice(Math.min(insertAt, content.length), 0, newEl)
}

function applyRemoveSection(content: ElementorElement[], op: DiffOperation): void {
  if (!op.sectionId) return
  const idx = content.findIndex(el => el.id === op.sectionId)
  if (idx !== -1) content.splice(idx, 1)
}

function applyAddWidget(
  content: ElementorElement[],
  op: DiffOperation,
  existingIds: Set<string>,
): void {
  if (!op.newWidget || !op.sectionId) return
  const section = findElementById(content, op.sectionId)
  if (!section) return
  const newEl = snapshotWidgetToElement(op.newWidget, existingIds)
  section.elements.push(newEl)
}

function applyRemoveWidget(content: ElementorElement[], op: DiffOperation): void {
  if (!op.widgetId) return
  removeElementById(content, op.widgetId)
}

function applyReorderSections(content: ElementorElement[], op: DiffOperation): void {
  if (!op.newOrder || op.newOrder.length === 0) return
  content.sort((a, b) => {
    const ai = op.newOrder!.indexOf(a.id)
    const bi = op.newOrder!.indexOf(b.id)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

function applyOperation(
  content: ElementorElement[],
  op: DiffOperation,
  existingIds: Set<string>,
): void {
  switch (op.type) {
    case 'update-widget-settings': applyUpdateWidgetSettings(content, op); break
    case 'add-section': applyAddSection(content, op, existingIds); break
    case 'remove-section': applyRemoveSection(content, op); break
    case 'add-widget': applyAddWidget(content, op, existingIds); break
    case 'remove-widget': applyRemoveWidget(content, op); break
    case 'reorder-sections': applyReorderSections(content, op); break
  }
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────

/**
 * Aplica um PageDiff cirurgicamente sobre um ElementorTemplate original.
 * O template original não é mutado — retorna um novo objeto clonado e evoluído.
 * @param template - Template original (preservado intacto)
 * @param diff     - Diff produzido por computeDiff()
 * @returns Novo ElementorTemplate com apenas as mudanças do diff aplicadas
 */
export function applyDiff(template: ElementorTemplate, diff: PageDiff): ElementorTemplate {
  if (!diff.hasChanges) return deepClone(template)

  const evolved = deepClone(template)
  const existingIds = collectIds(evolved.content)

  for (const op of diff.operations) {
    applyOperation(evolved.content, op, existingIds)
  }

  return evolved
}
