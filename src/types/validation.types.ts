// ─── VALIDATION TYPES ────────────────────────────────────────────────────────
// Tipos para o sistema de validação estrutural profunda.
// Usado por structural-validator.ts e structural-corrector.ts.

export type StructuralViolationType =
  | 'missing-widget-type'  // widgets de um tipo específico desapareceram
  | 'missing-section'      // seção removida sem operação de remoção declarada
  | 'container-bloat'      // containers aumentaram >50% (geração de estrutura desnecessária)
  | 'container-loss'       // containers diminuíram >30% (cards/colunas perdidos)
  | 'duplicate-element'    // mesmo ID ou mesmo heading_title em >1 localização
  | 'hierarchy-change'     // profundidade máxima da árvore aumentou >2 níveis
  | 'missing-form'         // <form desapareceu de html widget
  | 'missing-media'        // widgets image/video perdidos

export interface StructuralViolation {
  type: StructuralViolationType
  severity: 'error' | 'warning'
  message: string
  sectionId?: string
  sectionType?: string
  widgetType?: string
  expected?: number
  actual?: number
}

export interface StructuralReport {
  passed: boolean
  violations: StructuralViolation[]
  errors: StructuralViolation[]    // severity === 'error' — bloqueiam exportação
  warnings: StructuralViolation[]  // severity === 'warning' — logados, não bloqueiam
  summary: string
  generatedAt: string
}

// ─── GENERATION MODE ─────────────────────────────────────────────────────────

export type GenerationMode = 'create' | 'edit' | 'refine'

// ─── VISUAL VALIDATION TYPES ─────────────────────────────────────────────────
// Validação visual estrutural: aproximação sem browser.
// Compara proporções de elementos visuais entre original e evoluído.
// Em CREATE MODE executa self-audit (sem original para comparar).

export interface VisualValidationResult {
  passed: boolean
  score: number              // 0–100 score geral de similaridade visual
  colorScore: number         // 0–100 preservação de cores de fundo das seções
  typographyScore: number    // 0–100 preservação de famílias tipográficas
  layoutScore: number        // 0–100 preservação de estrutura (seções, widgets)
  mediaScore: number         // 0–100 preservação de URLs de imagem
  issues: string[]           // problemas detectados em linguagem legível
  mode: GenerationMode
}

// ─── QUALITY GATE TYPES ──────────────────────────────────────────────────────
// Gate central que combina ValidationResult + StructuralReport +
// VisualValidationResult + Confidence Score e aplica thresholds por modo.

export interface QualityScore {
  structural: number   // 0–100 baseado em ValidationResult + StructuralReport
  visual: number       // 0–100 de VisualValidationResult.score
  confidence: number   // 0–100 média das confidences de detecção de seções
  overall: number      // 0–100 média ponderada (structural 50% + visual 30% + confidence 20%)
}

export interface QualityThresholds {
  structural: number   // score estrutural mínimo aceitável
  visual: number       // score visual mínimo aceitável
  confidence: number   // confiança de detecção mínima aceitável
  overall: number      // score geral mínimo aceitável
}

export interface QualityGateResult {
  passed: boolean
  score: QualityScore
  thresholds: QualityThresholds
  blockers: string[]   // razões que impedem a exportação
  warnings: string[]   // avisos não bloqueantes registrados
  mode: GenerationMode
}
