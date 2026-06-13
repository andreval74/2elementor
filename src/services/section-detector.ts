// ─── SECTION DETECTOR ────────────────────────────────────────────────────────
// Detecta e classifica seções a partir da árvore LayoutNode[]
// [TECH DECISION]: heurísticas baseadas em tags semânticas + conteúdo + posição

import { generateId } from '@/utils/generateId'
import { SECTION_LABELS, SECTION_OUTPUT_FILES } from '@/utils/constants'
import type { LayoutNode, Section, SectionName } from '@/types/layout.types'

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

/**
 * Classifica um array de LayoutNode em seções nomeadas com score de confiança.
 * @param nodes - Árvore de LayoutNode[] da página
 * @returns Array de Section com nome, label, confiança e arquivo de saída
 */
export function detectSections(nodes: LayoutNode[]): Section[] {
  return nodes.map((node, index) => {
    const { name, confidence } = detectSectionName(node, index, nodes.length)
    return {
      id: generateId(),
      name,
      label: SECTION_LABELS[name] ?? name,
      confidence,
      nodes: [node],
      outputFile: SECTION_OUTPUT_FILES[name] ?? `${name}.json`,
    }
  })
}
