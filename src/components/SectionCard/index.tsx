import { useState } from 'react'
import { Download, Copy, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { JsonViewer } from '@/components/JsonViewer'
import { downloadTextFile, copyToClipboard } from '@/utils/downloadFile'
import { templateToJson } from '@/services/elementor-exporter'
import type { SectionExport } from '@/types/app.types'

interface SectionCardProps {
  sectionExport: SectionExport
  compact?: boolean
  noExpand?: boolean
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

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct   = Math.round(confidence * 100)
  const color = pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-yellow-400' : 'text-content-muted'
  return <span className={`wk-confidence ${color}`}>{pct}%</span>
}

export function SectionCard({ sectionExport, compact = false, noExpand = false }: SectionCardProps) {
  const { section, template, validation } = sectionExport
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied]     = useState(false)
  const json = templateToJson(template)

  async function handleCopy() {
    await copyToClipboard(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  function handleDownload() { downloadTextFile(json, section.outputFile) }

  // ── Modo compacto (grid 3 colunas) ─────────────────────────────
  if (compact) {
    return (
      <div className="wk-card-compact">
        <div className="flex items-start justify-between gap-1.5">
          <p className="text-xs font-semibold text-content-primary leading-tight">{section.label}</p>
          <ConfidenceBadge confidence={section.confidence} />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-content-disabled font-mono truncate max-w-[80px]">{section.outputFile}</p>
          <StatusBadge valid={validation.valid} errCount={validation.errors.length} warnCount={validation.warnings.length} />
        </div>
        <div className="flex justify-end gap-1 pt-0.5 border-t border-border-subtle">
          <button onClick={handleCopy} title="Copiar JSON" className="wk-btn-icon-sm">
            {copied ? <CheckCircle size={13} className="text-green-400" /> : <Copy size={13} />}
          </button>
          <button onClick={handleDownload} title="Baixar .json" className="wk-btn-icon-sm">
            <Download size={13} />
          </button>
        </div>
      </div>
    )
  }

  // ── Modo padrão (expansível, ou noExpand em linha) ──────────────
  if (noExpand) {
    return (
      <div className="wk-section-row">
        <div className="wk-section-left">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-content-primary truncate">{section.label}</p>
            <p className="text-xs text-content-muted truncate">{section.outputFile}</p>
          </div>
        </div>
        <div className="wk-section-actions">
          <ConfidenceBadge confidence={section.confidence} />
          <StatusBadge valid={validation.valid} errCount={validation.errors.length} warnCount={validation.warnings.length} />
          <button onClick={handleCopy} title="Copiar JSON" className="wk-btn-icon">
            {copied ? <CheckCircle size={13} className="text-green-400" /> : <Copy size={13} />}
          </button>
          <button onClick={handleDownload} title="Baixar .json" className="wk-btn-icon">
            <Download size={13} />
          </button>
        </div>
      </div>
    )
  }

  return (
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
          <ConfidenceBadge confidence={section.confidence} />
          <StatusBadge valid={validation.valid} errCount={validation.errors.length} warnCount={validation.warnings.length} />
          <button onClick={handleCopy} title="Copiar JSON" className="wk-btn-icon">
            {copied ? <CheckCircle size={13} className="text-green-400" /> : <Copy size={13} />}
          </button>
          <button onClick={handleDownload} title="Baixar .json" className="wk-btn-icon">
            <Download size={13} />
          </button>
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
  )
}
