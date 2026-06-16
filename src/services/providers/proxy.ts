import type { UIAnalysisResult, VisionProvider } from '@/types/vision.types'
import { parseOrRepairJson } from '@/utils/json-repair'
import { extractDominantColors } from '@/utils/color-extractor'
import { compressImage } from '@/utils/image-compressor'

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
    if (file.size > 20 * 1024 * 1024) throw new Error('Imagem muito grande — máx 20 MB')

    // Comprime antes de extrair cores e converter para base64
    console.log(`[Vision] Preparando imagem: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`)
    const ready = await compressImage(file)
    if (ready !== file) {
      console.log(`[Vision] Imagem comprimida: ${(ready.size / 1024).toFixed(0)} KB (era ${(file.size / 1024).toFixed(0)} KB)`)
    }

    const [base64, dominantColors] = await Promise.all([
      fileToBase64(ready),
      extractDominantColors(ready),
    ])
    console.log(`[Vision] Cores dominantes detectadas:`, dominantColors)
    const mimeType = ready.type || 'image/jpeg'

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120_000) // 2 min

    console.log(`[Vision] Enviando para Worker (base64: ${Math.round(base64.length / 1024)} KB)...`)
    let response: Response
    try {
      response = await fetch(PROXY_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType, dominantColors }),
    })
    } catch (err) {
      clearTimeout(timeout)
      if (err instanceof Error && err.name === 'AbortError')
        throw new Error('Tempo limite excedido (2 min) — a imagem pode ser grande demais, tente uma menor')
      throw err
    }
    clearTimeout(timeout)

    console.log(`[Vision] Worker respondeu: HTTP ${response.status}`)
    if (!response.ok) {
      let msg = `Erro ${response.status}`
      try { msg = (await response.json()).error?.message ?? msg } catch { /* ignora */ }
      console.error(`[Vision] Erro do Worker:`, msg)
      if (response.status === 503 || msg.toLowerCase().includes('indisponíveis') || msg.toLowerCase().includes('high demand'))
        throw new Error('Todos os serviços de IA estão sobrecarregados no momento — aguarde 1 minuto e tente novamente')
      throw new Error(msg)
    }

    const data  = await response.json()
    const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    console.log(`[Vision] Resposta recebida (${raw.length} chars), parseando JSON...`)
    if (!raw) throw new Error('Resposta vazia do servidor')

    let result: UIAnalysisResult
    try {
      result = parseOrRepairJson<UIAnalysisResult>(raw)
      console.log(`[Vision] JSON parseado com sucesso — ${result.sections?.length ?? 0} seções detectadas`)
    } catch (e) {
      console.error(`[Vision] Falha ao parsear JSON:`, raw.slice(0, 200))
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
