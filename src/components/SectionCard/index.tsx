import { useState, useEffect, useRef } from 'react'
import { Download, Copy, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp, Wand2, RefreshCw, Eye } from 'lucide-react'
import { JsonViewer } from '@/components/JsonViewer'
import { SectionPreview } from '@/components/SectionPreview'
import { downloadTextFile, copyToClipboard } from '@/utils/downloadFile'
import { templateToJson } from '@/services/elementor-exporter'
import type { SectionExport } from '@/types/app.types'

interface SectionCardProps {
  sectionExport: SectionExport
  compact?: boolean
  noExpand?: boolean
  onRefine?: () => void
  isRefining?: boolean
}

function StatusBadge({ valid, errCount, warnCount }: { valid: boolean; errCount: number; warnCount: number }) {
  if (!valid) return (
    <span className="wk-status-error">
      <XCircle size={13} /> {errCount} erro{errCount !== 1 ? 's' : ''}
    </span>
  )
  if (warnCount > 0) return (
    <span className="wk-status-warn">
      <AlertTriangle size={13} /> {warnCount} aviso{warnCount !== 1 ? 's' : ''}
    </span>
  )
  return (
    <span className="wk-status-valid">
      <CheckCircle size={13} /> válido
    </span>
  )
}

export function SectionCard({ sectionExport, compact = false, noExpand = false, onRefine, isRefining = false }: SectionCardProps) {
  const { section, template, validation } = sectionExport
  const [expanded, setExpanded]       = useState(false)
  const [copied, setCopied]           = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [refineCount, setRefineCount] = useState(0)
  const wasRefining = useRef(false)
  const json = templateToJson(template)

  // Incrementa o contador sempre que isRefining transita de true → false
  useEffect(() => {
    if (wasRefining.current && !isRefining) setRefineCount(c => c + 1)
    wasRefining.current = isRefining
  }, [isRefining])

  async function handleCopy() {
    await copyToClipboard(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  function handleDownload() { downloadTextFile(json, section.outputFile) }

  // ── Modo compacto (grid 3 colunas) ─────────────────────────────
  if (compact) {
    return (
      <>
        <div className="wk-card-compact">
          <div className="flex items-start gap-1.5">
            <p className="text-xs font-semibold text-content-primary leading-tight flex-1">{section.label}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-content-disabled font-mono truncate max-w-[80px]">{section.outputFile}</p>
            <StatusBadge valid={validation.valid} errCount={validation.errors.length} warnCount={validation.warnings.length} />
          </div>
          <div className="flex justify-end gap-1 pt-0.5 border-t border-border-subtle">
            <button onClick={() => setShowPreview(true)} title="Visualizar seção" className="wk-btn-icon-sm">
              <Eye size={13} />
            </button>
            <button onClick={handleCopy} title="Copiar JSON" className="wk-btn-icon-sm">
              {copied ? <CheckCircle size={13} className="text-green-400" /> : <Copy size={13} />}
            </button>
            <button onClick={handleDownload} title="Baixar .json" className="wk-btn-icon-sm">
              <Download size={13} />
            </button>
            {onRefine && (
              <div className="flex items-center gap-0.5">
                <button onClick={onRefine} disabled={isRefining} title="Refinar seção com IA" className="wk-btn-icon-sm">
                  {isRefining ? <RefreshCw size={13} className="animate-spin" /> : <Wand2 size={13} />}
                </button>
                {!isRefining && refineCount > 0 && (
                  <span className="text-[9px] font-bold text-gold leading-none">×{refineCount}</span>
                )}
              </div>
            )}
          </div>
        </div>
        {showPreview && <SectionPreview sectionExport={sectionExport} onClose={() => setShowPreview(false)} />}
      </>
    )
  }

  // ── Modo noExpand (empilhado: título em cima, ações embaixo alinhadas) ──────
  if (noExpand) {
    return (
      <>
        <div className="py-2 px-3 border-b border-border-subtle" id={`section-card-${section.id}`}>
          {/* Linha 1: nome da seção (largura total) */}
          <p className="text-xs font-semibold text-content-primary leading-snug">{section.label}</p>
          {/* Linha 2: arquivo + status + ícones alinhados */}
          <div className="flex items-center gap-1 mt-1">
            <p className="text-[10px] text-content-muted font-mono flex-1 truncate">{section.outputFile}</p>
            <StatusBadge valid={validation.valid} errCount={validation.errors.length} warnCount={validation.warnings.length} />
            <button onClick={() => setShowPreview(true)} title="Visualizar seção" className="wk-btn-icon">
              <Eye size={12} />
            </button>
            <button onClick={handleCopy} title="Copiar JSON" className="wk-btn-icon">
              {copied ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
            </button>
            <button onClick={handleDownload} title="Baixar .json" className="wk-btn-icon">
              <Download size={12} />
            </button>
            {onRefine && (
              <div className="flex items-center gap-0.5">
                <button onClick={onRefine} disabled={isRefining} title="Refinar seção com IA" className="wk-btn-icon">
                  {isRefining ? <RefreshCw size={12} className="animate-spin" /> : <Wand2 size={12} />}
                </button>
                {!isRefining && refineCount > 0 && (
                  <span className="text-[9px] font-bold text-gold leading-none">×{refineCount}</span>
                )}
              </div>
            )}
          </div>
        </div>
        {showPreview && <SectionPreview sectionExport={sectionExport} onClose={() => setShowPreview(false)} />}
      </>
    )
  }

  return (
    <>
      <div className="wk-card-inner">
        <div className="wk-section-row">
          <div className="wk-section-left">
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-content-muted hover:text-gold transition-colors"
              aria-label={expanded ? 'Recolher' : 'Expandir'}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-content-primary truncate">{section.label}</p>
              <p className="text-xs text-content-muted truncate">{section.outputFile}</p>
            </div>
          </div>
          <div className="wk-section-actions">
            <StatusBadge valid={validation.valid} errCount={validation.errors.length} warnCount={validation.warnings.length} />
            <button onClick={() => setShowPreview(true)} title="Visualizar seção" className="wk-btn-icon">
              <Eye size={13} />
            </button>
            <button onClick={handleCopy} title="Copiar JSON" className="wk-btn-icon">
              {copied ? <CheckCircle size={13} className="text-green-400" /> : <Copy size={13} />}
            </button>
            <button onClick={handleDownload} title="Baixar .json" className="wk-btn-icon">
              <Download size={13} />
            </button>
            {onRefine && (
              <div className="flex items-center gap-0.5">
                <button onClick={onRefine} disabled={isRefining} title="Refinar seção com IA" className="wk-btn-icon">
                  {isRefining ? <RefreshCw size={13} className="animate-spin" /> : <Wand2 size={13} />}
                </button>
                {!isRefining && refineCount > 0 && (
                  <span className="text-[9px] font-bold text-gold leading-none">×{refineCount}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 animate-fade-in">
            {validation.errors.length > 0 && (
              <div className="mb-3 space-y-1">
                {validation.errors.map((e, i) => (
                  <p key={i} className="wk-alert-error">{e}</p>
                ))}
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="mb-3 space-y-1">
                {validation.warnings.map((w, i) => (
                  <p key={i} className="wk-alert-warn">{w}</p>
                ))}
              </div>
            )}
            <JsonViewer json={json} maxHeight="260px" />
          </div>
        )}
      </div>
      {showPreview && <SectionPreview sectionExport={sectionExport} onClose={() => setShowPreview(false)} />}
    </>
  )
}
