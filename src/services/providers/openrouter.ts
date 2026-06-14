import type { UIAnalysisResult, VisionProvider } from '@/types/vision.types'
import { VISION_SYSTEM_PROMPT, VISION_USER_PROMPT } from '@/utils/vision-prompt'
import { parseOrRepairJson } from '@/utils/json-repair'

const OR_MODEL = 'google/gemini-2.0-flash-exp:free'
const OR_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

function fileToBase64DataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'))
    reader.readAsDataURL(file)
  })
}

export const openrouterProvider: VisionProvider = {
  id: 'openrouter',
  label: 'OpenRouter (Gemini Flash)',
  description: 'OpenRouter · Gratuito · 50 req/dia sem cartão',
  isFree: true,
  keyPlaceholder: 'sk-or-v1-...',
  keyHelpUrl: 'https://openrouter.ai/keys',

  async analyze(file: File, apiKey: string): Promise<UIAnalysisResult> {
    if (!apiKey.trim()) throw new Error('Chave API OpenRouter obrigatória')

    const dataUrl = await fileToBase64DataUrl(file)

    const response = await fetch(OR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
        'HTTP-Referer': 'https://webkeeper.app',
        'X-Title': 'WebKeeper Elementor Exporter',
      },
      body: JSON.stringify({
        model: OR_MODEL,
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
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      let message = `Erro OpenRouter ${response.status}`
      try {
        const err = await response.json()
        message = err.error?.message ?? message
      } catch { /* ignora */ }
      if (response.status === 401) message = 'Chave OpenRouter inválida'
      if (response.status === 429) message = 'Limite gratuito do OpenRouter atingido — tente amanhã (50 req/dia)'
      throw new Error(message)
    }

    const data = await response.json()
    const raw: string = data.choices?.[0]?.message?.content ?? ''
    if (!raw) throw new Error('OpenRouter retornou resposta vazia')

    let result: UIAnalysisResult
    try {
      result = parseOrRepairJson<UIAnalysisResult>(raw)
    } catch (e) {
      throw new Error(`OpenRouter: ${e instanceof Error ? e.message : 'JSON inválido'}`)
    }
    result.meta = {
      ...result.meta,
      analyzedAt: new Date().toISOString(),
      model: OR_MODEL,
      provider: 'openrouter',
      imageFile: file.name,
    }
    return result
  },
}
