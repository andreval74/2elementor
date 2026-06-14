// ─── TOKEN RESOLVER ──────────────────────────────────────────────────────────
// Substitui tokens {{...}} no HTML pelos valores configurados pelo usuário
// [MAINTENANCE: tokens]: adicionar novos tokens dinâmicos aqui

import type { TokenMap } from '@/types/app.types'
import type { LayoutNode } from '@/types/layout.types'

function buildWhatsappLink(number: string, message: string): string {
  if (!number) return '#'
  const cleaned = number.replace(/\D/g, '')
  const encoded = encodeURIComponent(message || '')
  return `https://wa.me/${cleaned}?text=${encoded}`
}

function buildTelLink(phone: string): string {
  if (!phone) return '#'
  return `tel:${phone.replace(/\s/g, '')}`
}

function buildTokenMap(tokens: TokenMap): Record<string, string> {
  return {
    '{{WHATSAPP_LINK}}': buildWhatsappLink(tokens.WHATSAPP_NUMBER, tokens.WHATSAPP_MSG),
    '{{WHATSAPP_NUMBER}}': tokens.WHATSAPP_NUMBER,
    '{{EMAIL_CONTATO}}': tokens.EMAIL_CONTATO || '{{EMAIL_CONTATO}}',
    '{{INSTAGRAM_URL}}': tokens.INSTAGRAM_URL || '#',
    '{{LINKEDIN_URL}}': tokens.LINKEDIN_URL || '#',
    '{{FACEBOOK_URL}}': tokens.FACEBOOK_URL || '#',
    '{{NOME_EMPRESA}}': tokens.NOME_EMPRESA || '{{NOME_EMPRESA}}',
    '{{TELEFONE}}': buildTelLink(tokens.TELEFONE),
    '{{SITE_URL}}': tokens.SITE_URL || '#',
  }
}

/**
 * Substitui todos os tokens {{...}} no HTML pelos valores do TokenMap.
 * @param html - HTML com tokens para substituição
 * @param tokens - Mapa de configurações do usuário
 * @returns HTML com tokens resolvidos
 */
export function resolveTokens(html: string, tokens: TokenMap): string {
  if (!html) return html
  const map = buildTokenMap(tokens)
  return Object.entries(map).reduce((acc, [token, value]) => {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Usar função callback evita que $& $1 etc. no valor sejam interpretados como padrão de regex
    return acc.replace(new RegExp(escaped, 'g'), () => value)
  }, html)
}

/**
 * Retorna o link WhatsApp gerado a partir do número e mensagem configurados.
 * Usado para preview em tempo real no ConfigDashboard.
 */
export function previewWhatsappLink(number: string, message: string): string {
  return buildWhatsappLink(number, message)
}

/**
 * Resolve tokens em toda a árvore de LayoutNode recursivamente.
 * Necessário com o mapper nativo que acessa nós filhos diretamente
 * (textContent, rawHtml e attributes de todos os níveis da árvore).
 */
export function resolveNodeTree(node: LayoutNode, tokens: TokenMap): LayoutNode {
  const map = buildTokenMap(tokens)
  function resolveStr(s: string): string {
    return Object.entries(map).reduce((acc, [token, value]) => {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return acc.replace(new RegExp(escaped, 'g'), () => value)
    }, s)
  }
  function walkNode(n: LayoutNode): LayoutNode {
    return {
      ...n,
      textContent: n.textContent ? resolveStr(n.textContent) : n.textContent,
      rawHtml: n.rawHtml ? resolveStr(n.rawHtml) : n.rawHtml,
      attributes: Object.fromEntries(
        Object.entries(n.attributes).map(([k, v]) => [k, resolveStr(v)]),
      ),
      children: n.children.map(walkNode),
    }
  }
  return walkNode(node)
}
