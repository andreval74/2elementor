// ─── CONVERSION HOOK ─────────────────────────────────────────────────────────
// Orquestra o pipeline completo: parse → detect → tokens → export → validate
// [FUTURE: api-endpoint] — mover pipeline para API REST (Fase 3)
// [FUTURE: ai-generate] — adicionar geração por IA antes do mapeamento (Fase 3)

import { useState, useCallback, useEffect, useRef } from 'react'
import { parseHTML, countNodeStats } from '@/services/html-parser'
import { detectSections } from '@/services/section-detector'
import { resolveNodeTree } from '@/services/token-resolver'
import { exportSection, exportFullPage, exportVisionPage, templateToJson } from '@/services/elementor-exporter'
import { validateTemplate, validateNoRegression } from '@/services/validator'
import { extractImages } from '@/services/image-extractor'
import { extractPageAssets } from '@/services/css-extractor'
import { mapVisionToElementor } from '@/services/vision-elementor-mapper'
import { mapSectionsToElementor } from '@/services/elementor-mapper'
import { refinePageJson } from '@/services/ai-refiner'
import { embedExternalImages } from '@/services/image-embedder'
import { createSnapshotFromElementor, createSnapshotFromElements } from '@/services/page-snapshot'
import { computeDiff } from '@/services/snapshot-diff'
import { applyDiff } from '@/services/snapshot-patcher'
import { validateStructuralIntegrity } from '@/services/structural-validator'
import { applyStructuralCorrections } from '@/services/structural-corrector'
import { validateVisual } from '@/services/visual-validator'
import { runQualityGate } from '@/services/quality-gate'
import type { ConversionStatus, SectionExport, InputType, UIAnalysisResult } from '@/types/app.types'
import type { Section } from '@/types/layout.types'
import type { TokenMap } from '@/types/app.types'
import type { ExtractedImage } from '@/services/image-extractor'
import type { PageSnapshot, PageDiff } from '@/types/snapshot.types'
import type { ElementorTemplate } from '@/types/elementor.types'
import type { StructuralReport, VisualValidationResult, QualityGateResult } from '@/types/validation.types'

export interface ConversionResult {
  sections: Section[]
  exports: SectionExport[]
  nodeStats: Record<string, number>
  pageJson: string
  extractedImages: ExtractedImage[]
  uiAnalysis?: UIAnalysisResult
  // EDIT MODE — opcionais, presentes apenas quando evolve() foi chamado
  snapshot?: PageSnapshot
  diff?: PageDiff
  evolvedFrom?: string               // createdAt do snapshot original (ISO)
  structuralReport?: StructuralReport
  // QUALITY GATE — presentes em todos os modos
  visualValidation?: VisualValidationResult
  qualityGateResult?: QualityGateResult
  // IMAGE EMBEDDING — URLs externas que não puderam ser incorporadas como base64
  failedImages?: string[]
}

export interface UseConversionReturn {
  status: ConversionStatus
  errorMessage: string | null
  result: ConversionResult | null
  sectionRefining: Record<string, boolean>
  embeddingStatus: 'idle' | 'embedding'
  analyze: (html: string) => void
  convert: (html: string, tokens: TokenMap, inputType?: InputType) => void
  convertFromVision: (analysis: UIAnalysisResult) => void
  refine: (rawHtml: string, currentPageJson: string) => Promise<void>
  refineSection: (sectionId: string) => Promise<void>
  evolve: (originalJson: string, newHtml: string, tokens: TokenMap) => void
  setUiAnalysis: (analysis: UIAnalysisResult) => void
  reset: () => void
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const MAX_CORRECTION_ATTEMPTS = 3

/**
 * Loop de validação estrutural + auto-correção compartilhado entre refine() e evolve().
 * Executa até MAX_CORRECTION_ATTEMPTS tentativas, corrigindo violações entre cada uma.
 * Lança Error se erros estruturais (severity: 'error') persistirem ao final.
 */
function runStructuralLoop(
  original: ElementorTemplate,
  current: ElementorTemplate,
  label: string,
  onStatus: (s: ConversionStatus) => void,
): { template: ElementorTemplate; report: StructuralReport | null } {
  let template = current
  let report: StructuralReport | null = null

  for (let attempt = 0; attempt < MAX_CORRECTION_ATTEMPTS; attempt++) {
    onStatus('validating')
    report = validateStructuralIntegrity(original, template)
    if (report.passed) break

    if (report.warnings.length > 0) {
      console.warn(`[${label}] avisos estruturais (tentativa ${attempt + 1}):`, report.warnings.map(v => v.message))
    }

    // Encerra sem corrigir na última tentativa — preserva o último estado
    if (attempt === MAX_CORRECTION_ATTEMPTS - 1) break

    onStatus('correcting')
    console.warn(`[${label}] erros estruturais (tentativa ${attempt + 1}) — aplicando correção:`, report.errors.map(v => v.message))
    template = applyStructuralCorrections(template, original, report)
  }

  if (report && report.errors.length > 0) {
    throw new Error(
      `Validação estrutural do ${label} falhou após ${MAX_CORRECTION_ATTEMPTS} tentativas: ` +
      report.errors.map(v => v.message).join('; '),
    )
  }

  return { template, report }
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useConversion(): UseConversionReturn {
  const [status, setStatus] = useState<ConversionStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [sectionRefining, setSectionRefining] = useState<Record<string, boolean>>({})
  const [embeddingStatus, setEmbeddingStatus] = useState<'idle' | 'embedding'>('idle')
  // Ref para acessar result dentro do useEffect de embedding sem adicionar como dep
  const resultRef = useRef<ConversionResult | null>(null)
  resultRef.current = result

  useEffect(() => {
    if (embeddingStatus !== 'embedding' || !resultRef.current) return
    let cancelled = false
    const pageJson = resultRef.current.pageJson
    ;(async () => {
      try {
        const embedResult = await embedExternalImages(
          pageJson,
          import.meta.env.VITE_PROXY_URL as string | undefined,
        )
        if (!cancelled) {
          setResult(prev => prev
            ? { ...prev, pageJson: embedResult.json, failedImages: embedResult.failed }
            : null,
          )
        }
      } catch (err) {
        console.warn('[useConversion/embed] erro ao incorporar imagens:', err)
      } finally {
        if (!cancelled) setEmbeddingStatus('idle')
      }
    })()
    return () => { cancelled = true }
  }, [embeddingStatus]) // eslint-disable-line react-hooks/exhaustive-deps

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
      // Extrai CSS e font links do <head> ANTES do parse (parseHTML só lê o body)
      const pageAssets = extractPageAssets(html)
      const nodes = parseHTML(html)
      const sections = detectSections(nodes)
      const nodeStats = countNodeStats(nodes)
      const extractedImages = extractImages(html)
      setStatus('mapping')

      const exports: SectionExport[] = sections.map(section => {
        const resolvedNodes = section.nodes.map(node => resolveNodeTree(node, tokens))
        const resolvedSection = { ...section, nodes: resolvedNodes }
        const template = exportSection(resolvedSection, undefined, pageAssets)
        const validation = validateTemplate(template)
        return { section: resolvedSection, template, validation }
      })

      const allSections = exports.map(e => e.section)
      const pageTemplate = exportFullPage(allSections, 'Página Completa', pageAssets)
      const pageValidation = validateTemplate(pageTemplate)
      if (!pageValidation.valid) {
        throw new Error(`Página gerada inválida: ${pageValidation.errors.join('; ')}`)
      }

      const visualValidation = validateVisual(pageTemplate, 'create')
      const qualityGateResult = runQualityGate({
        mode: 'create',
        validation: pageValidation,
        sections,
        visualValidation,
      })
      if (qualityGateResult.warnings.length > 0) {
        console.warn('[convert] Quality Gate:', qualityGateResult.warnings)
      }

      const pageJson = templateToJson(pageTemplate)
      setResult({ sections, exports, nodeStats, pageJson, extractedImages, visualValidation, qualityGateResult })
      setStatus('done')
      setEmbeddingStatus('embedding')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Erro na conversão')
    }
  }, [])

  const convertFromVision = useCallback((analysis: UIAnalysisResult) => {
    if (!analysis?.sections?.length) return
    setStatus('mapping')
    setErrorMessage(null)
    try {
      const elements = mapVisionToElementor(analysis)
      const template = exportVisionPage(elements)
      const validation = validateTemplate(template)
      if (!validation.valid) {
        throw new Error(`Template Vision inválido: ${validation.errors.join('; ')}`)
      }

      const visualValidation = validateVisual(template, 'create')
      const qualityGateResult = runQualityGate({
        mode: 'create',
        validation,
        sections: [],
        visualValidation,
      })
      if (qualityGateResult.warnings.length > 0) {
        console.warn('[convertFromVision] Quality Gate:', qualityGateResult.warnings)
      }

      const pageJson = templateToJson(template)
      setResult({ sections: [], exports: [], nodeStats: {}, extractedImages: [], pageJson, uiAnalysis: analysis, visualValidation, qualityGateResult })
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Erro na conversão Vision → Elementor')
    }
  }, [])

  const refine = useCallback(async (rawHtml: string, currentPageJson: string) => {
    setStatus('refining')
    setErrorMessage(null)
    try {
      const refinedJson = await refinePageJson(rawHtml, currentPageJson)

      // Valida estrutura básica do JSON retornado pela IA
      const refinedTemplate = JSON.parse(refinedJson) as ElementorTemplate
      const basicValidation = validateTemplate(refinedTemplate)
      if (!basicValidation.valid) {
        throw new Error(`Template refinado inválido: ${basicValidation.errors.join('; ')}`)
      }

      // Pipeline EDIT: validação estrutural profunda contra o JSON original
      let currentTemplate = refinedTemplate
      let structuralReport: StructuralReport | null = null

      let originalTemplate: ElementorTemplate | null = null
      try {
        originalTemplate = JSON.parse(currentPageJson) as ElementorTemplate
      } catch {
        console.warn('[useConversion/refine] currentPageJson inválido — validação profunda ignorada')
      }

      if (originalTemplate) {
        const originalSnapshot = createSnapshotFromElementor(originalTemplate)
        const regressionResult = validateNoRegression(originalSnapshot, currentTemplate)
        if (!regressionResult.valid) {
          console.warn('[useConversion/refine] regressões detectadas:', regressionResult.errors)
        }

        const loopResult = runStructuralLoop(originalTemplate, currentTemplate, 'refine', setStatus)
        currentTemplate = loopResult.template
        structuralReport = loopResult.report
      }

      const visualValidation = validateVisual(currentTemplate, 'refine', originalTemplate ?? undefined)
      const qualityGateResult = runQualityGate({
        mode: 'refine',
        validation: basicValidation,
        sections: [],
        visualValidation,
        structuralReport,
      })
      if (qualityGateResult.warnings.length > 0) {
        console.warn('[refine] Quality Gate:', qualityGateResult.warnings)
      }

      const finalJson = templateToJson(currentTemplate)
      setResult(prev => prev
        ? { ...prev, pageJson: finalJson, structuralReport: structuralReport ?? undefined, visualValidation, qualityGateResult }
        : null,
      )
      setStatus('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao refinar com IA'
      console.error('[useConversion/refine]', err)
      setStatus('error')
      setErrorMessage(msg)
    }
  }, [])

  /**
   * EDIT MODE — Evolui uma página existente aplicando apenas as mudanças necessárias.
   * Nunca reconstrói o template completo: cria snapshots, computa diff e aplica patch cirúrgico.
   * @param originalJson - JSON Elementor atual exportado da página existente
   * @param newHtml      - HTML atualizado que reflete o estado desejado
   * @param tokens       - Tokens dinâmicos (WhatsApp, e-mail, etc.)
   */
  const evolve = useCallback((originalJson: string, newHtml: string, tokens: TokenMap) => {
    if (!originalJson.trim() || !newHtml.trim()) return
    setStatus('parsing')
    setErrorMessage(null)
    try {
      const originalTemplate = JSON.parse(originalJson) as ElementorTemplate
      const structuralCheck = validateTemplate(originalTemplate)
      if (!structuralCheck.valid) throw new Error(`JSON original inválido: ${structuralCheck.errors.join('; ')}`)

      setStatus('snapshotting')
      const originalSnapshot = createSnapshotFromElementor(originalTemplate)

      const pageAssets = extractPageAssets(newHtml)
      const nodes = parseHTML(newHtml)
      const sections = detectSections(nodes)
      const resolvedSections = sections.map(s => ({
        ...s,
        nodes: s.nodes.map(n => resolveNodeTree(n, tokens)),
      }))

      setStatus('mapping')
      const newElements = mapSectionsToElementor(resolvedSections, pageAssets.fontLinks ?? '')
      const newSnapshot = createSnapshotFromElements(newElements)

      setStatus('diffing')
      const diff = computeDiff(originalSnapshot, newSnapshot, 'full-page')

      setStatus('patching')
      const patchedTemplate = applyDiff(originalTemplate, diff)
      const finalValidation = validateTemplate(patchedTemplate)
      const regressionResult = validateNoRegression(originalSnapshot, patchedTemplate)

      if (!finalValidation.valid) {
        throw new Error(`Template evoluído inválido: ${finalValidation.errors.join('; ')}`)
      }
      if (!regressionResult.valid) {
        console.warn('[evolve] regressões detectadas:', regressionResult.errors)
      }

      let currentTemplate = patchedTemplate
      let structuralReport: StructuralReport | null = null
      const loopResult = runStructuralLoop(originalTemplate, currentTemplate, 'evolve', setStatus)
      currentTemplate = loopResult.template
      structuralReport = loopResult.report

      const postCorrectionValidation = validateTemplate(currentTemplate)
      const visualValidation = validateVisual(currentTemplate, 'edit', originalTemplate)
      const qualityGateResult = runQualityGate({
        mode: 'edit',
        validation: postCorrectionValidation,
        sections: resolvedSections,
        visualValidation,
        structuralReport,
      })
      if (qualityGateResult.warnings.length > 0) {
        console.warn('[evolve] Quality Gate:', qualityGateResult.warnings)
      }

      const pageJson = templateToJson(currentTemplate)
      setResult({
        sections: resolvedSections,
        exports: [],
        nodeStats: countNodeStats(nodes),
        pageJson,
        extractedImages: extractImages(newHtml),
        snapshot: originalSnapshot,
        diff,
        evolvedFrom: originalSnapshot.createdAt,
        structuralReport: structuralReport ?? undefined,
        visualValidation,
        qualityGateResult,
      })
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Erro no EDIT MODE pipeline')
    }
  }, [])

  const refineSection = useCallback(async (sectionId: string) => {
    if (!result) return
    const sectionExport = result.exports.find(e => e.section.id === sectionId)
    if (!sectionExport) return

    setSectionRefining(prev => ({ ...prev, [sectionId]: true }))
    try {
      const { section, template: originalTemplate } = sectionExport
      const sectionHtml = section.nodes.map(n => n.rawHtml ?? '').join('\n').trim()
      const sectionJson = templateToJson(originalTemplate)

      const refinedJson = await refinePageJson(sectionHtml, sectionJson)
      const refinedTemplate = JSON.parse(refinedJson) as ElementorTemplate
      const basicValidation = validateTemplate(refinedTemplate)
      if (!basicValidation.valid) {
        throw new Error(`Seção refinada inválida: ${basicValidation.errors.join('; ')}`)
      }

      // Valida/corrige integridade estrutural comparando com o template original da seção
      // Passa no-op para onStatus: feedback visual está no sectionRefining, não no status global
      const { template: correctedTemplate, report: structuralReport } = runStructuralLoop(
        originalTemplate, refinedTemplate, `refine-section[${section.name}]`, () => {},
      )

      const visualValidation = validateVisual(correctedTemplate, 'refine', originalTemplate)
      const qualityGateResult = runQualityGate({
        mode: 'refine',
        validation: basicValidation,
        sections: [],
        visualValidation,
        structuralReport,
      })
      if (qualityGateResult.warnings.length > 0) {
        console.warn('[refineSection] Quality Gate:', qualityGateResult.warnings)
      }

      const updatedExports = result.exports.map(e =>
        e.section.id === sectionId
          ? { ...e, template: correctedTemplate, validation: basicValidation }
          : e,
      )
      const allContent = updatedExports.flatMap(e => e.template.content)
      const basePage = JSON.parse(result.pageJson) as ElementorTemplate
      const newPageJson = templateToJson({ ...basePage, content: allContent })

      setResult(prev => prev ? { ...prev, exports: updatedExports, pageJson: newPageJson } : null)
    } catch (err) {
      console.error('[refineSection]', err)
    } finally {
      setSectionRefining(prev => ({ ...prev, [sectionId]: false }))
    }
  }, [result])

  const setUiAnalysis = useCallback((analysis: UIAnalysisResult) => {
    setResult(prev => prev ? { ...prev, uiAnalysis: analysis } : null)
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setErrorMessage(null)
    setResult(null)
    setEmbeddingStatus('idle')
  }, [])

  return { status, errorMessage, result, sectionRefining, embeddingStatus, analyze, convert, convertFromVision, refine, refineSection, evolve, setUiAnalysis, reset }
}
