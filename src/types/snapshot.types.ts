// ─── SNAPSHOT TYPES ──────────────────────────────────────────────────────────
// Representação estruturada de uma página para comparação e diff incremental.
// Usada pelo motor de EDIT MODE para nunca reconstruir o que já existe.

import type { ElementorWidgetType, ElementorSettings } from './elementor.types'
import type { VisionSectionType } from './vision.types'

// ── SnapshotWidget ────────────────────────────────────────────────────────────
// Widget folha (elType: 'widget') na lista aplanada DFS de uma seção.
// Preserva o ID original para o patcher localizar o elemento exato.

export interface SnapshotWidget {
  id: string                       // ID hex original — NUNCA regenerado
  widgetType: ElementorWidgetType  // 'heading' | 'text-editor' | 'button' | ...
  settings: ElementorSettings      // cópia profunda dos settings no momento do snapshot
  positionIndex: number            // posição na lista aplanada dentro da seção (0-based)
}

// ── SnapshotSection ───────────────────────────────────────────────────────────
// Container raiz (content[i]) do ElementorTemplate com widgets aplanados.
// sectionType inferido por heurística a partir dos widgets presentes.

export interface SnapshotSection {
  id: string                       // ID hex do container raiz (content[i].id)
  sectionType: VisionSectionType   // 'header' | 'hero' | 'services' | ... | 'unknown'
  positionIndex: number            // posição em content[] (0-based)
  backgroundColor: string | undefined
  widgets: SnapshotWidget[]        // lista aplanada (DFS) de todos os widgets da seção
  widgetCount: number              // cache — evita recalcular em comparações
}

// ── DesignTokenSnapshot ───────────────────────────────────────────────────────
// Design tokens extraídos do JSON Elementor sem análise de IA.
// Subset dos tokens que podem ser derivados apenas de settings.

export interface DesignTokenSnapshot {
  backgroundColors: string[]          // background_color únicos das seções
  textColors: string[]                // title_color + text_color únicos
  fontFamilies: string[]              // typography_font_family únicos
  primaryButtonColor: string | undefined  // background_color do primeiro widget button
}

// ── PageSnapshot ──────────────────────────────────────────────────────────────
// Fotografia estrutural completa de uma página em um instante no tempo.
// Criada do JSON Elementor original (EDIT MODE) ou dos novos elementos (comparação).

export interface PageSnapshot {
  createdAt: string                // ISO timestamp
  source: 'elementor' | 'html-pipeline' | 'vision'
  sectionCount: number             // cache de sections.length
  totalWidgetCount: number         // soma dos widgetCount de todas as seções
  sections: SnapshotSection[]
  designTokens: DesignTokenSnapshot
}

// ─── DIFF TYPES ───────────────────────────────────────────────────────────────

export type DiffOperationType =
  | 'update-widget-settings'   // campos settings de um widget existente mudaram
  | 'add-section'              // seção presente no HTML novo, ausente no original
  | 'remove-section'           // seção presente no original, ausente no HTML novo
  | 'add-widget'               // widget novo dentro de seção existente
  | 'remove-widget'            // widget existia na seção mas sumiu
  | 'reorder-sections'         // a ordem relativa das seções mudou

// ── DiffOperation ─────────────────────────────────────────────────────────────
// Operação atômica e reversível. O patcher lê apenas os campos relevantes
// para o tipo da operação — os demais ficam undefined.

export interface DiffOperation {
  type: DiffOperationType
  // Para operações em seções:
  sectionId?: string               // ID do container raiz afetado
  sectionPositionIndex?: number    // posição em content[] (usado em add-section)
  newSection?: SnapshotSection     // payload para add-section
  // Para operações em widgets:
  widgetId?: string                // ID do widget afetado
  changedSettings?: Partial<ElementorSettings>  // apenas os campos que mudaram
  newWidget?: SnapshotWidget       // payload para add-widget
  // Para reorder:
  newOrder?: string[]              // sectionIds na nova ordem desejada
}

// ── PageDiff ──────────────────────────────────────────────────────────────────
// Resultado da comparação entre dois PageSnapshot.
// O patcher consome este objeto para aplicar mudanças cirurgicamente.

export interface PageDiff {
  computedAt: string               // ISO timestamp
  scope: string                    // contexto declarado (ex: 'hero-text', 'full-page')
  originalSectionCount: number
  updatedSectionCount: number
  operations: DiffOperation[]
  hasChanges: boolean              // atalho: operations.length > 0
  addedSections: number
  removedSections: number
  modifiedWidgets: number
}
