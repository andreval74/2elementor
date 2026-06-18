// ─── SECTION DETECTOR ────────────────────────────────────────────────────────
// Detecta e classifica seções a partir da árvore LayoutNode[]
// [TECH DECISION]: heurísticas baseadas em tags semânticas + conteúdo + posição
// [TECH DECISION]: labels compostos "{ShortType} — {ContentTitle}" gerados a
//   partir do conteúdo real (H1 → H2 → heading → botão/link → parágrafo)
//   para que o usuário reconheça imediatamente qual seção está exportando.

import { generateId } from '@/utils/generateId'
import { SECTION_LABELS, SECTION_SHORT_LABELS, SECTION_OUTPUT_FILES } from '@/utils/constants'
import type { LayoutNode, Section, SectionName } from '@/types/layout.types'

// ─── HELPERS DE NÓ ───────────────────────────────────────────────────────────

function hasTag(node: LayoutNode, tags: string[]): boolean {
  return tags.includes(node.tag.toLowerCase())
}

function hasClass(node: LayoutNode, keywords: string[]): boolean {
  const cls = (node.attributes.class ?? '').toLowerCase()
  return keywords.some(kw => cls.includes(kw))
}

function containsTag(node: LayoutNode, tag: string): boolean {
  if (node.tag.toLowerCase() === tag) return true
  return node.children.some(child => containsTag(child, tag))
}

function textMatches(node: LayoutNode, keywords: string[]): boolean {
  const text = (node.textContent ?? '').toLowerCase()
  const cls = (node.attributes.class ?? '').toLowerCase()
  return keywords.some(kw => text.includes(kw) || cls.includes(kw))
}

function countDirectChildren(node: LayoutNode): number {
  return node.children.length
}

// ─── EXTRAÇÃO DE TÍTULO A PARTIR DO CONTEÚDO ─────────────────────────────────

/**
 * Encontra o primeiro nó da árvore com a tag especificada (DFS) e retorna
 * seu textContent limpo. Exportado para reuso em testes.
 * @param node - Raiz da subárvore
 * @param tag - Tag HTML a procurar (ex: "h1", "p")
 */
export function findFirstNodeByTag(node: LayoutNode, tag: string): string | null {
  if (node.tag.toLowerCase() === tag) {
    const text = (node.textContent ?? '').trim()
    if (text.length > 0) return text
  }
  for (const child of node.children) {
    const result = findFirstNodeByTag(child, tag)
    if (result) return result
  }
  return null
}

/**
 * Remove espaços extras e trunca o texto com "…" se ultrapassar max chars.
 * Exportado para reuso em testes.
 */
export function truncateText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? clean.slice(0, max - 1) + '…' : clean
}

/**
 * Extrai o título mais representativo de uma seção a partir do seu conteúdo.
 * Prioridade: H1 → H2 → H3-H6 → botão/link curto → parágrafo → null.
 * @param node - Nó raiz da seção
 * @returns Texto truncado (máx 45 chars) ou null se nada relevante for encontrado
 */
export function extractContentTitle(node: LayoutNode): string | null {
  const MAX = 45

  // H1 — maior prioridade
  const h1 = findFirstNodeByTag(node, 'h1')
  if (h1) return truncateText(h1, MAX)

  // H2
  const h2 = findFirstNodeByTag(node, 'h2')
  if (h2) return truncateText(h2, MAX)

  // H3 a H6
  for (const tag of ['h3', 'h4', 'h5', 'h6']) {
    const h = findFirstNodeByTag(node, tag)
    if (h) return truncateText(h, MAX)
  }

  // Botão principal — só aceita se for curto o suficiente para ser um CTA
  const btn = findFirstNodeByTag(node, 'button')
  if (btn && btn.length <= 30) return truncateText(btn, MAX)

  // Link curto (âncora com texto de ação)
  const a = findFirstNodeByTag(node, 'a')
  if (a && a.length > 3 && a.length <= 30) return truncateText(a, MAX)

  // Primeiro parágrafo com conteúdo significativo
  const p = findFirstNodeByTag(node, 'p')
  if (p && p.length > 5) return truncateText(p, MAX)

  return null
}

// ─── HEURÍSTICAS POR TIPO ────────────────────────────────────────────────────

function scoreHeader(node: LayoutNode): number {
  let score = 0
  if (hasTag(node, ['header', 'nav'])) score += 0.7
  if (hasClass(node, ['header', 'navbar', 'nav', 'navigation', 'topbar', 'menu'])) score += 0.4
  if (containsTag(node, 'nav')) score += 0.3
  if (containsTag(node, 'a') && (containsTag(node, 'img') || containsTag(node, 'svg'))) score += 0.2
  return Math.min(score, 1)
}

function scoreHero(node: LayoutNode, index: number): number {
  let score = 0
  if (index <= 1) score += 0.2
  if (containsTag(node, 'h1')) score += 0.5
  if (hasClass(node, ['hero', 'banner', 'jumbotron', 'masthead'])) score += 0.4
  if (containsTag(node, 'button') || containsTag(node, 'a')) score += 0.15
  return Math.min(score, 1)
}

function scoreServices(node: LayoutNode): number {
  let score = 0
  if (hasClass(node, ['services', 'solutions', 'features', 'cards', 'grid'])) score += 0.5
  if (textMatches(node, ['serviç', 'soluç', 'feature', 'como', 'oferec'])) score += 0.3
  if (countDirectChildren(node) >= 3) score += 0.2
  return Math.min(score, 1)
}

function scoreCases(node: LayoutNode): number {
  let score = 0
  if (hasClass(node, ['cases', 'portfolio', 'projects', 'work', 'resultados'])) score += 0.5
  if (textMatches(node, ['case', 'portfólio', 'projeto', 'result', 'client'])) score += 0.3
  return Math.min(score, 1)
}

function scoreFaq(node: LayoutNode): number {
  let score = 0
  if (containsTag(node, 'details') || containsTag(node, 'summary')) score += 0.6
  if (hasClass(node, ['faq', 'accordion', 'perguntas'])) score += 0.4
  if (textMatches(node, ['faq', 'perguntas', 'dúvidas', 'frequente'])) score += 0.3
  return Math.min(score, 1)
}

function scoreCta(node: LayoutNode): number {
  let score = 0
  if (hasClass(node, ['cta', 'call-to-action', 'contact', 'contato'])) score += 0.5
  if (textMatches(node, ['fale conosco', 'entre em contato', 'agende', 'whatsapp'])) score += 0.3
  if (containsTag(node, 'button') && countDirectChildren(node) <= 3) score += 0.2
  return Math.min(score, 1)
}

function scoreAbout(node: LayoutNode): number {
  let score = 0
  if (hasClass(node, ['about', 'sobre', 'bio', 'team', 'equipe'])) score += 0.5
  if (textMatches(node, ['sobre', 'quem somos', 'nossa história', 'equipe'])) score += 0.3
  return Math.min(score, 1)
}

function scoreFooter(node: LayoutNode, index: number, total: number): number {
  let score = 0
  if (hasTag(node, ['footer'])) score += 0.8
  if (hasClass(node, ['footer', 'rodapé'])) score += 0.4
  if (index === total - 1) score += 0.2
  if (textMatches(node, ['copyright', '©', 'todos os direitos'])) score += 0.3
  return Math.min(score, 1)
}

function detectSectionName(node: LayoutNode, index: number, total: number): { name: SectionName; confidence: number } {
  const scores: Array<{ name: SectionName; score: number }> = [
    { name: 'header', score: scoreHeader(node) },
    { name: 'hero', score: scoreHero(node, index) },
    { name: 'services', score: scoreServices(node) },
    { name: 'cases', score: scoreCases(node) },
    { name: 'faq', score: scoreFaq(node) },
    { name: 'cta', score: scoreCta(node) },
    { name: 'about', score: scoreAbout(node) },
    { name: 'footer', score: scoreFooter(node, index, total) },
  ]
  scores.sort((a, b) => b.score - a.score)
  const best = scores[0]
  // Se nenhuma heurística disparou, classificar como services (genérico)
  if (best.score < 0.15) return { name: 'services', confidence: 0.3 }
  return { name: best.name, confidence: Math.round(best.score * 100) / 100 }
}

// ─── CONSTRUÇÃO DO LABEL INTELIGENTE ─────────────────────────────────────────

/**
 * Constrói o label final da seção.
 * Se contentTitle existe: "{ShortPrefix} — {ContentTitle}"
 * Caso contrário: label completo do tipo (ex: "Cabeçalho / Nav")
 */
function buildLabel(name: SectionName, contentTitle: string | null): string {
  if (!contentTitle) return SECTION_LABELS[name] ?? name
  const prefix = SECTION_SHORT_LABELS[name] ?? SECTION_LABELS[name] ?? name
  return `${prefix} — ${contentTitle}`
}

// ─── DETECÇÃO PRINCIPAL ───────────────────────────────────────────────────────

/**
 * Classifica um array de LayoutNode em seções nomeadas com score de confiança.
 * Labels são gerados a partir do conteúdo real da seção (H1 → H2 → heading →
 * botão → parágrafo) para que o usuário reconheça imediatamente o que está
 * exportando — nunca usando nomes técnicos como "Header #3" ou "Services #2".
 * Seções do mesmo tipo recebem numeração automática nos arquivos de saída
 * (header-2.json, header-3.json) mas o label reflete sempre o conteúdo.
 * @param nodes - Árvore de LayoutNode[] da página
 * @returns Array de Section com nome, label inteligente, confiança e arquivo de saída
 */
export function detectSections(nodes: LayoutNode[]): Section[] {
  const raw = nodes.map((node, index) => {
    const { name, confidence } = detectSectionName(node, index, nodes.length)
    const contentTitle = extractContentTitle(node)
    return {
      id: generateId(),
      name,
      label: buildLabel(name, contentTitle),
      contentTitle: contentTitle ?? undefined,
      confidence,
      nodes: [node],
      outputFile: SECTION_OUTPUT_FILES[name] ?? `${name}.json`,
    }
  })

  // Contar quantas vezes cada tipo aparece
  const counts: Record<string, number> = {}
  for (const s of raw) counts[s.name] = (counts[s.name] ?? 0) + 1

  // Primeira ocorrência de cada tipo mantém nome e arquivo originais.
  // A partir da segunda: arquivo numerado (header-2.json), label já é
  // baseado em conteúdo e permanece distinto naturalmente.
  const seen: Record<string, number> = {}
  return raw.map(s => {
    if (counts[s.name] <= 1) return s          // único do tipo — sem alteração
    seen[s.name] = (seen[s.name] ?? 0) + 1
    const n = seen[s.name]
    if (n === 1) return s                       // primeira ocorrência: nome e arquivo originais
    const baseName = (SECTION_OUTPUT_FILES[s.name] ?? `${s.name}.json`).replace('.json', '')
    return {
      ...s,
      outputFile: `${baseName}-${n}.json`,
    }
  })
}
