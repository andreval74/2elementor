// ─── ELEMENTOR EXPORTER ──────────────────────────────────────────────────────
// Monta o JSON final Elementor (version 0.4) pronto para importação
// [MAINTENANCE: formato]: editar aqui se a versão do Elementor mudar

import { ELEMENTOR_VERSION, ELEMENTOR_PAGE_CSS } from '@/utils/constants'
import { mapSingleSection, mapSectionsToElementor } from './elementor-mapper'
import type { ElementorTemplate, ElementorType } from '@/types/elementor.types'
import type { Section } from '@/types/layout.types'

const PAGE_SETTINGS = {
  hide_title: 'yes',
  page_layout: 'elementor_full_width',
  body_background_color: '#000000',
  custom_css: ELEMENTOR_PAGE_CSS,
}

/**
 * Monta o ElementorTemplate completo para uma seção individual.
 * @param section - Seção detectada com seus nós
 * @param title - Título do template (exibido no Elementor)
 * @returns ElementorTemplate pronto para JSON.stringify
 */
export function exportSection(section: Section, title?: string): ElementorTemplate {
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
    page_settings: PAGE_SETTINGS,
    content: [mapSingleSection(section)],
  }
}

/**
 * Monta o ElementorTemplate com todas as seções em uma única página.
 * @param sections - Todas as seções detectadas
 * @param title - Título da página
 * @returns ElementorTemplate da página completa
 */
export function exportFullPage(sections: Section[], title = 'Página Completa'): ElementorTemplate {
  return {
    title,
    type: 'page',
    version: ELEMENTOR_VERSION,
    is_pro: false,
    page_settings: PAGE_SETTINGS,
    content: mapSectionsToElementor(sections),
  }
}

/**
 * Serializa um ElementorTemplate em JSON string formatado.
 */
export function templateToJson(template: ElementorTemplate): string {
  return JSON.stringify(template, null, 2)
}
