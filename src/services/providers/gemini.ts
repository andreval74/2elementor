import type { UIAnalysisResult, VisionProvider } from '@/types/vision.types'
import { VISION_SYSTEM_PROMPT, VISION_USER_PROMPT } from '@/utils/vision-prompt'
import { parseOrRepairJson } from '@/utils/json-repair'
import { fileToBase64 } from '@/utils/base64'
import { enrichResultMeta } from '@/utils/provider-utils'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export const geminiProvider: VisionProvider = {
  id: 'gemini',
  label: 'Gemini 2.5 Flash',
  description: 'Google AI Studio · Gratuito · 250 req/dia',
  isFree: true,
  keyPlaceholder: 'AIzaSy...',
  keyHelpUrl: 'https://aistudio.google.com/app/apikey',

  async analyze(file: File, apiKey: string): Promise<UIAnalysisResult> {
    if (!apiKey.trim()) throw new Error('Chave API Gemini obrigatória')
    if (file.size > 10 * 1024 * 1024) throw new Error('Imagem muito grande — máx 10 MB para Gemini')

    const base64 = await fileToBase64(file)
    const mimeType = file.type || 'image/jpeg'

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey.trim()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: VISION_SYSTEM_PROMPT }] },
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: base64 } },
              { text: VISION_USER_PROMPT },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topP: 0.9,
          maxOutputTokens: 32768,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!response.ok) {
      let apiMsg = ''
      try { apiMsg = (await response.json()).error?.message ?? '' } catch { /* ignora */ }
      const msg = apiMsg || `Erro ${response.status}`
      if (response.status === 400) throw new Error('Chave API Gemini inválida ou requisição malformada')
      if (response.status === 429) throw new Error('Limite gratuito do Gemini atingido — tente amanhã (250 req/dia)')
      if (response.status === 503 || msg.toLowerCase().includes('high demand') || msg.toLowerCase().includes('overload'))
        throw new Error('Gemini sobrecarregado agora — tente em alguns minutos ou troque para OpenRouter (também gratuito)')
      throw new Error(`Gemini: ${msg}`)
    }

    const data = await response.json()
    const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!raw) throw new Error('Gemini retornou resposta vazia')

    let result: UIAnalysisResult
    try {
      result = parseOrRepairJson<UIAnalysisResult>(raw)
    } catch (e) {
      throw new Error(`Gemini: ${e instanceof Error ? e.message : 'JSON inválido'}`)
    }
    return enrichResultMeta(result, GEMINI_MODEL, 'gemini', file)
  },
}
