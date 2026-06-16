const PROXY_URL = import.meta.env.VITE_PROXY_URL ?? ''

export async function refinePageJson(rawHtml: string, currentPageJson: string): Promise<string> {
  if (!PROXY_URL) throw new Error('VITE_PROXY_URL não configurado')

  const res = await fetch(`${PROXY_URL}/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html: rawHtml, pageJson: currentPageJson }),
    signal: AbortSignal.timeout(120_000),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: { message?: string } }).error?.message ?? `Erro ${res.status}`)
  }

  const data = await res.json() as { refinedJson?: string }
  if (!data.refinedJson) throw new Error('Resposta inválida do servidor')

  JSON.parse(data.refinedJson) // valida JSON antes de aceitar
  return data.refinedJson
}
