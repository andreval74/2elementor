import type { UIAnalysisResult, VisionProvider } from '@/types/vision.types'
import { VISION_SYSTEM_PROMPT, VISION_USER_PROMPT } from '@/utils/vision-prompt'
import { parseOrRepairJson } from '@/utils/json-repair'
import { fileToBase64DataUrl } from '@/utils/base64'
import { enrichResultMeta } from '@/utils/provider-utils'

const TOGETHER_MODEL = 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo'
const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions'

export const togetherProvider: VisionProvider = {
  id: 'together',
  label: 'Together AI (Llama Vision)',
  description: 'Together AI · $25 créditos grátis · Llama 3.2 11B',
  isFree: true,
  keyPlaceholder: 'together_...',
  keyHelpUrl: 'https://api.together.ai/settings/api-keys',

  async analyze(file: File, apiKey: string): Promise<UIAnalysisResult> {
    if (!apiKey.trim()) throw new Error('Chave API Together AI obrigatória')

    const dataUrl = await fileToBase64DataUrl(file)

    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: TOGETHER_MODEL,
        max_tokens: 16384,
        temperature: 0.1,
        messages: [
          { role: 'system', content: VISION_SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: dataUrl } },
              { type: 'text', text: VISION_USER_PROMPT },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      let message = `Erro Together AI ${response.status}`
      try {
        const err = await response.json()
        message = err.error?.message ?? message
      } catch { /* ignora */ }
      if (response.status === 401) message = 'Chave Together AI inválida'
      if (response.status === 429) message = 'Créditos Together AI esgotados ou rate limit atingido'
      throw new Error(message)
    }

    const data = await response.json()
    const raw: string = data.choices?.[0]?.message?.content ?? ''
    if (!raw) throw new Error('Together AI retornou resposta vazia')

    let result: UIAnalysisResult
    try {
      result = parseOrRepairJson<UIAnalysisResult>(raw)
    } catch (e) {
      throw new Error(`Together AI: ${e instanceof Error ? e.message : 'JSON inválido'}`)
    }
    return enrichResultMeta(result, TOGETHER_MODEL, 'together', file)
  },
}
