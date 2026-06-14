import type { UIAnalysisResult, VisionProvider } from '@/types/vision.types'
import { VISION_SYSTEM_PROMPT, VISION_USER_PROMPT } from '@/utils/vision-prompt'
import { parseOrRepairJson } from '@/utils/json-repair'

const CLAUDE_MODEL = 'claude-opus-4-8'
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'))
    reader.readAsDataURL(file)
  })
}

function sanitizeMediaType(type: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
  return (allowed as readonly string[]).includes(type)
    ? (type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp')
    : 'image/jpeg'
}

export const claudeProvider: VisionProvider = {
  id: 'claude',
  label: 'Claude Opus (Anthropic)',
  description: 'Anthropic · Pago · Máxima qualidade de análise',
  isFree: false,
  keyPlaceholder: 'sk-ant-...',
  keyHelpUrl: 'https://console.anthropic.com/settings/keys',

  async analyze(file: File, apiKey: string): Promise<UIAnalysisResult> {
    if (!apiKey.trim()) throw new Error('Chave API Anthropic obrigatória')
    if (file.size > 5 * 1024 * 1024) throw new Error('Imagem muito grande — máx 5 MB para Claude')

    const base64 = await fileToBase64(file)
    const mediaType = sanitizeMediaType(file.type)

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 16384,
        system: VISION_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
              { type: 'text', text: VISION_USER_PROMPT },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      let message = `Erro Claude ${response.status}`
      try {
        const err = await response.json()
        message = err.error?.message ?? message
      } catch { /* ignora */ }
      if (response.status === 401) message = 'Chave Anthropic inválida ou expirada'
      if (response.status === 429) message = 'Limite de requisições Claude atingido — aguarde e tente novamente'
      if (response.status === 413) message = 'Imagem muito grande para a API'
      throw new Error(message)
    }

    const data = await response.json()
    const raw: string = (data.content?.[0]?.text ?? '').trim()
    if (!raw) throw new Error('Claude retornou resposta vazia')

    let result: UIAnalysisResult
    try {
      result = parseOrRepairJson<UIAnalysisResult>(raw)
    } catch (e) {
      throw new Error(`Claude: ${e instanceof Error ? e.message : 'JSON inválido'}`)
    }
    result.meta = {
      ...result.meta,
      analyzedAt: new Date().toISOString(),
      model: data.model ?? CLAUDE_MODEL,
      provider: 'claude',
      imageFile: file.name,
    }
    return result
  },
}
