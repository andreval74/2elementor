import { useState, useCallback } from 'react'
import { DEFAULT_TOKENS } from '@/types/app.types'
import { resolveTokens, previewWhatsappLink } from '@/services/token-resolver'
import type { TokenMap } from '@/types/app.types'

export interface UseTokensReturn {
  tokens: TokenMap
  setToken: (key: keyof TokenMap, value: string) => void
  resetTokens: () => void
  resolveHtml: (html: string) => string
  whatsappPreview: string
}

/**
 * Gerencia o estado dos tokens dinâmicos e expõe resolução em tempo real.
 */
export function useTokens(): UseTokensReturn {
  const [tokens, setTokens] = useState<TokenMap>(DEFAULT_TOKENS)

  const setToken = useCallback((key: keyof TokenMap, value: string) => {
    setTokens(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetTokens = useCallback(() => setTokens(DEFAULT_TOKENS), [])

  const resolveHtml = useCallback(
    (html: string) => resolveTokens(html, tokens),
    [tokens]
  )

  const whatsappPreview = previewWhatsappLink(tokens.WHATSAPP_NUMBER, tokens.WHATSAPP_MSG)

  return { tokens, setToken, resetTokens, resolveHtml, whatsappPreview }
}
