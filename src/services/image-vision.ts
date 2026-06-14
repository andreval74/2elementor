// ─── IMAGE VISION ─────────────────────────────────────────────────────────────
// Fachada para análise de imagem — delega ao provider selecionado

import type { UIAnalysisResult } from '@/types/vision.types'
import { getProvider } from './vision-registry'

export type { UIAnalysisResult }

/**
 * Analisa uma imagem com o provider de IA selecionado e retorna UIAnalysisResult.
 * O campo code.html pode ser enviado diretamente ao pipeline Elementor.
 *
 * @param file        - Arquivo de imagem (PNG, JPG, WebP, etc.)
 * @param apiKey      - Chave do provider selecionado
 * @param providerId  - 'gemini' | 'openrouter' | 'together' | 'claude'
 */
export async function analyzeImageWithVision(
  file: File,
  apiKey: string,
  providerId: string = 'gemini',
): Promise<UIAnalysisResult> {
  if (!file) throw new Error('Arquivo de imagem obrigatório')
  const provider = getProvider(providerId)
  return provider.analyze(file, apiKey)
}
