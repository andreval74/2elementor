import { useState, useRef, useCallback, useEffect } from 'react'
import {
  FileText, Archive, Image as ImageIcon, Upload, X,
  AlertCircle, Sparkles, CheckCircle2, Loader2, FileCode, Eye, Maximize2, ScanSearch,
} from 'lucide-react'
import { formatBytes } from '@/utils/formatBytes'
import { extractHtmlFromZip } from '@/services/zip-handler'
import { analyzeImageWithVision } from '@/services/image-vision'
import type { InputType, UIAnalysisResult } from '@/types/app.types'

interface UploadPanelProps {
  onHtmlChange: (html: string) => void
  onAnalyze: (html: string) => void
  onVisionResult?: (result: UIAnalysisResult) => void
  onVisionConvert?: (result: UIAnalysisResult) => void
  html: string
  loading: boolean
  analyzeDisabled?: boolean
}

const TABS: { id: InputType; label: string; Icon: React.ElementType }[] = [
  { id: 'html',  label: 'HTML',   Icon: FileText  },
  { id: 'zip',   label: 'ZIP',    Icon: Archive   },
  { id: 'image', label: 'IMAGEM', Icon: ImageIcon },
]

function CounterBar({ html }: { html: string }) {
  const lines = html ? html.split('\n').length : 0
  const size  = formatBytes(new Blob([html]).size)
  return (
    <div className="wk-counter-bar">
      <span>{lines} linhas</span>
      <span>{html.length.toLocaleString('pt-BR')} chars</span>
      <span>{size}</span>
    </div>
  )
}

function VisionStats({ result }: { result: UIAnalysisResult }) {
  const html       = result.code?.html ?? ''
  const sectionCnt = result.sections?.length ?? 0
  const elemCnt    = result.sections?.reduce((acc, s) => acc + (s.elements?.length ?? 0), 0) ?? 0
  const size       = formatBytes(new Blob([html]).size)
  const colorCnt   = Object.keys(result.designSystem?.colors ?? {}).filter(k => k !== 'text').length
  const fonts      = (result.designSystem?.typography?.fontFamilies ?? []).join(', ') || '—'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <CheckCircle2 size={13} className="text-green-400 shrink-0" />
        <span className="text-xs font-semibold text-green-400">Análise concluída</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { value: sectionCnt, label: 'seções'   },
          { value: elemCnt,    label: 'elementos' },
          { value: size,       label: 'HTML'      },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center py-2 rounded-lg bg-bg-base border border-border-subtle">
            <span className="text-sm font-bold text-gold">{s.value}</span>
            <span className="text-[10px] text-content-muted">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 text-[11px] text-content-muted px-0.5">
        <span>{colorCnt} cores</span>
        <span>·</span>
        <span className="truncate">{fonts}</span>
      </div>
    </div>
  )
}

function buildPreviewDoc(html: string, css: string): string {
  return `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${css}</style></head><body>${html}</body></html>`
}

interface ImageQuality {
  width: number; height: number; sizeMB: number
  status: 'good' | 'warn' | 'tip'
  msg: string
}

function checkImageQuality(file: File): Promise<ImageQuality> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { naturalWidth: w, naturalHeight: h } = img
      const sizeMB = file.size / 1024 / 1024
      if (w < 600 || h < 300) {
        resolve({ width: w, height: h, sizeMB, status: 'warn', msg: `Resolução baixa (${w}×${h}px) — resultado pode ser impreciso. Ideal: mínimo 1200×600px.` })
      } else if (sizeMB > 5) {
        resolve({ width: w, height: h, sizeMB, status: 'tip', msg: `Imagem grande (${sizeMB.toFixed(1)} MB) — será comprimida automaticamente antes de enviar.` })
      } else if (h / w > 4) {
        resolve({ width: w, height: h, sizeMB, status: 'tip', msg: `Página muito longa (${w}×${h}px) — considere dividir em partes para melhor precisão.` })
      } else {
        resolve({ width: w, height: h, sizeMB, status: 'good', msg: `Boa qualidade (${w}×${h}px · ${sizeMB.toFixed(1)} MB) — pronta para análise.` })
      }
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ width: 0, height: 0, sizeMB: 0, status: 'warn', msg: 'Não foi possível ler as dimensões da imagem.' }) }
    img.src = url
  })
}

export function UploadPanel({ onHtmlChange, onAnalyze, onVisionResult, onVisionConvert, html, loading, analyzeDisabled }: UploadPanelProps) {
  const [activeTab, setActiveTab] = useState<InputType>('html')
  const [dragOver, setDragOver]   = useState(false)
  const [zipFiles, setZipFiles]   = useState<{ path: string; content: string }[]>([])

  const [imageFile, setImageFile]             = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [analyzing, setAnalyzing]             = useState(false)
  const [visionResult, setVisionResult]       = useState<UIAnalysisResult | null>(null)
  const [visionError, setVisionError]         = useState<string | null>(null)
  const [elapsed, setElapsed]                 = useState(0)
  const [showPreview, setShowPreview]         = useState(false)
  const [imageQuality, setImageQuality]       = useState<ImageQuality | null>(null)

  useEffect(() => {
    if (!analyzing) { setElapsed(0); return }
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [analyzing])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const zipInputRef  = useRef<HTMLInputElement>(null)
  const imgInputRef  = useRef<HTMLInputElement>(null)

  function setImage(file: File) {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImageFile(file)
    setImagePreviewUrl(URL.createObjectURL(file))
    setVisionResult(null)
    setVisionError(null)
    setImageQuality(null)
    setShowPreview(false)
    checkImageQuality(file).then(setImageQuality)
  }

  function clearImage() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImageFile(null)
    setImagePreviewUrl(null)
    setVisionResult(null)
    setVisionError(null)
    setImageQuality(null)
    setShowPreview(false)
    if (imgInputRef.current) imgInputRef.current.value = ''
  }

  async function handleZipFile(file: File) {
    try {
      const files = await extractHtmlFromZip(file)
      setZipFiles(files)
      setActiveTab('zip')
      if (files.length > 0) onHtmlChange(files[0].content)
    } catch { /* ZIP inválido */ }
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (file.name.endsWith('.zip'))        { await handleZipFile(file) }
    else if (file.type.startsWith('image/')) { setImage(file); setActiveTab('image') }
    else                                    { onHtmlChange(await file.text()) }
  }, [onHtmlChange])

  async function handleVisionAnalyze() {
    if (!imageFile) return
    setAnalyzing(true)
    setVisionError(null)
    setVisionResult(null)
    try {
      const result = await analyzeImageWithVision(imageFile, '', 'proxy')
      setVisionResult(result)
      if (result.code?.html) onHtmlChange(result.code.html)
      onVisionResult?.(result)
      onVisionConvert?.(result)
    } catch (err) {
      setVisionError(err instanceof Error ? err.message : 'Erro ao analisar a imagem')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col h-full gap-3">

      {/* Abas */}
      <div className="wk-tab-bar">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={activeTab === id ? 'wk-tab-active' : 'wk-tab'}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* ─── HTML ─── */}
      {activeTab === 'html' && (
        <>
          {!html ? (
            <div
              className={`wk-drop-zone flex-1 ${dragOver ? 'wk-drop-over' : 'wk-drop-idle'}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText size={36} className="text-gold opacity-70" />
              <p className="text-sm font-medium text-content-secondary">Cole HTML, arraste ou clique</p>
              <p className="text-xs text-content-muted">Arquivos .html, .htm</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 flex-1 min-h-0">
              <div
                className={`wk-drop-textarea-wrap ${dragOver ? 'wk-drop-over' : 'border-border-subtle'}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <textarea value={html} onChange={e => onHtmlChange(e.target.value)}
                  placeholder="Cole o HTML aqui..." spellCheck={false} className="wk-textarea" />
                <button onClick={() => onHtmlChange('')} className="wk-btn-clear" title="Limpar">
                  <X size={14} />
                </button>
                {dragOver && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl pointer-events-none">
                    <div className="flex flex-col items-center gap-2 text-gold">
                      <Upload size={32} />
                      <span className="text-sm font-semibold">Solte o arquivo aqui</span>
                    </div>
                  </div>
                )}
              </div>
              <CounterBar html={html} />
            </div>
          )}
          <input ref={fileInputRef} type="file" accept=".html,.htm" className="hidden"
            onChange={async e => { if (e.target.files?.[0]) onHtmlChange(await e.target.files[0].text()) }} />
        </>
      )}

      {/* ─── ZIP ─── */}
      {activeTab === 'zip' && (
        <div className="flex flex-col gap-3 flex-1">
          <div
            className={`wk-drop-zone p-8 ${dragOver ? 'wk-drop-over' : 'wk-drop-idle'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => zipInputRef.current?.click()}
          >
            <Archive size={36} className="text-gold opacity-70" />
            <p className="text-sm font-medium text-content-secondary">Arraste um .zip ou clique</p>
            <p className="text-xs text-content-muted">Os HTMLs dentro serão listados</p>
          </div>
          <input ref={zipInputRef} type="file" accept=".zip" className="hidden"
            onChange={async e => { if (e.target.files?.[0]) await handleZipFile(e.target.files[0]) }} />
          {zipFiles.length > 0 && (
            <div className="space-y-1">
              {zipFiles.map(f => (
                <button key={f.path} onClick={() => onHtmlChange(f.content)}
                  className={`wk-zip-item ${html === f.content ? 'wk-zip-item-active' : 'wk-zip-item-idle'}`}>
                  {f.path}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── IMAGEM ─── */}
      {activeTab === 'image' && (
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto">

          {/* Badge de análise automática */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-950/30 border border-green-900/40">
            <CheckCircle2 size={13} className="text-green-400 shrink-0" />
            <p className="text-[11px] text-green-400 font-medium">
              Análise automática com IA · sem configuração necessária
            </p>
          </div>

          {/* Drop zone / preview */}
          {!imageFile ? (
            <div
              className={`wk-drop-zone py-10 ${dragOver ? 'wk-drop-over' : 'wk-drop-idle'}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => imgInputRef.current?.click()}
            >
              <ImageIcon size={36} className="text-gold opacity-70" />
              <p className="text-sm font-medium text-content-secondary">Arraste uma imagem ou clique</p>
              <p className="text-xs text-content-muted text-center px-4">
                PNG · JPG · WebP — a IA analisa layout, cores, tipografia e texto
              </p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-border-subtle">
              <img src={imagePreviewUrl!} alt="preview" className="w-full max-h-52 object-cover object-top" />
              <button onClick={clearImage}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-bg-base/80 border border-border-subtle text-content-muted hover:text-red-400 transition-all"
                title="Remover imagem">
                <X size={13} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-bg-base/80 flex items-center gap-2">
                <ImageIcon size={11} className="text-content-muted shrink-0" />
                <span className="text-[10px] text-content-muted truncate">{imageFile.name}</span>
                <span className="text-[10px] text-content-disabled shrink-0">{formatBytes(imageFile.size)}</span>
              </div>
            </div>
          )}

          <input ref={imgInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden" onChange={e => { if (e.target.files?.[0]) setImage(e.target.files[0]) }} />

          {/* Badge de qualidade da imagem */}
          {imageQuality && (
            <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-[11px] leading-relaxed border
              ${imageQuality.status === 'good'
                ? 'bg-green-950/20 border-green-900/30 text-green-400'
                : imageQuality.status === 'warn'
                ? 'bg-amber-950/20 border-amber-900/30 text-amber-400'
                : 'bg-blue-950/20 border-blue-900/30 text-blue-400'}`}>
              <AlertCircle size={12} className="shrink-0 mt-0.5" />
              <span>{imageQuality.msg}</span>
            </div>
          )}

          {/* Erro */}
          {visionError && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-3 flex items-start gap-2">
              <AlertCircle size={13} className="shrink-0 text-red-400 mt-0.5" />
              <span className="text-xs text-red-300 leading-relaxed">{visionError}</span>
            </div>
          )}

          {/* Resultado */}
          {visionResult && !analyzing && (
            <div className="rounded-xl border border-green-900/40 bg-green-950/20 p-3 flex flex-col gap-2.5">
              <VisionStats result={visionResult} />
              {visionResult.code?.html && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPreview(v => !v)}
                    className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg border border-green-900/40 text-xs font-semibold text-green-400 hover:bg-green-950/40 transition-all"
                  >
                    <Eye size={12} /> {showPreview ? 'Fechar visualização' : 'Visualização HTML'}
                  </button>
                  <button
                    onClick={() => {
                      if (visionResult.code?.html) onHtmlChange(visionResult.code.html)
                      onVisionConvert?.(visionResult)
                    }}
                    className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg border border-green-900/40 text-xs font-semibold text-green-400 hover:bg-green-950/40 transition-all"
                  >
                    <FileCode size={12} /> Usar no Elementor
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Preview inline */}
          {showPreview && visionResult?.code?.html && (
            <div className="rounded-xl border border-border-subtle overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-3 py-1.5 bg-bg-elevated border-b border-border-subtle">
                <span className="text-[10px] text-content-muted font-medium">Preview — HTML gerado pela IA</span>
                <button
                  onClick={() => {
                    const doc = buildPreviewDoc(visionResult.code.html, visionResult.code?.css ?? '')
                    const blob = new Blob([doc], { type: 'text/html' })
                    window.open(URL.createObjectURL(blob), '_blank')
                  }}
                  className="flex items-center gap-1 text-[10px] text-content-muted hover:text-gold transition-colors"
                  title="Abrir em nova aba"
                >
                  <Maximize2 size={10} /> Tela cheia
                </button>
              </div>
              <iframe
                srcDoc={buildPreviewDoc(visionResult.code.html, visionResult.code?.css ?? '')}
                className="w-full bg-white"
                style={{ height: '400px', border: 'none' }}
                title="Preview HTML"
                sandbox="allow-same-origin"
              />
            </div>
          )}

          {/* Botão analisar */}
          {imageFile && (
            <div className="flex flex-col gap-1.5">
              <button onClick={handleVisionAnalyze} disabled={analyzing || loading} className="wk-btn-primary gap-2">
                {analyzing ? (
                  <><Loader2 size={15} className="animate-spin" /> Analisando... {elapsed}s</>
                ) : visionResult ? (
                  <><Sparkles size={14} /> Reanalisar imagem</>
                ) : (
                  <><Sparkles size={14} /> Analisar Imagem com IA</>
                )}
              </button>
              {analyzing && (
                <p className="text-[10px] text-content-disabled text-center">
                  {elapsed < 15 ? 'Enviando imagem para o servidor...' :
                   elapsed < 40 ? 'IA analisando layout e cores...' :
                   elapsed < 70 ? 'Gerando HTML e Design System...' :
                                  'Finalizando resposta, aguarde...'}
                </p>
              )}
            </div>
          )}

        </div>
      )}

      {/* Ações HTML/ZIP — Visualizar | Analisar */}
      {activeTab !== 'image' && (
        <div className="pt-1 flex gap-2">
          <button
            onClick={() => {
              const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
              const url  = URL.createObjectURL(blob)
              window.open(url, '_blank')
              setTimeout(() => URL.revokeObjectURL(url), 60000)
            }}
            disabled={!html.trim()}
            className="wk-btn-blue flex-1"
            title="Visualizar HTML de entrada"
          >
            <Eye size={14} /> Visualizar
          </button>
          <button
            onClick={() => onAnalyze(html)}
            disabled={!html.trim() || loading || !!analyzeDisabled}
            className="wk-btn-orange flex-1"
          >
            <ScanSearch size={14} /> Analisar
          </button>
        </div>
      )}
    </div>
  )
}
