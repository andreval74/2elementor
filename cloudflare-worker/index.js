/**
 * WebKeeper — Cloudflare Worker Proxy para Gemini Vision API
 *
 * Variáveis de ambiente obrigatórias (configurar em Workers > Settings > Variables):
 *   GEMINI_API_KEY  — sua chave do Google AI Studio (nunca exposta ao usuário)
 *
 * Variável opcional:
 *   ALLOWED_ORIGIN  — domínio autorizado, ex: "https://seusite.com" (padrão: * = qualquer)
 */

const GEMINI_MODEL   = 'gemini-2.5-flash'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '*'
    const allowed = env.ALLOWED_ORIGIN || '*'

    // Bloqueia origens não autorizadas (quando ALLOWED_ORIGIN está definido)
    if (allowed !== '*' && origin !== allowed) {
      return new Response('Forbidden', { status: 403 })
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: { message: 'Worker não configurado: GEMINI_API_KEY ausente' } }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } },
      )
    }

    // Recebe o body enviado pelo frontend (mesmo formato da Gemini API, sem a key)
    let body
    try {
      body = await request.json()
    } catch {
      return new Response(
        JSON.stringify({ error: { message: 'Body inválido — esperado JSON' } }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } },
      )
    }

    // Encaminha para a Gemini API adicionando a chave
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await geminiRes.json()

    return new Response(JSON.stringify(data), {
      status: geminiRes.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    })
  },
}
