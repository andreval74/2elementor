import { Download, Package, Info, Wand2, RefreshCw, Palette, FileCode, FileJson } from 'lucide-react'
import { useState } from 'react'
import { SectionCard } from '@/components/SectionCard'
import type { SectionExport, UIAnalysisResult } from '@/types/app.types'
import type { ExtractedImage } from '@/services/image-extractor'

interface OutputPanelProps {
  exports: SectionExport[]
  extractedImages: ExtractedImage[]
  uiAnalysis?: UIAnalysisResult
  onDownloadPage: () => void
  onDownloadAll: () => Promise<void>
  onRefine?: () => void
  isRefining?: boolean
  refineCount?: number
  onDownloadDesignJson?: () => void
  onDownloadHtml?: () => void
  onDownloadCss?: () => void
}

export function OutputPanel({
  exports, extractedImages, uiAnalysis,
  onDownloadPage, onDownloadAll, onRefine, isRefining, refineCount,
  onDownloadDesignJson, onDownloadHtml, onDownloadCss,
}: OutputPanelProps) {
  const [showFormatInfo, setShowFormatInfo] = useState(false)

  const base64Images = extractedImages.filter(img => img.type === 'base64')

  if (exports.length === 0 && !uiAnalysis) {
    return (
      <div className="wk-empty h-48">
        <Package size={40} className="text-content-muted" />
        <p className="text-sm text-content-muted">O JSON aparecerá aqui<br />após a conversão</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ─── Arquivos da Análise de Imagem ─────────────────────────────────── */}
      {uiAnalysis && (
        <div className="rounded-xl border border-border-subtle bg-bg-base p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <Palette size={13} className="text-gold shrink-0" />
            <span className="text-xs font-semibold text-content-primary">Arquivos da Análise de Imagem</span>
            <span className="text-[10px] text-content-disabled ml-auto">{uiAnalysis.meta?.provider} · {uiAnalysis.sections?.length ?? 0} seções</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onDownloadDesignJson}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg border border-border-subtle hover:border-gold/40 hover:bg-bg-elevated transition-all group"
              title="Design System JSON completo"
            >
              <FileJson size={18} className="text-gold group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-semibold text-content-secondary">design.json</span>
              <span className="text-[9px] text-content-disabled">cores + typo</span>
            </button>
            <button
              onClick={onDownloadHtml}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg border border-border-subtle hover:border-gold/40 hover:bg-bg-elevated transition-all group"
              title="HTML semântico gerado"
            >
              <FileCode size={18} className="text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-semibold text-content-secondary">index.html</span>
              <span className="text-[9px] text-content-disabled">HTML gerado</span>
            </button>
            <button
              onClick={onDownloadCss}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg border border-border-subtle hover:border-gold/40 hover:bg-bg-elevated transition-all group"
              title="CSS organizado com custom properties"
            >
              <FileCode size={18} className="text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-semibold text-content-secondary">styles.css</span>
              <span className="text-[9px] text-content-disabled">CSS gerado</span>
            </button>
          </div>

          {/* Design System preview */}
          {uiAnalysis.designSystem?.colors && (
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-content-disabled">Cores:</span>
              <div className="flex gap-1 flex-wrap">
                {Object.entries(uiAnalysis.designSystem.colors)
                  .filter(([k, v]) => k !== 'text' && typeof v === 'string')
                  .slice(0, 8)
                  .map(([k, v]) => (
                    <div
                      key={k}
                      title={`${k}: ${v as string}`}
                      style={{ backgroundColor: v as string }}
                      className="w-4 h-4 rounded-full border border-border-subtle shrink-0"
                    />
                  ))}
              </div>
              {uiAnalysis.designSystem.typography?.fontFamilies?.length > 0 && (
                <span className="text-[10px] text-content-disabled ml-auto font-mono truncate max-w-[100px]">
                  {uiAnalysis.designSystem.typography.fontFamilies[0]}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Barra de ações Elementor ───────────────────────────────────────── */}
      {exports.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
            <div className="wk-tab-bar-base">
              <button
                onClick={onDownloadAll}
                className="wk-tab-action-gold"
                title={`Baixar paginas.zip${base64Images.length > 0 ? ` (+${base64Images.length} imgs)` : ''}`}
              >
                <Package size={13} /> paginas.zip
                {base64Images.length > 0 && (
                  <span className="wk-badge-zip">+{base64Images.length}</span>
                )}
              </button>
              <button onClick={onDownloadPage} className="wk-tab-action" title="Baixar page.json">
                <Download size={13} /> page.json
              </button>
              <button
                onClick={onRefine}
                disabled={!onRefine || isRefining}
                className="wk-tab-action"
                title="Refinar JSON com IA — gera versão melhorada"
              >
                {isRefining
                  ? <RefreshCw size={13} className="animate-spin" />
                  : <Wand2 size={13} />}
                {isRefining ? 'Refinando...' : 'Re-fazer'}
                {!isRefining && (refineCount ?? 0) > 0 && (
                  <span className="wk-badge-zip">×{refineCount}</span>
                )}
              </button>
              <button
                onClick={() => setShowFormatInfo(v => !v)}
                className={showFormatInfo ? 'wk-tab-info-on' : 'wk-tab-info'}
                title="Diferença entre page.json e paginas.zip"
              >
                <Info size={13} />
              </button>
            </div>

            {showFormatInfo && (
              <div className="wk-format-info">
                <div className="flex gap-2.5">
                  <span className="text-gold font-bold shrink-0">📦 paginas.zip</span>
                  <span className="text-content-secondary">
                    Contém <code className="wk-code">page.json</code> + todas as seções + pasta{' '}
                    <code className="wk-code">assets/images/</code>. Elementor importa todos os templates do ZIP de uma vez.
                  </span>
                </div>
                <div className="flex gap-2.5">
                  <span className="text-gold font-bold shrink-0">📄 page.json</span>
                  <span className="text-content-secondary">
                    Importa a página inteira de uma vez. Use em{' '}
                    <span className="text-content-primary font-medium">Elementor → Meus Modelos → Importar</span>.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Lista de seções */}
          <div className="wk-section-list">
            {exports.map(exp => (
              <SectionCard key={exp.section.id} sectionExport={exp} noExpand />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
