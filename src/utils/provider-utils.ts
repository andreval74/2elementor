// ─── PROVIDER UTILITIES ──────────────────────────────────────────────────────
// Helpers compartilhados por todos os vision providers.

import type { UIAnalysisResult } from '@/types/vision.types'

/**
 * Enriquece o meta do resultado de análise com timestamp, modelo e provider.
 * Chamado ao final de todos os analyze() dos providers de visão.
 */
export function enrichResultMeta(
  result: UIAnalysisResult,
  model: string,
  provider: string,
  file: File,
): UIAnalysisResult {
  return {
    ...result,
    meta: {
      ...result.meta,
      analyzedAt: new Date().toISOString(),
      model,
      provider,
      imageFile: file.name,
    },
  }
}
