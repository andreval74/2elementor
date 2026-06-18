// ─── PAGE SNAPSHOT ────────────────────────────────────────────────────────────
// Cria uma PageSnapshot a partir de três fontes: ElementorTemplate, ElementorElement[] ou UIAnalysisResult.
// Usada pelo diff engine para comparar o estado original com o estado evoluído.
// [MAINTENANCE: snapshot] — melhorar inferSectionType ou extractDesignTokens aqui

import { generateUniqueId } from '@/utils/generateId'
import type { ElementorElement, ElementorTemplate, ElementorSettings } from '@/types/elementor.types'
import type { UIAnalysisResult } from '@/types/vision.types'
import type {
  PageSnapshot,
  SnapshotSection,
  SnapshotWidget,
  DesignTokenSnapshot,
} from '@/types/snapshot.types'
import type { VisionSectionType } from '@/types/vision.types'

const MAX_FLATTEN_DEPTH = 10

// ─── HELPERS PRIVADOS ────────────────────────────────────────────────────────

/**
 * Achata recursivamente todos os widgets (elType: 'widget') da árvore de um elemento.
 * DFS, limita profundidade a MAX_FLATTEN_DEPTH para espelhar o limite do validator.
 */
function flattenWidgets(el: ElementorElement, acc: SnapshotWidget[], depth: number): void {
  if (depth > MAX_FLATTEN_DEPTH) return
  if (el.elType === 'widget' && el.widgetType) {
    acc.push({
      id: el.id,
      widgetType: el.widgetType,
      settings: { ...el.settings },
      positionIndex: acc.length,
    })
    return
  }
  for (const child of el.elements) {
    flattenWidgets(child, acc, depth + 1)
  }
}

/**
 * Infere o tipo semântico de uma seção com base nos widgets que contém.
 * First-match-wins — heurística conservadora, degrada para 'unknown' sem penalidade.
 */
function inferSectionType(
  widgets: SnapshotWidget[],
  positionIndex: number,
  totalSections: number,
): VisionSectionType {
  const isLast = positionIndex === totalSections - 1
  const allText = widgets
    .map(w => [w.settings.title, w.settings.editor, w.settings.text].filter(Boolean).join(' '))
    .join(' ')
    .toLowerCase()

  if (isLast && /©|todos os direitos|copyright/.test(allText)) return 'footer'
  if (positionIndex === 0 && widgets.some(w => w.widgetType === 'icon-list')) return 'header'
  if (positionIndex <= 1 && widgets.some(w => w.widgetType === 'heading' && w.settings.header_size === 'h1')) return 'hero'
  if (/faq|perguntas|dúvidas|frequently/.test(allText)) return 'faq'
  if (/whatsapp|fale|agende|contato|contact/.test(allText)) return 'cta'
  if (/sobre|quem somos|about|nossa equipe/.test(allText)) return 'about'
  if (/serviços|services|soluções|solutions/.test(allText)) return 'services'
  return 'unknown'
}

/**
 * Extrai design tokens (cores, tipografia) de todas as seções do snapshot.
 */
function extractDesignTokens(sections: SnapshotSection[]): DesignTokenSnapshot {
  const bgColors: string[] = []
  const textColors: string[] = []
  const fonts: string[] = []
  let primaryButtonColor: string | undefined

  for (const section of sections) {
    if (section.backgroundColor) bgColors.push(section.backgroundColor)
    for (const w of section.widgets) {
      const s: ElementorSettings = w.settings
      if (s.title_color) textColors.push(s.title_color)
      if (s.text_color) textColors.push(s.text_color)
      if (s.button_text_color) textColors.push(s.button_text_color)
      if (s.typography_font_family) fonts.push(s.typography_font_family)
      if (!primaryButtonColor && w.widgetType === 'button' && s.background_color) {
        primaryButtonColor = s.background_color
      }
    }
  }

  return {
    backgroundColors: [...new Set(bgColors.filter(Boolean))],
    textColors: [...new Set(textColors.filter(Boolean))],
    fontFamilies: [...new Set(fonts.filter(Boolean))],
    primaryButtonColor,
  }
}

/** Constrói uma SnapshotSection a partir de um container raiz do Elementor. */
function buildSection(
  el: ElementorElement,
  positionIndex: number,
  totalSections: number,
): SnapshotSection {
  const widgets: SnapshotWidget[] = []
  flattenWidgets(el, widgets, 0)
  const sectionType = inferSectionType(widgets, positionIndex, totalSections)
  return {
    id: el.id,
    sectionType,
    positionIndex,
    backgroundColor: el.settings.background_color,
    widgets,
    widgetCount: widgets.length,
  }
}

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

/**
 * Cria um PageSnapshot a partir de um ElementorTemplate existente.
 * Fonte: 'elementor' — usado para capturar o estado ANTES da evolução.
 * @param template - Template Elementor atual (exportado do Elementor)
 */
export function createSnapshotFromElementor(template: ElementorTemplate): PageSnapshot {
  const sections = template.content.map((el, i) =>
    buildSection(el, i, template.content.length),
  )
  return {
    createdAt: new Date().toISOString(),
    source: 'elementor',
    sectionCount: sections.length,
    totalWidgetCount: sections.reduce((sum, s) => sum + s.widgetCount, 0),
    sections,
    designTokens: extractDesignTokens(sections),
  }
}

/**
 * Cria um PageSnapshot a partir de ElementorElement[] gerados pelo pipeline HTML.
 * Fonte: 'html-pipeline' — usado para capturar o estado DEPOIS da conversão do HTML novo.
 * @param elements - Resultado de mapSectionsToElementor()
 */
export function createSnapshotFromElements(elements: ElementorElement[]): PageSnapshot {
  const sections = elements.map((el, i) => buildSection(el, i, elements.length))
  return {
    createdAt: new Date().toISOString(),
    source: 'html-pipeline',
    sectionCount: sections.length,
    totalWidgetCount: sections.reduce((sum, s) => sum + s.widgetCount, 0),
    sections,
    designTokens: extractDesignTokens(sections),
  }
}

/**
 * Cria um PageSnapshot a partir de uma UIAnalysisResult (aba Imagem).
 * Fonte: 'vision' — IDs são gerados pois UIElement não possui IDs nativos.
 * @param analysis - Resultado da análise Vision AI
 */
export function createSnapshotFromVision(analysis: UIAnalysisResult): PageSnapshot {
  const idRegistry = new Set<string>()
  const sections: SnapshotSection[] = analysis.sections.map((uiSection, i) => {
    const widgets: SnapshotWidget[] = uiSection.elements
      .filter(el => el.type !== 'other')
      .map((el, posIdx) => {
        const wt = el.type === 'heading' ? 'heading'
          : el.type === 'button' ? 'button'
          : el.type === 'image' ? 'image'
          : el.type === 'list' ? 'icon-list'
          : el.type === 'divider' ? 'divider'
          : el.type === 'video' ? 'video'
          : 'text-editor'
        return {
          id: generateUniqueId(idRegistry),
          widgetType: wt,
          settings: { title: el.content, editor: el.content, text: el.content },
          positionIndex: posIdx,
        }
      })
    return {
      id: generateUniqueId(idRegistry),
      sectionType: uiSection.type,
      positionIndex: i,
      backgroundColor: uiSection.background.type === 'solid' ? uiSection.background.value : undefined,
      widgets,
      widgetCount: widgets.length,
    }
  })
  return {
    createdAt: new Date().toISOString(),
    source: 'vision',
    sectionCount: sections.length,
    totalWidgetCount: sections.reduce((sum, s) => sum + s.widgetCount, 0),
    sections,
    designTokens: extractDesignTokens(sections),
  }
}
