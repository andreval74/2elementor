import type { UIAnalysisResult, VisionProvider } from '@/types/vision.types'
import { VISION_SYSTEM_PROMPT, VISION_USER_PROMPT } from '@/utils/vision-prompt'
import { parseOrRepairJson } from '@/utils/json-repair'

// URL do Worker definida em .env / variável de build
// Se não estiver definida, o provider não aparece na lista
export const PROXY_URL: string = import.meta.env.VITE_PROXY_URL ?? ''
export const isProxyAvailable: boolean = !!PROXY_URL

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'))
    reader.readAsDataURL(file)
  })
}

export const proxyProvider: VisionProvider = {
  id: 'proxy',
  label: 'Análise Automática',
  description: 'Sem configuração · Hospedado pelo WebKeeper',
  isFree: true,
  keyPlaceholder: '',
  keyHelpUrl: '',

  async analyze(file: File): Promise<UIAnalysisResult> {
    if (!PROXY_URL) throw new Error('Proxy não configurado (VITE_PROXY_URL ausente)')
    if (file.size > 10 * 1024 * 1024) throw new Error('Imagem muito grande — máx 10 MB')

    const base64  = await fileToBase64(file)
    const mimeType = file.type || 'image/jpeg'

    const response = await fetch(PROXY_URL, {
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
      let msg = `Erro ${response.status}`
      try { msg = (await response.json()).error?.message ?? msg } catch { /* ignora */ }
      if (response.status === 503 || msg.toLowerCase().includes('high demand'))
        throw new Error('Serviço temporariamente sobrecarregado — tente em alguns minutos')
      throw new Error(msg)
    }

    const data  = await response.json()
    const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!raw) throw new Error('Resposta vazia do servidor')

    let result: UIAnalysisResult
    try {
      result = parseOrRepairJson<UIAnalysisResult>(raw)
    } catch (e) {
      throw new Error(`Análise: ${e instanceof Error ? e.message : 'JSON inválido'}`)
    }

    result.meta = {
      ...result.meta,
      analyzedAt: new Date().toISOString(),
      model: 'gemini-2.5-flash',
      provider: 'proxy',
      imageFile: file.name,
    }
    return result
  },
}
