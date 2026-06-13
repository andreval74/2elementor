import { useState, useRef, useCallback } from 'react'
import { FileText, Archive, Image as ImageIcon, Upload, X, AlertCircle } from 'lucide-react'
import { formatBytes } from '@/utils/formatBytes'
import { extractHtmlFromZip } from '@/services/zip-handler'
import { analyzeImage } from '@/services/image-analyzer'
import type { InputType } from '@/types/app.types'
import type { SectionEstimate } from '@/types/layout.types'

interface UploadPanelProps {
  onHtmlChange: (html: string) => void
  onAnalyze: (html: string) => void
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
  const chars = html.length
  const size  = formatBytes(new Blob([html]).size)
  return (
    <div className="wk-counter-bar">
      <span>{lines} linhas</span>
      <span>{chars.toLocaleString('pt-BR')} chars</span>
      <span>{size}</span>
    </div>
  )
}

export function UploadPanel({ onHtmlChange, onAnalyze, html, loading, analyzeDisabled }: UploadPanelProps) {
  const [activeTab, setActiveTab]         = useState<InputType>('html')
  const [dragOver, setDragOver]           = useState(false)
  const [zipFiles, setZipFiles]           = useState<{ path: string; content: string }[]>([])
  const [imageEstimates, setImageEstimates] = useState<SectionEstimate[]>([])
  const [imageError, setImageError]       = useState<string | null>(null)
  const [analyzingImage, setAnalyzingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const zipInputRef  = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (file.name.endsWith('.zip'))        await handleZipFile(file)
    else if (file.type.startsWith('image/')) await handleImageFile(file)
    else { const text = await file.text(); onHtmlChange(text) }
  }, [onHtmlChange])

  async function handleZipFile(file: File) {
    try {
      const files = await extractHtmlFromZip(file)
      setZipFiles(files)
      setActiveTab('zip')
      if (files.length > 0) onHtmlChange(files[0].content)
    } catch { setImageError('Erro ao abrir o ZIP') }
  }

  async function handleImageFile(file: File) {
    setAnalyzingImage(true)
    setImageError(null)
    try {
      const estimates = await analyzeImage(file)
      setImageEstimates(estimates)
      setActiveTab('image')
    } catch { setImageError('Erro ao analisar a imagem') }
    finally { setAnalyzingImage(false) }
  }

  return (
    <div className="flex flex-col h-full gap-3">

      {/* Abas de tipo de entrada */}
      <div className="wk-tab-bar">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={activeTab === id ? 'wk-tab-active' : 'wk-tab'}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* ─── ABA HTML ─── */}
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
              <p className="text-sm font-medium text-content-secondary">Cole HTML, arraste ou clique para selecionar</p>
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
                <textarea
                  value={html}
                  onChange={e => onHtmlChange(e.target.value)}
                  placeholder="Cole o HTML aqui..."
                  spellCheck={false}
                  className="wk-textarea"
                />
                <button onClick={() => onHtmlChange('')} className="wk-btn-clear" title="Limpar texto">
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
          <input
            ref={fileInputRef} type="file" accept=".html,.htm" className="hidden"
            onChange={async e => { if (e.target.files?.[0]) onHtmlChange(await e.target.files[0].text()) }}
          />
        </>
      )}

      {/* ─── ABA ZIP ─── */}
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
            <p className="text-sm font-medium text-content-secondary">Arraste um arquivo .zip ou clique</p>
            <p className="text-xs text-content-muted">Os arquivos HTML dentro serão listados</p>
          </div>
          <input
            ref={zipInputRef} type="file" accept=".zip" className="hidden"
            onChange={async e => { if (e.target.files?.[0]) await handleZipFile(e.target.files[0]) }}
          />
          {zipFiles.length > 0 && (
            <div className="space-y-1">
              {zipFiles.map(f => (
                <button
                  key={f.path}
                  onClick={() => onHtmlChange(f.content)}
                  className={`wk-zip-item ${html === f.content ? 'wk-zip-item-active' : 'wk-zip-item-idle'}`}
                >
                  {f.path}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── ABA IMAGEM ─── */}
      {activeTab === 'image' && (
        <div className="flex flex-col gap-3 flex-1">
          <div
            className={`wk-drop-zone p-8 ${dragOver ? 'wk-drop-over' : 'wk-drop-idle'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('img-input')?.click()}
          >
            <ImageIcon size={36} className="text-gold opacity-70" />
            <p className="text-sm font-medium text-content-secondary">
              {analyzingImage ? 'Analisando...' : 'Arraste uma imagem ou clique'}
            </p>
            <p className="text-xs text-content-muted">PNG, JPG, WebP — análise heurística por Canvas API</p>
          </div>
          <input
            id="img-input" type="file" accept="image/*" className="hidden"
            onChange={async e => { if (e.target.files?.[0]) await handleImageFile(e.target.files[0]) }}
          />
          {imageError && (
            <div className="wk-alert-inline"><AlertCircle size={13} /> {imageError}</div>
          )}
          {imageEstimates.length > 0 && (
            <div className="space-y-1.5">
              <p className="wk-label">Seções estimadas</p>
              {imageEstimates.map((est, i) => (
                <div key={i} className="wk-image-estimate">
                  <span className="text-sm font-medium text-content-primary capitalize">{est.type}</span>
                  <div className="flex items-center gap-2">
                    <div className="wk-progress-track">
                      <div className="wk-progress-fill" style={{ width: `${est.confidence * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono text-content-muted">
                      {Math.round(est.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Botão Analisar */}
      <div className="pt-1">
        <button
          onClick={() => onAnalyze(html)}
          disabled={!html.trim() || loading || !!analyzeDisabled}
          className="wk-btn-outline"
        >
          Analisar
        </button>
      </div>
    </div>
  )
}
