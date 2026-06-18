// ─── VISUAL VALIDATOR ────────────────────────────────────────────────────────
// Validação visual estrutural sem dependência de browser.
// Em EDIT/REFINE compara proporções entre original e evoluído (cores, tipografia,
// layout, media). Em CREATE executa self-audit do template gerado.
// [MAINTENANCE: visual-validator] — adicionar novos checks de visual aqui

import { createSnapshotFromElementor } from '@/services/page-snapshot'
import type { ElementorTemplate } from '@/types/elementor.types'
import type { PageSnapshot } from '@/types/snapshot.types'
import type { GenerationMode, VisualValidationResult } from '@/types/validation.types'

// ─── HELPERS PRIVADOS ────────────────────────────────────────────────────────

function extractColorSet(snapshot: PageSnapshot): Set<string> {
  const colors = new Set<string>()
  for (const section of snapshot.sections) {
    if (section.backgroundColor) colors.add(section.backgroundColor.toLowerCase())
  }
  return colors
}

function extractFontSet(snapshot: PageSnapshot): Set<string> {
  const fonts = new Set<string>()
  for (const f of snapshot.designTokens.fontFamilies) {
    fonts.add(f.toLowerCase())
  }
  return fonts
}

function extractImageUrls(snapshot: PageSnapshot): string[] {
  const urls: string[] = []
  for (const section of snapshot.sections) {
    for (const widget of section.widgets) {
      if (widget.widgetType === 'image') {
        const img = widget.settings.image as { url?: string } | undefined
        if (img?.url) urls.push(img.url)
      }
    }
  }
  return urls
}

/** Calcula % de sobreposição entre dois Sets. Retorna 100 se original vazio. */
function setOverlapScore(original: Set<string>, evolved: Set<string>): number {
  if (original.size === 0) return 100
  let matched = 0
  for (const v of original) {
    if (evolved.has(v)) matched++
  }
  return Math.round((matched / original.size) * 100)
}

/** Calcula % de sobreposição entre dois arrays. Retorna 100 se original vazio. */
function arrOverlapScore(original: string[], evolved: string[]): number {
  if (original.length === 0) return 100
  const evolvedSet = new Set(evolved)
  const matched = original.filter(v => evolvedSet.has(v)).length
  return Math.round((matched / original.length) * 100)
}

// ─── CREATE MODE: SELF-AUDIT ─────────────────────────────────────────────────

/**
 * Sem original para comparar, verifica se o template gerado tem
 * conteúdo mínimo esperado: pelo menos um heading e uma seção com widgets.
 */
function selfAudit(template: ElementorTemplate): VisualValidationResult {
  const issues: string[] = []
  const snapshot = createSnapshotFromElementor(template)

  const hasHeading = snapshot.sections.some(s => s.widgets.some(w => w.widgetType === 'heading'))
  const hasContent = snapshot.totalWidgetCount > 0
  const sectionCount = snapshot.sectionCount

  if (sectionCount === 0) issues.push('Nenhuma seção gerada — o template pode estar vazio')
  if (!hasContent) issues.push('Nenhum widget detectado — possível problema de mapeamento')
  if (!hasHeading) issues.push('Nenhum widget heading detectado na página gerada')

  const contentScore = !hasContent ? 0 : !hasHeading ? 70 : 100
  const layoutScore = sectionCount === 0 ? 0 : Math.min(100, sectionCount * 20)
  const score = Math.round((contentScore * 0.6) + (layoutScore * 0.4))

  return {
    passed: issues.length === 0,
    score,
    colorScore: 100,
    typographyScore: 100,
    layoutScore,
    mediaScore: 100,
    issues,
    mode: 'create',
  }
}

// ─── EDIT / REFINE MODE: COMPARAÇÃO ─────────────────────────────────────────

/**
 * Compara snapshots original vs evoluído nas 4 dimensões visuais:
 * cores de fundo, tipografia, proporção de layout e preservação de media.
 */
function compareTemplates(
  origSnapshot: PageSnapshot,
  evolvedSnapshot: PageSnapshot,
  mode: GenerationMode,
): VisualValidationResult {
  const issues: string[] = []

  // Cores de fundo das seções
  const colorScore = setOverlapScore(
    extractColorSet(origSnapshot),
    extractColorSet(evolvedSnapshot),
  )
  if (colorScore < 80) {
    issues.push(`Cores de fundo das seções: ${colorScore}% de correspondência (esperado ≥ 80%)`)
  }

  // Famílias tipográficas
  const typographyScore = setOverlapScore(
    extractFontSet(origSnapshot),
    extractFontSet(evolvedSnapshot),
  )
  if (typographyScore < 80) {
    issues.push(`Famílias tipográficas: ${typographyScore}% de correspondência`)
  }

  // Layout: razão de seções + razão de widgets (média)
  const sectionRatio = origSnapshot.sectionCount === 0
    ? 100
    : Math.round((evolvedSnapshot.sectionCount / origSnapshot.sectionCount) * 100)
  const widgetRatio = origSnapshot.totalWidgetCount === 0
    ? 100
    : Math.round((evolvedSnapshot.totalWidgetCount / origSnapshot.totalWidgetCount) * 100)
  const layoutScore = Math.round((Math.min(sectionRatio, 100) + Math.min(widgetRatio, 100)) / 2)
  if (layoutScore < 70) {
    issues.push(`Layout: seções ${sectionRatio}%, widgets ${widgetRatio}% do original`)
  }

  // URLs de imagem preservadas
  const mediaScore = arrOverlapScore(
    extractImageUrls(origSnapshot),
    extractImageUrls(evolvedSnapshot),
  )
  if (mediaScore < 80 && extractImageUrls(origSnapshot).length > 0) {
    issues.push(`URLs de imagem: ${mediaScore}% preservadas`)
  }

  const score = Math.round(
    colorScore      * 0.25 +
    typographyScore * 0.25 +
    layoutScore     * 0.35 +
    mediaScore      * 0.15,
  )

  return {
    passed: issues.length === 0,
    score,
    colorScore,
    typographyScore,
    layoutScore,
    mediaScore,
    issues,
    mode,
  }
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────

/**
 * Executa validação visual do template evoluído.
 * Em CREATE MODE (sem originalTemplate): self-audit de completude.
 * Em EDIT/REFINE (com originalTemplate): comparação estrutural visual.
 *
 * @param evolved           - Template gerado/evoluído
 * @param mode              - Contexto de geração ('create' | 'edit' | 'refine')
 * @param originalTemplate  - Template original (obrigatório para edit e refine)
 */
export function validateVisual(
  evolved: ElementorTemplate,
  mode: GenerationMode,
  originalTemplate?: ElementorTemplate,
): VisualValidationResult {
  if (mode === 'create' || !originalTemplate) {
    return selfAudit(evolved)
  }
  const origSnapshot = createSnapshotFromElementor(originalTemplate)
  const evolvedSnapshot = createSnapshotFromElementor(evolved)
  return compareTemplates(origSnapshot, evolvedSnapshot, mode)
}
