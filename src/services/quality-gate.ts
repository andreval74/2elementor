// ─── QUALITY GATE ─────────────────────────────────────────────────────────────
// Gate central de qualidade: combina ValidationResult + StructuralReport +
// VisualValidationResult + Confidence Score e aplica thresholds por modo de geração.
// Regra de bloqueio: apenas erros estruturais críticos bloqueiam.
// Scores abaixo do threshold são registrados como warnings para visibilidade.
// [MAINTENANCE: quality-gate] — ajustar THRESHOLDS ou pesos aqui

import type { ValidationResult } from '@/types/app.types'
import type { Section } from '@/types/layout.types'
import type {
  StructuralReport,
  VisualValidationResult,
  GenerationMode,
  QualityScore,
  QualityThresholds,
  QualityGateResult,
} from '@/types/validation.types'

// ─── THRESHOLDS POR MODO ─────────────────────────────────────────────────────
// CREATE: permissivo — detecção de seções é heurística e pode ter baixa confiança
// EDIT / REFINE: rigoroso — há um original como referência de qualidade

const THRESHOLDS: Record<GenerationMode, QualityThresholds> = {
  create: { structural: 70, visual: 50, confidence: 30, overall: 55 },
  edit:   { structural: 85, visual: 70, confidence: 40, overall: 75 },
  refine: { structural: 85, visual: 70, confidence: 40, overall: 75 },
}

// ─── CALCULADORES DE SCORE ───────────────────────────────────────────────────

/**
 * Score estrutural: começa em 100 e desconta por erros/warnings de validação.
 * Erros de validação básica custam 25 pts; erros estruturais 15 pts; warnings 3 pts.
 */
function calcStructuralScore(
  validation: ValidationResult,
  structuralReport?: StructuralReport | null,
): number {
  let score = 100
  score -= validation.errors.length * 25
  score -= validation.warnings.length * 3
  if (structuralReport) {
    score -= structuralReport.errors.length * 15
    score -= structuralReport.warnings.length * 3
  }
  return Math.max(0, Math.min(100, score))
}

/**
 * Score de confiança: média aritmética das confidences de todas as seções detectadas.
 * Retorna 50 quando não há seções (modos vision/refine onde o parse não é executado).
 */
function calcConfidenceScore(sections: Section[]): number {
  if (sections.length === 0) return 50
  const avg = sections.reduce((sum, s) => sum + s.confidence, 0) / sections.length
  return Math.round(avg * 100)
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────

/**
 * Executa o Quality Gate combinando todos os resultados de validação.
 *
 * Regra de bloqueio:
 * - Erros de validateTemplate ou validateStructuralIntegrity → bloqueiam (já capturados
 *   upstream; incluídos no resultado para visibilidade no score)
 * - Score abaixo do threshold → warning (não bloqueia em Fase 3;
 *   tightening pode ser feito em Fase 5)
 *
 * @param params.mode             - Contexto de geração
 * @param params.validation       - Resultado de validateTemplate()
 * @param params.sections         - Seções detectadas (para calcular confidence)
 * @param params.visualValidation - Resultado de validateVisual()
 * @param params.structuralReport - Resultado de validateStructuralIntegrity() (opcional)
 */
export function runQualityGate(params: {
  mode: GenerationMode
  validation: ValidationResult
  sections: Section[]
  visualValidation: VisualValidationResult
  structuralReport?: StructuralReport | null
}): QualityGateResult {
  const { mode, validation, sections, visualValidation, structuralReport } = params
  const thresholds = THRESHOLDS[mode]

  const score: QualityScore = {
    structural: calcStructuralScore(validation, structuralReport),
    visual:     visualValidation.score,
    confidence: calcConfidenceScore(sections),
    overall:    0,
  }
  // Peso: structural 50% · visual 30% · confidence 20%
  score.overall = Math.round(
    score.structural * 0.50 +
    score.visual     * 0.30 +
    score.confidence * 0.20,
  )

  const blockers: string[] = []
  const warnings: string[] = []

  // ── Bloqueadores críticos (erros já detectados pelos validadores upstream) ──
  if (validation.errors.length > 0) {
    blockers.push(`${validation.errors.length} erro(s) de validação estrutural básica`)
  }
  if (structuralReport && structuralReport.errors.length > 0) {
    blockers.push(`${structuralReport.errors.length} erro(s) de integridade estrutural`)
  }

  // ── Avisos por score abaixo do threshold ─────────────────────────────────
  if (score.structural < thresholds.structural) {
    warnings.push(
      `Score estrutural ${score.structural}/100 abaixo do mínimo de ${thresholds.structural} (modo: ${mode})`,
    )
  }
  if (score.visual < thresholds.visual) {
    warnings.push(
      `Score visual ${score.visual}/100 abaixo do mínimo de ${thresholds.visual}` +
      (visualValidation.issues.length > 0 ? `: ${visualValidation.issues.join('; ')}` : ''),
    )
  }
  if (score.confidence < thresholds.confidence) {
    warnings.push(
      `Confiança de detecção ${score.confidence}/100 abaixo do mínimo de ${thresholds.confidence}`,
    )
  }
  if (score.overall < thresholds.overall) {
    warnings.push(
      `Score geral ${score.overall}/100 abaixo do mínimo de ${thresholds.overall}`,
    )
  }

  // ── Warnings dos validadores upstream ────────────────────────────────────
  for (const w of validation.warnings) {
    if (!warnings.includes(w)) warnings.push(w)
  }
  if (structuralReport) {
    for (const v of structuralReport.warnings) {
      if (!warnings.includes(v.message)) warnings.push(v.message)
    }
  }
  for (const issue of visualValidation.issues) {
    if (!warnings.includes(issue)) warnings.push(issue)
  }

  return { passed: blockers.length === 0, score, thresholds, blockers, warnings, mode }
}
