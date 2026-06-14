/**
 * Tenta parsear JSON. Se falhar por truncamento, fecha os brackets abertos
 * e tenta novamente com a estrutura completa até o último objeto válido.
 */
export function parseOrRepairJson<T = unknown>(raw: string): T {
  // Remove markdown fences
  const cleaned = raw
    .replace(/^```(?:json)?\r?\n?/i, '')
    .replace(/\r?\n?```$/i, '')
    .trim()

  // Tentativa direta
  try {
    return JSON.parse(cleaned) as T
  } catch { /* segue para reparo */ }

  // Reparo: fecha brackets/braces abertos
  const repaired = closeBrackets(cleaned)
  try {
    return JSON.parse(repaired) as T
  } catch {
    // Extrai apenas o objeto raiz mais longo que seja parseable
    const fallback = extractLongestValid(cleaned)
    if (fallback !== null) return fallback as T
    throw new Error(`JSON inválido mesmo após reparo: ${cleaned.slice(0, 300)}`)
  }
}

function closeBrackets(s: string): string {
  const stack: string[] = []
  let inString = false
  let escape = false

  for (const ch of s) {
    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') stack.push('}')
    else if (ch === '[') stack.push(']')
    else if (ch === '}' || ch === ']') stack.pop()
  }

  // Se terminou no meio de uma string, fecha as aspas
  if (inString) s += '"'

  // Remove vírgulas finais antes de fechar (evita trailing comma)
  let result = s.trimEnd().replace(/,\s*$/, '')

  // Fecha em ordem inversa
  while (stack.length) result += stack.pop()!

  return result
}

function extractLongestValid(s: string): unknown {
  // Tenta encontrar o fim do último objeto/array completo de nível 0
  let depth = 0
  let inString = false
  let escape = false
  let lastEnd = -1

  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{' || ch === '[') depth++
    else if ((ch === '}' || ch === ']') && depth > 0) {
      depth--
      if (depth === 0) lastEnd = i
    }
  }

  if (lastEnd > 0) {
    try { return JSON.parse(s.slice(0, lastEnd + 1)) } catch { /* não funciona */ }
  }
  return null
}
