const PROXY_URL = import.meta.env.VITE_PROXY_URL ?? ''
const MAX_CHARS = 10_000

const truncate = (s: string): string =>
  s.length > MAX_CHARS ? s.slice(0, MAX_CHARS) + '\n...[truncado]' : s

function prepareHtmlForRefine(rawHtml: string): string {
  const cleanedHtml = rawHtml
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')

  return truncate(cleanedHtml)
}

function preparePageJsonForRefine(currentPageJson: string): string {
  try {
    const parsed = JSON.parse(currentPageJson) as { page_settings?: Record<string, unknown> }

    if (parsed.page_settings && typeof parsed.page_settings === 'object' && 'custom_css' in parsed.page_settings) {
      parsed.page_settings.custom_css = '[omitido no refine]'
    }

    return truncate(JSON.stringify(parsed))
  } catch {
    return truncate(currentPageJson)
  }
}

export async function refinePageJson(
  rawHtml: string,
  currentPageJson: string,
  violations?: string[],
): Promise<string> {
  if (!PROXY_URL) {
    const msg = 'VITE_PROXY_URL não configurado'
    console.error('[Re-fazer]', msg)
    throw new Error(msg)
  }

  const html = prepareHtmlForRefine(rawHtml)
  const pageJson = preparePageJsonForRefine(currentPageJson)

  const hasViolations = violations && violations.length > 0
  console.log(
    `[Re-fazer] Enviando para Worker: html=${html.length}chars, json=${pageJson.length}chars` +
    (hasViolations ? `, violations=${violations.length}` : ''),
  )

  const controller = new AbortController()
  let didTimeout   = false
  const startedAt  = Date.now()
  const timeoutId  = setTimeout(() => { didTimeout = true; controller.abort() }, 45_000)

  try {
    const res = await fetch(`${PROXY_URL}/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html,
        pageJson,
        ...(hasViolations ? { violations: violations.join('\n') } : {}),
      }),
      signal: controller.signal,
    })

    console.log(`[Re-fazer] Worker respondeu: HTTP ${res.status} (${Date.now() - startedAt}ms)`)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const msg = (data as { error?: { message?: string } }).error?.message ?? `Erro HTTP ${res.status}`
      console.error('[Re-fazer] Erro do Worker:', msg, data)
      throw new Error(msg)
    }

    const data = await res.json() as { refinedJson?: string }

    if (!data.refinedJson) {
      console.error('[Re-fazer] Resposta sem refinedJson:', data)
      throw new Error('Resposta inválida do servidor (sem refinedJson)')
    }

    try {
      JSON.parse(data.refinedJson)
    } catch {
      console.error('[Re-fazer] JSON retornado é inválido:', data.refinedJson.slice(0, 300))
      throw new Error('A IA retornou JSON inválido. Tente novamente.')
    }

    console.log(`[Re-fazer] Refinamento concluído (${Date.now() - startedAt}ms)`)
    return data.refinedJson
  } catch (err) {
    const isAbort = didTimeout
      || (err instanceof Error && err.name === 'AbortError')
      || (err instanceof DOMException && err.name === 'AbortError')

    if (isAbort) {
      const msg = 'Refinamento expirou (45s). Tente novamente — se persistir, exporte o JSON atual.'
      console.error('[Re-fazer] Timeout:', msg)
      throw new Error(msg)
    }
    console.error('[Re-fazer] Erro final:', err)
    throw err instanceof Error ? err : new Error(String(err))
  } finally {
    clearTimeout(timeoutId)
  }
}
