import { describe, it, expect } from 'vitest'
import { resolveTokens, previewWhatsappLink } from '@/services/token-resolver'
import { DEFAULT_TOKENS } from '@/types/app.types'
import type { TokenMap } from '@/types/app.types'

const tokens: TokenMap = {
  ...DEFAULT_TOKENS,
  WHATSAPP_NUMBER: '5511999999999',
  WHATSAPP_MSG: 'Olá, quero saber mais!',
  EMAIL_CONTATO: 'contato@webkeeper.com.br',
  NOME_EMPRESA: 'WebKeeper',
  TELEFONE: '(11) 99999-9999',
  SITE_URL: 'https://webkeeper.com.br',
  INSTAGRAM_URL: 'https://instagram.com/webkeeper',
  LINKEDIN_URL: 'https://linkedin.com/company/webkeeper',
  FACEBOOK_URL: 'https://facebook.com/webkeeper',
}

describe('token-resolver — resolveTokens()', () => {
  it('substitui {{NOME_EMPRESA}} corretamente', () => {
    const result = resolveTokens('Bem-vindo à {{NOME_EMPRESA}}!', tokens)
    expect(result).toBe('Bem-vindo à WebKeeper!')
  })

  it('substitui {{EMAIL_CONTATO}} corretamente', () => {
    const result = resolveTokens('Email: {{EMAIL_CONTATO}}', tokens)
    expect(result).toBe('Email: contato@webkeeper.com.br')
  })

  it('substitui {{WHATSAPP_LINK}} com URL wa.me válida', () => {
    const result = resolveTokens('Clique aqui: {{WHATSAPP_LINK}}', tokens)
    expect(result).toContain('wa.me/5511999999999')
    expect(result).not.toContain('{{WHATSAPP_LINK}}')
  })

  it('resolve múltiplos tokens no mesmo HTML', () => {
    const html = '<a href="{{WHATSAPP_LINK}}">{{NOME_EMPRESA}} — {{EMAIL_CONTATO}}</a>'
    const result = resolveTokens(html, tokens)
    expect(result).not.toContain('{{')
    expect(result).toContain('WebKeeper')
    expect(result).toContain('contato@webkeeper.com.br')
  })

  it('SAFETY: token cujo valor contém $& não causa substituição recursiva', () => {
    const dangerousTokens: TokenMap = {
      ...tokens,
      NOME_EMPRESA: 'Empresa $& Corp',
    }
    const result = resolveTokens('Nome: {{NOME_EMPRESA}}', dangerousTokens)
    expect(result).toBe('Nome: Empresa $& Corp')
    expect(result).not.toContain('{{NOME_EMPRESA}}')
  })

  it('SAFETY: token cujo valor contém $1 não causa substituição regex', () => {
    const dangerousTokens: TokenMap = {
      ...tokens,
      NOME_EMPRESA: 'Empresa $1 Ltda',
    }
    const result = resolveTokens('Empresa: {{NOME_EMPRESA}}', dangerousTokens)
    expect(result).toBe('Empresa: Empresa $1 Ltda')
  })

  it('retorna string original se html vazio ou null-ish', () => {
    expect(resolveTokens('', tokens)).toBe('')
  })
})

describe('token-resolver — previewWhatsappLink()', () => {
  it('gera link wa.me com número limpo e mensagem codificada', () => {
    const link = previewWhatsappLink('(11) 9 9999-9999', 'Olá!')
    expect(link).toContain('wa.me/11999999999')
    expect(link).toContain(encodeURIComponent('Olá!'))
  })

  it('retorna # para número vazio', () => {
    expect(previewWhatsappLink('', 'msg')).toBe('#')
  })
})
