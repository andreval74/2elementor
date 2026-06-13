// ─── SYNTAX HIGHLIGHT ────────────────────────────────────────────────────────
// Tokeniza JSON string em HTML com classes CSS para colorização

type TokenClass = 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation'

interface HighlightToken {
  value: string
  cls: TokenClass | null
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Tokeniza uma string JSON e retorna HTML com spans coloridos.
 * Keys → roxo · Strings → verde · Números → laranja · Bool/null → azul
 */
export function syntaxHighlight(json: string): string {
  const tokens = tokenize(json)
  return tokens
    .map(({ value, cls }) =>
      cls ? `<span class="jsh-${cls}">${escapeHtml(value)}</span>` : escapeHtml(value)
    )
    .join('')
}

function tokenize(json: string): HighlightToken[] {
  const result: HighlightToken[] = []
  // Regex captura: strings, números, booleans, null, pontuação
  const re = /("(?:[^"\\]|\\.)*")\s*:?|("(?:[^"\\]|\\.)*")|(true|false|null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],:])/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(json)) !== null) {
    if (match.index > lastIndex) {
      result.push({ value: json.slice(lastIndex, match.index), cls: null })
    }

    const full = match[0]
    const isKey = full.endsWith(':') || json[match.index + full.trimEnd().length] === ':'

    if (match[1]) {
      result.push({ value: match[1].replace(/:$/, ''), cls: isKey ? 'key' : 'string' })
      if (full.endsWith(':')) result.push({ value: ':', cls: 'punctuation' })
    } else if (match[2]) {
      result.push({ value: match[2], cls: 'string' })
    } else if (match[3]) {
      result.push({ value: match[3], cls: match[3] === 'null' ? 'null' : 'boolean' })
    } else if (match[4]) {
      result.push({ value: match[4], cls: 'number' })
    } else if (match[5]) {
      result.push({ value: match[5], cls: 'punctuation' })
    }

    lastIndex = re.lastIndex
  }

  if (lastIndex < json.length) {
    result.push({ value: json.slice(lastIndex), cls: null })
  }

  return result
}
