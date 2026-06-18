import { Download, Package, Info, Wand2, RefreshCw, Palette, FileCode, FileJson, Map, X, AlertTriangle, Copy } from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { SectionCard } from '@/components/SectionCard'
import { PageMap } from '@/components/PageMap'
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
  onRefineSection?: (sectionId: string) => void
  sectionRefining?: Record<string, boolean>
  embeddingStatus?: 'idle' | 'embedding'
  failedImages?: string[]
}

// ─── MODAL DO MAPA DA PÁGINA ──────────────────────────────────────────────────

interface PageMapModalProps {
  exports: SectionExport[]
  onClose: () => void
}

function PageMapModal({ exports, onClose }: PageMapModalProps) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  /** Ao clicar numa seção no mapa: fecha o modal e rola ao card */
  const handleClickSection = useCallback((sectionId: string) => {
    onClose()
    setTimeout(() => {
      document.getElementById(`section-card-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 150)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-sm pt-8 pb-6 px-4"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col rounded-xl overflow-hidden shadow-2xl bg-surface-card border border-border-subtle"
        style={{ maxHeight: 'calc(100vh - 3.5rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Barra de título */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2">
            <Map size={14} className="text-gold shrink-0" />
            <span className="text-sm font-semibold text-content-primary">Mapa da Página</span>
            <span className="text-[11px] text-content-disabled">
              {exports.length} seção{exports.length !== 1 ? 'ões' : ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-content-disabled">ESC para fechar</span>
            <button onClick={onClose} className="wk-btn-icon" aria-label="Fechar mapa">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Conteúdo do mapa */}
        <div className="overflow-auto p-4">
          <PageMap
            exports={exports}
            onClickSection={handleClickSection}
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── MODAL DE INFO DOS FORMATOS ──────────────────────────────────────────────

function FormatInfoModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl bg-bg-surface border border-border-subtle"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Info size={13} className="text-gold shrink-0" />
            <span className="text-sm font-semibold text-content-primary">Formatos de exportação</span>
          </div>
          <button onClick={onClose} className="wk-btn-icon" aria-label="Fechar">
            <X size={14} />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="flex gap-2.5">
            <span className="text-gold font-bold shrink-0">📦 .zip</span>
            <span className="text-sm text-content-secondary">
              Contém <code className="wk-code">page.json</code> + todas as seções individualmente + pasta{' '}
              <code className="wk-code">assets/images/</code>. Elementor importa todos os templates de uma vez.
            </span>
          </div>
          <div className="flex gap-2.5">
            <span className="text-gold font-bold shrink-0">📄 .json</span>
            <span className="text-sm text-content-secondary">
              Importa a página inteira de uma vez. Use em{' '}
              <span className="text-content-primary font-medium">Elementor → Meus Modelos → Importar</span>.
            </span>
          </div>
        </div>
        <div className="px-4 pb-3 flex justify-end">
          <button onClick={onClose} className="wk-tab-action text-xs px-3 py-1.5">
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── OUTPUT PANEL ─────────────────────────────────────────────────────────────

export function OutputPanel({
  exports, extractedImages, uiAnalysis,
  onDownloadPage, onDownloadAll, onRefine, isRefining, refineCount,
  onDownloadDesignJson, onDownloadHtml, onDownloadCss,
  onRefineSection, sectionRefining,
  embeddingStatus, failedImages,
}: OutputPanelProps) {
  const [showFormatInfo, setShowFormatInfo] = useState(false)
  const [showPageMap, setShowPageMap]       = useState(false)

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

      {/* ─── Barra de ações + lista + rodapé ──────────────────────────────────── */}
      {exports.length > 0 && (
        <>
          {/* Barra topo: Re-fazer e Mapa (ações secundárias) */}
          <div className="wk-tab-bar-base">
            <button
              onClick={onRefine}
              disabled={!onRefine || isRefining}
              className="wk-tab-action flex-1"
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
              onClick={() => setShowPageMap(true)}
              className="wk-tab-action flex-1"
              title="Ver mapa visual da página completa"
            >
              <Map size={13} /> Mapa
            </button>
          </div>

          {/* Lista de seções */}
          <div className="wk-section-list">
            {exports.map(exp => (
              <SectionCard
                key={exp.section.id}
                sectionExport={exp}
                noExpand
                onRefine={onRefineSection ? () => onRefineSection(exp.section.id) : undefined}
                isRefining={sectionRefining?.[exp.section.id] ?? false}
              />
            ))}
          </div>

          {/* ── Barra rodapé sticky — ações primárias de download ── */}
          <div className="sticky bottom-0 z-10 pt-2 bg-bg-surface border-t border-border-subtle">
            <div className="wk-tab-bar-base">
              <button
                onClick={onDownloadAll}
                className="wk-tab-action-gold flex-1"
                title={`Baixar paginas.zip${base64Images.length > 0 ? ` (+${base64Images.length} imgs)` : ''}`}
              >
                <Package size={13} /> .zip
                {base64Images.length > 0 && (
                  <span className="wk-badge-zip">+{base64Images.length}</span>
                )}
              </button>
              <button
                onClick={onDownloadPage}
                className="wk-tab-action flex-1"
                title={embeddingStatus === 'embedding' ? 'Incorporando imagens...' : 'Baixar page.json'}
              >
                {embeddingStatus === 'embedding'
                  ? <RefreshCw size={13} className="animate-spin" />
                  : <Download size={13} />}
                .json
              </button>
              <button
                onClick={() => setShowFormatInfo(true)}
                className="wk-tab-info"
                title="Diferença entre .zip e .json"
              >
                <Info size={13} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── Aviso de imagens não incorporadas ─────────────────────────────── */}
      {(failedImages?.length ?? 0) > 0 && (
        <div className="mt-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={13} className="text-yellow-500 shrink-0" />
            <span className="text-xs font-semibold text-yellow-400">
              {failedImages!.length} imagem{failedImages!.length !== 1 ? 'ns' : ''} não incorporada{failedImages!.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-[11px] text-content-secondary leading-relaxed">
            As URLs abaixo expiraram ou têm CORS bloqueado. Faça o upload manual via{' '}
            <span className="text-content-primary font-medium">Biblioteca de Mídia do WordPress</span>{' '}
            e atualize as referências no JSON.
          </p>
          <div className="flex flex-col gap-1.5">
            {failedImages!.map(url => (
              <div key={url} className="flex items-center gap-2 bg-bg-elevated rounded px-2 py-1">
                <span className="text-[10px] text-content-muted font-mono truncate flex-1" title={url}>
                  {url.length > 60 ? `${url.slice(0, 30)}…${url.slice(-20)}` : url}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(url)}
                  className="wk-btn-icon shrink-0"
                  title="Copiar URL"
                >
                  <Copy size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modais */}
      {showPageMap   && <PageMapModal exports={exports} onClose={() => setShowPageMap(false)} />}
      {showFormatInfo && <FormatInfoModal onClose={() => setShowFormatInfo(false)} />}
    </div>
  )
}
