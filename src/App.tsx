// ─── APP ROOT ────────────────────────────────────────────────────────────────
// Layout 3 colunas + estado global
// [FUTURE: auth] — adicionar autenticação aqui (Fase 2)
// [FUTURE: billing] — verificar cota de conversões (Fase 2)

import { useState, useEffect, useCallback } from 'react'
import { Settings, Zap, Clock, Trash2, Upload, BarChart3, Layers, ArrowUp } from 'lucide-react'
import { UploadPanel } from '@/components/UploadPanel'
import { AnalysisPanel } from '@/components/AnalysisPanel'
import { OutputPanel } from '@/components/OutputPanel'
import { ImportGuide } from '@/components/ImportGuide'
import { ConfigDashboard } from '@/components/ConfigDashboard'
import { useConversion } from '@/hooks/useConversion'
import { useTokens } from '@/hooks/useTokens'
import { useHistory } from '@/hooks/useHistory'
import { downloadTextFile, downloadZip } from '@/utils/downloadFile'
import { templateToJson } from '@/services/elementor-exporter'
import type { UIAnalysisResult } from '@/types/app.types'

function StatusDot({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string; pulse: boolean }> = {
    idle:    { color: 'bg-content-disabled', label: 'Aguardando',    pulse: false },
    parsing: { color: 'bg-yellow-400',       label: 'Analisando...',  pulse: true  },
    mapping: { color: 'bg-blue-400',         label: 'Convertendo...', pulse: true  },
    done:    { color: 'bg-green-400',        label: 'Concluído',      pulse: false },
    error:   { color: 'bg-red-400',          label: 'Erro',           pulse: false },
  }
  const s = map[status] ?? map.idle
  return (
    <div className="flex items-center gap-1.5">
      <span className={`wk-status-dot ${s.color} ${s.pulse ? 'status-pulse' : ''}`} />
      <span className="text-xs text-content-muted">{s.label}</span>
    </div>
  )
}

function ColumnHeader({
  title, subtitle, Icon, badge,
}: {
  title: string; subtitle?: string
  Icon?: React.ElementType; badge?: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        {Icon && <Icon size={15} className="text-gold" />}
        <h2 className="wk-col-title">{title}</h2>
        {badge}
      </div>
      {subtitle && <p className="wk-col-subtitle">{subtitle}</p>}
    </div>
  )
}

export default function App() {
  const [html, setHtml] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [analyzedForHtml, setAnalyzedForHtml] = useState('')
  const [convertedForHtml, setConvertedForHtml] = useState('')
  const [uiAnalysis, setUiAnalysis] = useState<UIAnalysisResult | undefined>(undefined)

  const conversion = useConversion()
  const { tokens, setToken, resetTokens, whatsappPreview } = useTokens()
  const { history, addToHistory, clearHistory } = useHistory()

  const isLoading = conversion.status === 'parsing' || conversion.status === 'mapping'
  const analyzeAlreadyDone = html.trim().length > 0 && html === analyzedForHtml
  const convertAlreadyDone = html.trim().length > 0 && html === convertedForHtml

  const sections        = conversion.result?.sections        ?? []
  const nodeStats       = conversion.result?.nodeStats       ?? {}
  const exports         = conversion.result?.exports         ?? []
  const pageJson        = conversion.result?.pageJson        ?? ''
  const extractedImages = conversion.result?.extractedImages ?? []

  useEffect(() => {
    function onScroll() { setShowScrollTop(window.scrollY > 300) }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleAnalyze = useCallback((h: string) => {
    conversion.analyze(h)
    setAnalyzedForHtml(h)
    setConvertedForHtml('')
  }, [conversion])

  const handleConvert = useCallback((h: string) => {
    conversion.convert(h, tokens)
    setConvertedForHtml(h)
    if (conversion.result) {
      addToHistory({
        title: `Conversão ${new Date().toLocaleTimeString('pt-BR')}`,
        inputType: 'html',
        rawHtml: h,
        exports: conversion.result.exports,
      })
    }
  }, [conversion, tokens, addToHistory])

  const handleReset = useCallback(() => {
    setHtml('')
    conversion.reset()
    setAnalyzedForHtml('')
    setConvertedForHtml('')
    setUiAnalysis(undefined)
  }, [conversion])

  function handleDownloadDesignJson() {
    if (!uiAnalysis) return
    downloadTextFile(JSON.stringify(uiAnalysis, null, 2), 'design.json')
  }

  function handleDownloadAnalysisHtml() {
    if (!uiAnalysis?.code?.html) return
    downloadTextFile(uiAnalysis.code.html, 'index.html')
  }

  function handleDownloadAnalysisCss() {
    if (!uiAnalysis?.code?.css) return
    downloadTextFile(uiAnalysis.code.css, 'styles.css')
  }

  function handleDownloadPage() {
    if (!pageJson) return
    downloadTextFile(pageJson, 'page.json')
  }

  async function handleDownloadAll() {
    const files: Record<string, string | { base64: string }> = {}
    exports.forEach(e => { files[e.section.outputFile] = templateToJson(e.template) })
    if (pageJson) files['page.json'] = pageJson
    const base64Images  = extractedImages.filter(img => img.type === 'base64')
    const externalImages = extractedImages.filter(img => img.type !== 'base64')
    base64Images.forEach(img => {
      if (img.data) files[`assets/images/${img.filename}`] = { base64: img.data }
    })
    if (externalImages.length > 0) {
      const lines = [
        'Imagens externas/relativas detectadas no HTML.',
        'Faça o download manualmente e carregue via Biblioteca de Mídia do WordPress.',
        '',
        ...externalImages.map(img => `${img.filename}  →  ${img.src}`),
      ]
      files['assets/images/LEIA-ME.txt'] = lines.join('\n')
    }
    await downloadZip(files, 'paginas.zip')
  }

  function handlePreviewInBrowser() {
    if (!html) return
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleAnalyze(html) }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [html, handleAnalyze])

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">

      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-base/90 backdrop-blur-md">
        <div className="wk-container py-3 flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="wk-icon-app">
                <Zap size={16} className="text-black" fill="black" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-content-primary leading-none">WebKeeper</h1>
                <p className="text-xs text-gold leading-none font-medium">Elementor Exporter</p>
              </div>
            </div>
            <span className="wk-badge-mvp">MVP v1.0</span>
          </div>

          <StatusDot status={conversion.status} />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(v => !v)}
              className="relative wk-btn-icon-md"
              title="Histórico"
            >
              <Clock size={17} />
              {history.length > 0 && (
                <span className="wk-badge-count">{history.length}</span>
              )}
            </button>
            <button onClick={() => setShowConfig(true)} className="wk-btn-header" title="Configurar tokens">
              <Settings size={14} />
              <span className="hidden sm:block">Configurar</span>
            </button>
            <button onClick={handleReset} className="wk-btn-header-danger" title="Limpar tudo">
              <Trash2 size={14} />
              <span className="hidden sm:block">Limpar</span>
            </button>
          </div>
        </div>

        {showHistory && history.length > 0 && (
          <div className="wk-history-dropdown">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle">
              <span className="text-xs font-semibold text-content-secondary">Histórico recente</span>
              <button
                onClick={clearHistory}
                className="text-xs text-content-muted hover:text-red-400 transition-colors font-medium flex items-center gap-1"
              >
                <Trash2 size={11} /> Limpar tudo
              </button>
            </div>
            {history.map(h => (
              <button
                key={h.id}
                onClick={() => { setHtml(h.rawHtml); setShowHistory(false) }}
                className="wk-history-item"
              >
                <p className="text-xs font-medium text-content-primary truncate">{h.title}</p>
                <p className="text-xs text-content-muted">
                  {h.sectionsCount} seções · {new Date(h.timestamp).toLocaleString('pt-BR')}
                </p>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ─── SUBBAR ──────────────────────────────────────────────────────── */}
      <div className="wk-subbar">
        <div className="wk-container py-1.5 text-[10px] text-content-disabled font-mono">
          Suporta HTML · ZIP · Imagem
        </div>
      </div>

      {/* ─── ERROR BAR ───────────────────────────────────────────────────── */}
      {conversion.errorMessage && (
        <div className="wk-error-bar">
          <span>⚠</span> {conversion.errorMessage}
        </div>
      )}

      {/* ─── GRID PRINCIPAL ──────────────────────────────────────────────── */}
      <main className="flex-1 wk-container py-6">
        <div className="wk-main-grid">

          {/* COLUNA ESQUERDA — Entrada */}
          <div className="wk-card">
            <ColumnHeader title="Entrada" subtitle="HTML · ZIP · Imagem" Icon={Upload} />
            <UploadPanel
              html={html}
              onHtmlChange={setHtml}
              onAnalyze={handleAnalyze}
              onVisionResult={setUiAnalysis}
              loading={isLoading}
              analyzeDisabled={analyzeAlreadyDone}
            />
          </div>

          {/* COLUNA CENTRAL — Análise */}
          <div className="wk-card">
            <ColumnHeader
              title="Análise"
              subtitle="Composição do Arquivo"
              Icon={BarChart3}
              badge={sections.length > 0
                ? <span className="ml-auto wk-badge-gold">{nodeStats.total ?? 0} nós</span>
                : undefined
              }
            />
            <div className="flex-1">
              <AnalysisPanel sections={sections} nodeStats={nodeStats} rawHtml={html} />
            </div>
            {sections.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border-subtle">
                <button
                  onClick={() => handleConvert(html)}
                  disabled={!html.trim() || isLoading || convertAlreadyDone}
                  className="wk-btn-primary"
                >
                  {isLoading ? 'Convertendo...' : 'Converter →'}
                </button>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA — Exportação (sempre visível) */}
          <div className="wk-card">
            <ColumnHeader
              title="Exportação"
              subtitle="JSON Elementor v0.4"
              Icon={Layers}
              badge={exports.length > 0
                ? <span className="ml-auto wk-badge-gold">{exports.length} sessões</span>
                : undefined
              }
            />
            <div className="flex-1">
              <OutputPanel
                exports={exports}
                extractedImages={extractedImages}
                uiAnalysis={uiAnalysis}
                onDownloadPage={handleDownloadPage}
                onDownloadAll={handleDownloadAll}
                onPreview={handlePreviewInBrowser}
                onDownloadDesignJson={handleDownloadDesignJson}
                onDownloadHtml={handleDownloadAnalysisHtml}
                onDownloadCss={handleDownloadAnalysisCss}
              />
            </div>
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <button onClick={handleReset} className="wk-btn-danger">Limpar</button>
            </div>
          </div>
        </div>

        {exports.length > 0 && (
          <div className="mt-6">
            <ImportGuide onDownloadPage={handleDownloadPage} onDownloadAll={handleDownloadAll} />
          </div>
        )}
      </main>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="wk-footer">
        <div className="wk-container flex items-center justify-between text-[11px] text-content-disabled">
          <span>WebKeeper Elementor Exporter · MVP v1.0 · Elementor JSON v0.4</span>
          <span>Deploy: GitHub Actions → Hostinger FTP</span>
        </div>
      </footer>

      {showConfig && (
        <ConfigDashboard
          tokens={tokens}
          onSetToken={setToken}
          onReset={resetTokens}
          whatsappPreview={whatsappPreview}
          onClose={() => setShowConfig(false)}
        />
      )}

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="wk-scroll-top"
          aria-label="Voltar ao topo"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  )
}
