// ─── CONVERSION HOOK ─────────────────────────────────────────────────────────
// Orquestra o pipeline completo: parse → detect → tokens → export → validate
// [FUTURE: api-endpoint] — mover pipeline para API REST (Fase 3)
// [FUTURE: ai-generate] — adicionar geração por IA antes do mapeamento (Fase 3)

import { useState, useCallback } from 'react'
import { parseHTML, countNodeStats } from '@/services/html-parser'
import { detectSections } from '@/services/section-detector'
import { resolveTokens } from '@/services/token-resolver'
import { exportSection, exportFullPage, templateToJson } from '@/services/elementor-exporter'
import { validateTemplate } from '@/services/validator'
import { extractImages } from '@/services/image-extractor'
import type { ConversionStatus, SectionExport, InputType } from '@/types/app.types'
import type { Section } from '@/types/layout.types'
import type { TokenMap } from '@/types/app.types'
import type { ExtractedImage } from '@/services/image-extractor'

export interface ConversionResult {
  sections: Section[]
  exports: SectionExport[]
  nodeStats: Record<string, number>
  pageJson: string
  extractedImages: ExtractedImage[]
}

export interface UseConversionReturn {
  status: ConversionStatus
  errorMessage: string | null
  result: ConversionResult | null
  analyze: (html: string) => void
  convert: (html: string, tokens: TokenMap, inputType?: InputType) => void
  reset: () => void
}

/**
 * Orquestra o pipeline de conversão HTML → Elementor JSON.
 * Status: idle → parsing → mapping → done | error
 */
export function useConversion(): UseConversionReturn {
  const [status, setStatus] = useState<ConversionStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [result, setResult] = useState<ConversionResult | null>(null)

  const analyze = useCallback((html: string) => {
    if (!html.trim()) return
    setStatus('parsing')
    setErrorMessage(null)
    try {
      const nodes = parseHTML(html)
      const sections = detectSections(nodes)
      const nodeStats = countNodeStats(nodes)
      const extractedImages = extractImages(html)
      setResult(prev => ({ ...prev, sections, nodeStats, extractedImages, exports: prev?.exports ?? [], pageJson: prev?.pageJson ?? '' }))
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao analisar o HTML')
    }
  }, [])

  const convert = useCallback((html: string, tokens: TokenMap) => {
    if (!html.trim()) return
    setStatus('parsing')
    setErrorMessage(null)
    try {
      const nodes = parseHTML(html)
      const sections = detectSections(nodes)
      const nodeStats = countNodeStats(nodes)
      const extractedImages = extractImages(html)
      setStatus('mapping')

      const exports: SectionExport[] = sections.map(section => {
        const resolvedNodes = section.nodes.map(node => ({
          ...node,
          textContent: node.textContent ? resolveTokens(node.textContent, tokens) : node.textContent,
          rawHtml: node.rawHtml ? resolveTokens(node.rawHtml, tokens) : node.rawHtml,
        }))
        const resolvedSection = { ...section, nodes: resolvedNodes }
        const template = exportSection(resolvedSection)
        const validation = validateTemplate(template)
        return { section: resolvedSection, template, validation }
      })

      const allSections = exports.map(e => e.section)
      const pageTemplate = exportFullPage(allSections)
      const pageJson = templateToJson(pageTemplate)

      setResult({ sections, exports, nodeStats, pageJson, extractedImages })
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Erro na conversão')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setErrorMessage(null)
    setResult(null)
  }, [])

  return { status, errorMessage, result, analyze, convert, reset }
}
