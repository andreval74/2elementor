import { useState, useRef, useCallback } from 'react'
import {
  FileText, Archive, Image as ImageIcon, Upload, X,
  AlertCircle, Eye, EyeOff, Sparkles, CheckCircle2,
  Loader2, ExternalLink, FileCode, ChevronDown,
} from 'lucide-react'
import { formatBytes } from '@/utils/formatBytes'
import { extractHtmlFromZip } from '@/services/zip-handler'
import { analyzeImageWithVision } from '@/services/image-vision'
import { PROVIDERS, isProxyAvailable } from '@/services/vision-registry'
import type { InputType, UIAnalysisResult } from '@/types/app.types'

const LS_PROVIDER_KEY = 'wk_vision_provider'
const apiKeyStorageKey = (id: string) => `wk_apikey_${id}`

interface UploadPanelProps {
  onHtmlChange: (html: string) => void
  onAnalyze: (html: string) => void
  onVisionResult?: (result: UIAnalysisResult) => void
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

function VisionStats({ result }: { result: UIAnalysisResult }) {
  const html       = result.code?.html ?? ''
  const sectionCnt = result.sections?.length ?? 0
  const elemCnt    = result.sections?.reduce((acc, s) => acc + (s.elements?.length ?? 0), 0) ?? 0
  const size       = formatBytes(new Blob([html]).size)
  const modelName  = result.meta?.model ?? ''
  const colorCnt   = Object.keys(result.designSystem?.colors ?? {}).filter(k => k !== 'text').length

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <CheckCircle2 size={13} className="text-green-400 shrink-0" />
        <span className="text-xs font-semibold text-green-400">Análise concluída</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { value: sectionCnt, label: 'seções'    },
          { value: elemCnt,    label: 'elementos'  },
          { value: size,       label: 'HTML'       },
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
        <span>{(result.designSystem?.typography?.fontFamilies ?? []).join(', ') || '—'}</span>
        <span>·</span>
        <span className="text-content-disabled font-mono truncate max-w-[100px]">{modelName.split('/').pop()?.split('-').slice(0, 3).join('-')}</span>
      </div>
    </div>
  )
}

export function UploadPanel({ onHtmlChange, onAnalyze, onVisionResult, html, loading, analyzeDisabled }: UploadPanelProps) {
  const [activeTab, setActiveTab]   = useState<InputType>('html')
  const [dragOver, setDragOver]     = useState(false)

  // ZIP
  const [zipFiles, setZipFiles] = useState<{ path: string; content: string }[]>([])

  // Image vision
  const [imageFile, setImageFile]             = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [analyzing, setAnalyzing]             = useState(false)
  const [visionResult, setVisionResult]       = useState<UIAnalysisResult | null>(null)
  const [visionError, setVisionError]         = useState<string | null>(null)
  const [showProviderMenu, setShowProviderMenu] = useState(false)

  // Provider state — usa proxy por padrão quando disponível
  const [providerId, setProviderId] = useState<string>(() => {
    const saved = localStorage.getItem(LS_PROVIDER_KEY)
    if (saved) return saved
    return isProxyAvailable ? 'proxy' : 'gemini'
  })
  const [apiKey, setApiKey] = useState<string>(
    () => localStorage.getItem(apiKeyStorageKey(localStorage.getItem(LS_PROVIDER_KEY) ?? (isProxyAvailable ? 'proxy' : 'gemini'))) ?? '',
  )
  const [showApiKey, setShowApiKey] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const zipInputRef  = useRef<HTMLInputElement>(null)
  const imgInputRef  = useRef<HTMLInputElement>(null)

  const activeProvider = PROVIDERS.find(p => p.id === providerId) ?? PROVIDERS[0]

  // ─── helpers ─────────────────────────────────────────────────────────────────

  function selectProvider(id: string) {
    setProviderId(id)
    localStorage.setItem(LS_PROVIDER_KEY, id)
    setApiKey(localStorage.getItem(apiKeyStorageKey(id)) ?? '')
    setShowProviderMenu(false)
    setVisionResult(null)
    setVisionError(null)
  }

  function persistApiKey(key: string) {
    setApiKey(key)
    if (key.trim()) localStorage.setItem(apiKeyStorageKey(providerId), key)
    else localStorage.removeItem(apiKeyStorageKey(providerId))
  }

  function setImage(file: File) {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImageFile(file)
    setImagePreviewUrl(URL.createObjectURL(file))
    setVisionResult(null)
    setVisionError(null)
  }

  function clearImage() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImageFile(null)
    setImagePreviewUrl(null)
    setVisionResult(null)
    setVisionError(null)
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
    if (file.name.endsWith('.zip')) {
      await handleZipFile(file)
    } else if (file.type.startsWith('image/')) {
      setImage(file)
      setActiveTab('image')
    } else {
      const text = await file.text()
      onHtmlChange(text)
    }
  }, [onHtmlChange])

  // ─── Vision analysis ─────────────────────────────────────────────────────────

  async function handleVisionAnalyze() {
    if (!imageFile || !apiKey.trim()) return
    setAnalyzing(true)
    setVisionError(null)
    setVisionResult(null)

    try {
      const result = await analyzeImageWithVision(imageFile, apiKey, providerId)
      setVisionResult(result)
      onVisionResult?.(result)
      if (result.code?.html) {
        onHtmlChange(result.code.html)
        onAnalyze(result.code.html)
      }
    } catch (err) {
      setVisionError(err instanceof Error ? err.message : 'Erro ao analisar a imagem')
    } finally {
      setAnalyzing(false)
    }
  }

  // ─── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full gap-3">

      {/* Abas */}
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
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto">

          {/* Seleção de Provider */}
          <div className="flex flex-col gap-1.5">
            <label className="wk-label">Provedor de IA</label>
            <div className="relative">
              <button
                onClick={() => setShowProviderMenu(v => !v)}
                className="wk-input flex items-center justify-between w-full text-left"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-content-primary flex items-center gap-2">
                    {activeProvider.label}
                    {activeProvider.isFree && (
                      <span className="text-[9px] bg-green-950/60 text-green-400 border border-green-900/50 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                        Grátis
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-content-muted">{activeProvider.description}</span>
                </div>
                <ChevronDown size={13} className={`text-content-muted shrink-0 transition-transform ${showProviderMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProviderMenu && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border border-border-subtle bg-bg-elevated shadow-xl overflow-hidden">
                  {PROVIDERS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => selectProvider(p.id)}
                      className={`w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-bg-base transition-colors ${
                        p.id === providerId ? 'bg-bg-base' : ''
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-content-primary">{p.label}</span>
                        <span className="text-[10px] text-content-muted">{p.description}</span>
                      </div>
                      {p.isFree ? (
                        <span className="text-[9px] bg-green-950/60 text-green-400 border border-green-900/50 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide shrink-0 ml-2">
                          Grátis
                        </span>
                      ) : (
                        <span className="text-[9px] bg-yellow-950/60 text-yellow-400 border border-yellow-900/50 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide shrink-0 ml-2">
                          Pago
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Campo chave API — oculto quando provider é o proxy sem chave */}
          {providerId === 'proxy' ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-950/30 border border-green-900/40">
              <CheckCircle2 size={13} className="text-green-400 shrink-0" />
              <p className="text-[11px] text-green-400">
                Nenhuma configuração necessária — análise hospedada pelo WebKeeper
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="wk-label">Chave API</label>
                {activeProvider.keyHelpUrl && (
                  <a
                    href={activeProvider.keyHelpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-content-disabled hover:text-gold transition-colors"
                  >
                    <ExternalLink size={9} />
                    Obter chave grátis
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => persistApiKey(e.target.value)}
                  placeholder={activeProvider.keyPlaceholder}
                  className="wk-input pr-9 font-mono text-xs"
                />
                <button
                  onClick={() => setShowApiKey(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-content-muted hover:text-content-primary transition-colors"
                  title={showApiKey ? 'Ocultar chave' : 'Mostrar chave'}
                >
                  {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <p className="text-[10px] text-content-disabled">
                Salva localmente por provedor · nunca enviada a nossos servidores
              </p>
            </div>
          )}

          {/* Drop zone ou preview da imagem */}
          {!imageFile ? (
            <div
              className={`wk-drop-zone py-8 ${dragOver ? 'wk-drop-over' : 'wk-drop-idle'}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => imgInputRef.current?.click()}
            >
              <ImageIcon size={32} className="text-gold opacity-70" />
              <p className="text-sm font-medium text-content-secondary">Arraste uma imagem ou clique</p>
              <p className="text-xs text-content-muted text-center px-4">
                PNG · JPG · WebP — a IA analisa layout, cores, tipografia e texto
              </p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-border-subtle group">
              <img
                src={imagePreviewUrl!}
                alt="preview da página"
                className="w-full max-h-52 object-cover object-top"
              />
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-bg-base/80 border border-border-subtle text-content-muted hover:text-red-400 hover:border-red-900/40 transition-all"
                title="Remover imagem"
              >
                <X size={13} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-bg-base/80 flex items-center gap-2">
                <ImageIcon size={11} className="text-content-muted shrink-0" />
                <span className="text-[10px] text-content-muted truncate">{imageFile.name}</span>
                <span className="text-[10px] text-content-disabled shrink-0">{formatBytes(imageFile.size)}</span>
              </div>
            </div>
          )}

          <input
            ref={imgInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) setImage(e.target.files[0]) }}
          />

          {/* Erro da API */}
          {visionError && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-3 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle size={13} className="shrink-0 text-red-400 mt-0.5" />
                <span className="text-xs text-red-300 leading-relaxed">{visionError}</span>
              </div>
              {/* Sugestão de trocar provider se for erro de capacidade/limite */}
              {(visionError.toLowerCase().includes('sobrecarregado') ||
                visionError.toLowerCase().includes('high demand') ||
                visionError.toLowerCase().includes('rate limit') ||
                visionError.toLowerCase().includes('limite') ||
                visionError.toLowerCase().includes('overload')) && (
                <div className="flex flex-col gap-1.5 pt-1 border-t border-red-900/40">
                  <p className="text-[11px] text-red-400/80 font-medium">Tente outro provedor gratuito:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PROVIDERS.filter(p => p.id !== providerId && p.isFree).map(p => (
                      <button
                        key={p.id}
                        onClick={() => selectProvider(p.id)}
                        className="text-[11px] px-2.5 py-1 rounded-lg border border-border-subtle hover:border-gold/40 hover:text-gold text-content-secondary transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resultado da análise */}
          {visionResult && !analyzing && (
            <div className="rounded-xl border border-green-900/40 bg-green-950/20 p-3 flex flex-col gap-2.5">
              <VisionStats result={visionResult} />
              {visionResult.code?.html && (
                <button
                  onClick={() => {
                    onHtmlChange(visionResult.code.html)
                    onAnalyze(visionResult.code.html)
                  }}
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-green-900/40 text-xs font-semibold text-green-400 hover:bg-green-950/40 transition-all"
                >
                  <FileCode size={12} />
                  Ver / reanalisar HTML gerado
                </button>
              )}
            </div>
          )}

          {/* Botão de análise */}
          {imageFile && (
            <button
              onClick={handleVisionAnalyze}
              disabled={(providerId !== 'proxy' && !apiKey.trim()) || analyzing || loading}
              className="wk-btn-primary gap-2"
            >
              {analyzing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Analisando com {activeProvider.label}...
                </>
              ) : (providerId !== 'proxy' && !apiKey.trim()) ? (
                'Insira a chave API acima para analisar'
              ) : visionResult ? (
                <>
                  <Sparkles size={14} />
                  Reanalisar imagem
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Analisar Imagem com IA
                </>
              )}
            </button>
          )}

          {/* Dica inicial */}
          {!imageFile && (providerId !== 'proxy' && !apiKey.trim()) && (
            <div className="rounded-lg border border-border-subtle bg-bg-base px-3 py-2.5">
              <p className="text-[11px] text-content-muted leading-relaxed">
                <span className="text-content-secondary font-semibold">Como funciona:</span> Selecione
                um provedor gratuito (recomendado: Gemini), obtenha a chave e faça upload do screenshot.
                A IA analisa layout, cores, tipografia e texto e gera HTML + CSS + Design System JSON.
              </p>
            </div>
          )}

        </div>
      )}

      {/* Botão Analisar (HTML e ZIP) */}
      {activeTab !== 'image' && (
        <div className="pt-1">
          <button
            onClick={() => onAnalyze(html)}
            disabled={!html.trim() || loading || !!analyzeDisabled}
            className="wk-btn-outline"
          >
            Analisar
          </button>
        </div>
      )}
    </div>
  )
}
