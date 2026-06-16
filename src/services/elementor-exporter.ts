// ─── ELEMENTOR EXPORTER ──────────────────────────────────────────────────────
// Monta o JSON final Elementor (version 0.4) pronto para importação
// [MAINTENANCE: formato]: editar aqui se a versão do Elementor mudar

import { ELEMENTOR_VERSION, ELEMENTOR_PAGE_CSS } from '@/utils/constants'
import { mapSingleSection, mapSectionsToElementor } from './elementor-mapper'
import type { ElementorTemplate, ElementorType, ElementorElement } from '@/types/elementor.types'
import type { Section } from '@/types/layout.types'
import type { PageAssets } from './css-extractor'

function buildPageSettings(pageAssets?: PageAssets): Record<string, unknown> {
  const extraCss = pageAssets?.css?.trim() ? `\n\n/* === CSS DA PÁGINA ORIGINAL === */\n${pageAssets.css}` : ''
  return {
    hide_title: 'yes',
    page_layout: 'elementor_full_width',
    body_background_color: '#000000',
    custom_css: ELEMENTOR_PAGE_CSS + extraCss,
  }
}

/**
 * Monta o ElementorTemplate completo para uma seção individual.
 * @param section - Seção detectada com seus nós
 * @param title - Título do template (exibido no Elementor)
 * @param pageAssets - CSS e font links extraídos do <head> da página original
 * @returns ElementorTemplate pronto para JSON.stringify
 */
export function exportSection(section: Section, title?: string, pageAssets?: PageAssets): ElementorTemplate {
  const typeMap: Record<string, ElementorType> = {
    header: 'header',
    footer: 'footer',
    hero: 'page',
    services: 'page',
    cases: 'page',
    faq: 'page',
    cta: 'page',
    about: 'page',
  }

  return {
    title: title ?? section.label,
    type: typeMap[section.name] ?? 'page',
    version: ELEMENTOR_VERSION,
    is_pro: false,
    page_settings: buildPageSettings(pageAssets),
    content: [mapSingleSection(section, pageAssets?.fontLinks ?? '')],
  }
}

/**
 * Monta o ElementorTemplate com todas as seções em uma única página.
 * @param sections - Todas as seções detectadas
 * @param title - Título da página
 * @param pageAssets - CSS e font links extraídos do <head> da página original
 * @returns ElementorTemplate da página completa
 */
export function exportFullPage(sections: Section[], title = 'Página Completa', pageAssets?: PageAssets): ElementorTemplate {
  return {
    title,
    type: 'page',
    version: ELEMENTOR_VERSION,
    is_pro: false,
    page_settings: buildPageSettings(pageAssets),
    content: mapSectionsToElementor(sections, pageAssets?.fontLinks ?? ''),
  }
}

/**
 * Monta o ElementorTemplate a partir de ElementorElement[] gerados pelo vision mapper.
 * Não depende do pipeline HTML — recebe elementos já convertidos diretamente.
 */
export function exportVisionPage(elements: ElementorElement[], title = 'Página Vision'): ElementorTemplate {
  return {
    title,
    type: 'page',
    version: ELEMENTOR_VERSION,
    is_pro: false,
    page_settings: buildPageSettings(),
    content: elements,
  }
}

/**
 * Serializa um ElementorTemplate em JSON string formatado.
 */
export function templateToJson(template: ElementorTemplate): string {
  return JSON.stringify(template, null, 2)
}
