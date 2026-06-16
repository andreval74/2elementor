/**
 * WebKeeper — Cloudflare Worker com cascata automática de 4 providers
 *
 * Variáveis de ambiente (Workers > Settings > Variables and Secrets):
 *   GEMINI_API_KEY      — aistudio.google.com     (gratuito, 1.500 req/dia)     [primário]
 *   OPENROUTER_API_KEY  — openrouter.ai            (gratuito, 200 req/dia)       [fallback 1]
 *   GROQ_API_KEY        — console.groq.com         (gratuito, 1.000 req/dia)     [fallback 2]
 *   GROK_API_KEY        — console.x.ai             ($25 créditos iniciais grátis) [fallback 3]
 *   ALLOWED_ORIGIN      — ex: "https://seusite.com" (padrão: * = qualquer)       [opcional]
 *
 * Providers sem chave configurada são pulados automaticamente.
 * Trigger de fallback: HTTP 503, HTTP 429 (Gemini), body com "overloaded"/"high demand".
 */

// ─── Prompt de refinamento JSON Elementor (rota /refine) ────────────────────

const REFINE_PROMPT = `You are an Elementor JSON expert for WordPress (version 0.4 format).

Analyze the HTML page and the current Elementor JSON. Identify and fix:
- Wrong widget types (headings → heading widget, buttons → button widget, paragraphs → text-editor, images → image, lists → icon-list)
- Missing or incorrect styles (colors, typography, spacing from Tailwind classes)
- Structural issues (incorrect hierarchy, missing containers)
- Preserve ALL original content, sections and visible text

ABSOLUTE RULES:
- Return ONLY raw JSON — no markdown fences, no \`\`\`json, no explanation, no text outside JSON
- Keep "version": "0.4" and "type": "page" unchanged
- Widget "elements" must always be []
- All "id" values must be 8-character lowercase hex strings`

// ─── Gemini text-only refinement (sem imagem) ────────────────────────────────

function stripJsonFences(text) {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

async function refineWithGemini(html, pageJson, apiKey) {
  const userText = `${REFINE_PROMPT}\n\nHTML:\n${html}\n\nCurrent Elementor JSON:\n${pageJson}`

  const body = {
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: { temperature: 0.1, topP: 0.9, maxOutputTokens: 32768 },
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  )

  const data = await res.json()
  if (!res.ok) throw new Error(`Gemini refine ${res.status}: ${data?.error?.message || ''}`)

  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  if (!raw) throw new Error('Gemini retornou resposta vazia para refinamento')
  return stripJsonFences(raw)
}

// ─── Prompts (inglês = melhor performance em todos os modelos) ───────────────

const SYSTEM_PROMPT = `You are an expert UI/UX analyst and senior front-end developer specializing in Elementor Page Builder.

Your task: analyze the screenshot of a web page and return a detailed JSON with structure, design system, and generated code.

ABSOLUTE RULE: Return ONLY valid JSON. No markdown, no \`\`\`json, no explanations, no text outside the JSON.

Before generating the JSON, think step by step (your reasoning is internal, NOT part of the output):
1. How many distinct sections are visible? Name each one.
2. What is the grid/flex layout of each section?
3. What are the EXACT hex colors of the primary elements?
4. What font families, sizes, and weights are used?
Then output ONLY the JSON.

CRITICAL COMPLETENESS RULE:
- If there are 6 cards, generate ALL 6 cards in the JSON.
- If there are 15 menu items, write ALL 15 items.
- NEVER use comments like "// more items here" or "// repeat for other cards".
- NEVER truncate or summarize content. Write EVERY visible text word-for-word.

COLOR PRECISION:
- Extract the EXACT hex value for every element (#3B82F6 ≠ #3B83F6).
- Never use CSS color names like "blue", "red", "white".
- For gradients, specify each stop with exact hex and percentage.

The JSON MUST follow EXACTLY this structure:
{
  "meta": {
    "analyzedAt": "ISO-timestamp",
    "model": "model-name",
    "provider": "provider-name"
  },
  "sections": [
    {
      "type": "header|hero|about|services|features|testimonials|faq|cta|footer|gallery|pricing|team|cases|contact|unknown",
      "label": "Human-readable section name, e.g.: Main Hero",
      "background": {
        "type": "solid|gradient|image|transparent",
        "value": "#HEX or linear-gradient(...) or url(...)"
      },
      "layout": {
        "direction": "row|column",
        "align": "flex-start|center|flex-end|stretch",
        "justify": "flex-start|center|flex-end|space-between|space-around",
        "gap": "e.g.: 24px",
        "columns": 3
      },
      "padding": { "top": "80px", "right": "32px", "bottom": "80px", "left": "32px" },
      "elements": [
        {
          "type": "heading|text|button|image|icon|nav|list|card|divider|badge|logo|input|video|other",
          "tag": "h1|h2|h3|p|a|button|img|div|span|...",
          "content": "Exact visible text",
          "styles": {
            "color": "#HEX exact",
            "backgroundColor": "#HEX exact",
            "fontSize": "48px",
            "fontFamily": "Inter, sans-serif",
            "fontWeight": "700",
            "lineHeight": "1.2",
            "letterSpacing": "0.05em",
            "borderRadius": "12px",
            "border": "1px solid #HEX",
            "padding": "16px 32px",
            "boxShadow": "0 4px 20px rgba(0,0,0,0.3)",
            "textAlign": "center"
          }
        }
      ]
    }
  ],
  "designSystem": {
    "colors": {
      "primary": "#HEX",
      "secondary": "#HEX",
      "accent": "#HEX",
      "background": "#HEX",
      "surface": "#HEX",
      "text": {
        "primary": "#HEX",
        "secondary": "#HEX",
        "muted": "#HEX"
      },
      "border": "#HEX"
    },
    "typography": {
      "fontFamilies": ["Inter", "Roboto"],
      "scale": [
        { "name": "h1", "fontSize": "48px", "fontWeight": "800", "lineHeight": "1.1", "letterSpacing": "-0.02em" },
        { "name": "h2", "fontSize": "36px", "fontWeight": "700", "lineHeight": "1.2" },
        { "name": "h3", "fontSize": "24px", "fontWeight": "600", "lineHeight": "1.3" },
        { "name": "body", "fontSize": "16px", "fontWeight": "400", "lineHeight": "1.6" },
        { "name": "small", "fontSize": "14px", "fontWeight": "400", "lineHeight": "1.5" },
        { "name": "label", "fontSize": "12px", "fontWeight": "600", "lineHeight": "1.4", "letterSpacing": "0.08em", "textTransform": "uppercase" }
      ]
    },
    "spacing": {
      "xs": "4px", "sm": "8px", "md": "16px", "lg": "24px", "xl": "48px", "2xl": "80px"
    },
    "borderRadius": {
      "none": "0", "sm": "4px", "md": "8px", "lg": "12px", "xl": "16px", "2xl": "24px", "full": "9999px"
    },
    "shadows": ["0 1px 3px rgba(0,0,0,0.3)", "0 4px 20px rgba(0,0,0,0.4)"],
    "gradients": ["linear-gradient(135deg, #111 0%, #333 100%)"]
  },
  "code": {
    "html": "Complete semantic HTML starting with the first visible tag (e.g. <header> or <section>). No <html><head><body>. Use class names that match the CSS below.",
    "css": "STARTS with @import for Google Fonts. Then :root with all custom properties. Then * { box-sizing: border-box; } body { margin: 0; }. Then all component styles with :hover states for buttons and links."
  }
}

MANDATORY RULES:
1. Detect ALL visible sections — can be 2 or 15, no fixed limit
2. Colors in EXACT HEX (#RRGGBB) — never color names
3. Include ALL visible text in the image, word by word
4. Spacings estimated in px (based on visual proportions)
5. HTML in code.html must start with the first visible tag (<header> or <section>), no <html><head><body>
6. CSS in code.css MUST start with Google Fonts @import for each detected font family:
   @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Roboto:wght@400;700&display=swap');
   (Replace Inter/Roboto with the actual detected fonts)
7. CSS MUST include after @import: * { box-sizing: border-box; margin: 0; padding: 0; } body { margin: 0; }
8. CSS MUST use CSS custom properties in :root { --color-primary: #HEX; --font-heading: 'Inter'; etc. }
9. For images: use real placeholder URLs in format: https://placehold.co/WIDTHxHEIGHT/BGCOLOR/FGCOLOR?text=Description
   Example: https://placehold.co/1200x600/1a1a2e/ffffff?text=Hero+Background
   Match dimensions and colors to the screenshot as closely as possible.
10. For buttons: include :hover and :active states in CSS
11. For cards/grids: specify number of columns in layout.columns
12. For icons: describe in words (e.g. "arrow-right icon"), do not attempt SVG reproduction
13. The HTML and CSS combined must render a visually accurate standalone page when placed in a browser`

function buildUserPrompt(dominantColors) {
  const colorHint = dominantColors?.length
    ? `\n\nAuto-detected dominant colors extracted directly from the image pixels: ${dominantColors.join(', ')}. Cross-reference these with what you see and use the most accurate values in the JSON.`
    : ''

  return `Analyze this web page screenshot with maximum detail.

Return ONLY the JSON (no markdown, no explanations), following the exact system schema.

Priorities:
- Colors: extract EXACT hex for each element${colorHint}
- Typography: identify fonts, sizes and weights precisely
- Layout: map grid, flexbox, spacing
- Content: copy ALL visible text
- Code: generate functional HTML+CSS that reproduces the visual`
}

// ─── CORS ───────────────────────────────────────────────────────────────────

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

function jsonResponse(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  })
}

// ─── Detecta erros de sobrecarga que devem acionar fallback ─────────────────

function isOverloaded(status, message) {
  if (status === 503) return true
  const lower = (message || '').toLowerCase()
  return lower.includes('overloaded') || lower.includes('high demand') || lower.includes('capacity')
}

// ─── Normaliza qualquer texto para formato Gemini (esperado pelo frontend) ───

function toGeminiFormat(text) {
  return { candidates: [{ content: { parts: [{ text }] } }] }
}

// ─── Provider 1: Gemini 2.5 Flash ───────────────────────────────────────────

async function tryGemini(imageBase64, mimeType, userPrompt, apiKey) {
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: userPrompt },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topP: 0.9,
      maxOutputTokens: 32768,
      responseMimeType: 'application/json',
    },
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  )

  const data = await res.json()

  if (!res.ok) {
    const msg = data?.error?.message || ''
    if (isOverloaded(res.status, msg) || res.status === 429) return null
    throw new Error(`Gemini ${res.status}: ${msg}`)
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null
}

// ─── Provider 2: OpenRouter — múltiplos modelos gratuitos com a mesma chave ──
// Com uma única OPENROUTER_API_KEY temos 3 fallbacks gratuitos em sequência

const OPENROUTER_MODELS = [
  'google/gemma-4-31b-it:free',          // Gemma 4 31B — Google DeepMind, visão nativa
  'meta-llama/llama-4-scout:free',        // Llama 4 Scout — Meta, multimodal nativo
  'mistralai/mistral-small-3.2-24b-instruct:free', // Mistral Small 3.2 — visão via instrução
]

async function tryOneOpenRouterModel(imageBase64, mimeType, userPrompt, apiKey, model) {
  const body = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          { type: 'text', text: userPrompt },
        ],
      },
    ],
    max_tokens: 16384,
    temperature: 0.1,
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://2elementor.web3cafe.workers.dev',
      'X-Title': 'WebKeeper 2Elementor',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    const msg = data?.error?.message || ''
    // 429 ou overload → próximo modelo
    if (isOverloaded(res.status, msg) || res.status === 429) return null
    throw new Error(`OpenRouter/${model.split('/').pop()} ${res.status}: ${msg}`)
  }

  const text = data?.choices?.[0]?.message?.content ?? ''
  return text || null
}

async function tryOpenRouter(imageBase64, mimeType, userPrompt, apiKey) {
  for (const model of OPENROUTER_MODELS) {
    try {
      const text = await tryOneOpenRouterModel(imageBase64, mimeType, userPrompt, apiKey, model)
      if (text) {
        console.log(`[Worker] OpenRouter sucesso: ${model}`)
        return text
      }
      console.log(`[Worker] OpenRouter ${model} → sem resultado, tentando próximo...`)
    } catch (e) {
      console.log(`[Worker] OpenRouter ${model} erro: ${e.message}, tentando próximo...`)
    }
  }
  return null
}

// ─── Provider 3: Groq — Llama 4 Scout (rápido, gratuito) ────────────────────

async function tryGroq(imageBase64, mimeType, userPrompt, apiKey) {
  const body = {
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          { type: 'text', text: userPrompt },
        ],
      },
    ],
    max_tokens: 16384,
    temperature: 0.1,
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    const msg = data?.error?.message || ''
    if (isOverloaded(res.status, msg)) return null
    throw new Error(`Groq ${res.status}: ${msg}`)
  }

  return data?.choices?.[0]?.message?.content ?? null
}

// ─── Provider 4: Grok / xAI ─────────────────────────────────────────────────

async function tryGrok(imageBase64, mimeType, userPrompt, apiKey) {
  const body = {
    model: 'grok-4.3',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          { type: 'text', text: userPrompt },
        ],
      },
    ],
    max_tokens: 16384,
    temperature: 0.1,
  }

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    const msg = data?.error?.message || ''
    if (isOverloaded(res.status, msg)) return null
    throw new Error(`Grok ${res.status}: ${msg}`)
  }

  return data?.choices?.[0]?.message?.content ?? null
}

// ─── Handler principal ───────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const origin  = request.headers.get('Origin') || '*'
    const allowed = env.ALLOWED_ORIGIN || '*'

    if (allowed !== '*' && origin !== allowed) {
      return new Response('Forbidden', { status: 403 })
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    if (!env.GEMINI_API_KEY && !env.OPENROUTER_API_KEY && !env.GROQ_API_KEY && !env.GROK_API_KEY) {
      return jsonResponse(
        { error: { message: 'Worker não configurado: nenhuma chave de API definida' } },
        500, origin,
      )
    }

    let body
    try {
      body = await request.json()
    } catch {
      return jsonResponse({ error: { message: 'Body inválido — esperado JSON' } }, 400, origin)
    }

    const url = new URL(request.url)

    // ─── Rota /refine — refinamento de JSON Elementor via texto (sem imagem) ──
    if (url.pathname === '/refine') {
      const { html, pageJson } = body
      if (!html || !pageJson) {
        return jsonResponse({ error: { message: 'Campos obrigatórios: html, pageJson' } }, 400, origin)
      }
      if (!env.GEMINI_API_KEY) {
        return jsonResponse({ error: { message: 'GEMINI_API_KEY não configurado para refinamento' } }, 503, origin)
      }
      try {
        console.log('[Worker] /refine — enviando para Gemini...')
        const refinedJson = await refineWithGemini(html, pageJson, env.GEMINI_API_KEY)
        console.log(`[Worker] /refine — resposta: ${refinedJson.length} chars`)
        return new Response(JSON.stringify({ refinedJson }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        })
      } catch (e) {
        console.log(`[Worker] /refine falhou: ${e.message}`)
        return jsonResponse({ error: { message: `Erro ao refinar: ${e.message}` } }, 503, origin)
      }
    }

    const { imageBase64, mimeType, dominantColors } = body
    if (!imageBase64 || !mimeType) {
      return jsonResponse({ error: { message: 'Campos obrigatórios: imageBase64, mimeType' } }, 400, origin)
    }

    const userPrompt = buildUserPrompt(dominantColors)
    const imgKB = Math.round(imageBase64.length * 0.75 / 1024)
    console.log(`[Worker] Imagem recebida: ${imgKB} KB, tipo: ${mimeType}`)

    let text = null
    const errors = []

    if (env.GEMINI_API_KEY) {
      console.log('[Worker] Tentando Gemini 2.5 Flash...')
      try { text = await tryGemini(imageBase64, mimeType, userPrompt, env.GEMINI_API_KEY) }
      catch (e) { errors.push(`Gemini: ${e.message}`); console.log(`[Worker] Gemini falhou: ${e.message}`) }
      if (text) console.log('[Worker] Gemini respondeu com sucesso')
    }

    if (!text && env.OPENROUTER_API_KEY) {
      console.log('[Worker] Tentando OpenRouter (3 modelos gratuitos)...')
      try { text = await tryOpenRouter(imageBase64, mimeType, userPrompt, env.OPENROUTER_API_KEY) }
      catch (e) { errors.push(`OpenRouter: ${e.message}`); console.log(`[Worker] OpenRouter falhou: ${e.message}`) }
    }

    if (!text && env.GROQ_API_KEY) {
      console.log('[Worker] Tentando Groq Llama 4 Scout...')
      try { text = await tryGroq(imageBase64, mimeType, userPrompt, env.GROQ_API_KEY) }
      catch (e) { errors.push(`Groq: ${e.message}`); console.log(`[Worker] Groq falhou: ${e.message}`) }
      if (text) console.log('[Worker] Groq respondeu com sucesso')
    }

    if (!text && env.GROK_API_KEY) {
      console.log('[Worker] Tentando Grok 4.3 (xAI)...')
      try { text = await tryGrok(imageBase64, mimeType, userPrompt, env.GROK_API_KEY) }
      catch (e) { errors.push(`Grok: ${e.message}`); console.log(`[Worker] Grok falhou: ${e.message}`) }
      if (text) console.log('[Worker] Grok respondeu com sucesso')
    }

    if (!text) {
      const detail = errors.length ? ` Detalhes: ${errors.join(' | ')}` : ''
      console.log(`[Worker] Todos os providers falharam.${detail}`)
      return jsonResponse(
        { error: { message: `Todos os serviços de IA falharam.${detail}` } },
        503, origin,
      )
    }
    console.log(`[Worker] Resposta final: ${text.length} chars`)

    return new Response(JSON.stringify(toGeminiFormat(text)), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    })
  },
}