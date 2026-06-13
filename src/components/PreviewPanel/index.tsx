import { useState, useMemo } from 'react'
import { ExternalLink, Image as ImageIcon } from 'lucide-react'
import { injectImagePlaceholders } from '@/utils/previewUtils'
import type { ExtractedImage } from '@/services/image-extractor'

interface PreviewPanelProps {
  rawHtml: string
  resolvedHtml: string
  extractedImages: ExtractedImage[]
}

export function PreviewPanel({ rawHtml, resolvedHtml, extractedImages }: PreviewPanelProps) {
  const [previewResolved, setPreviewResolved] = useState(false)

  const base64Images = extractedImages.filter(img => img.type === 'base64')
  const externalImages = extractedImages.filter(img => img.type !== 'base64')

  const previewHtml = useMemo(() => {
    const base = previewResolved ? resolvedHtml : rawHtml
    return injectImagePlaceholders(base, extractedImages)
  }, [previewResolved, rawHtml, resolvedHtml, extractedImages])

  function openInBrowser() {
    const base = previewResolved ? resolvedHtml : rawHtml
    const blob = new Blob([base], { type: 'text/html; charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-content-primary">Preview</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-semibold">
            sempre visível
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPreviewResolved(false)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${!previewResolved ? 'bg-gold text-black' : 'text-content-muted hover:bg-bg-hover'}`}
          >
            Original
          </button>
          <button
            onClick={() => setPreviewResolved(true)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${previewResolved ? 'bg-gold text-black' : 'text-content-muted hover:bg-bg-hover'}`}
          >
            Com tokens
          </button>
          <button
            onClick={openInBrowser}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border-subtle text-content-muted hover:border-gold hover:text-gold transition-all"
            title="Abrir HTML original no navegador"
          >
            <ExternalLink size={12} /> Navegador
          </button>
        </div>
      </div>

      {/* Image warning banner */}
      {extractedImages.length > 0 && (
        <div className="flex items-start gap-2.5 px-6 py-2.5 bg-yellow-500/5 border-b border-yellow-500/20">
          <ImageIcon size={14} className="text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-200/80 leading-relaxed">
            <span className="font-semibold text-yellow-400">
              {extractedImages.length} {extractedImages.length === 1 ? 'imagem detectada' : 'imagens detectadas'}
            </span>
            {' — '}imagens não são convertidas para JSON. Placeholders visíveis abaixo.
            {base64Images.length > 0 && (
              <> {base64Images.length} imagem(ns) base64 salvas em <code className="bg-black/20 px-1 rounded font-mono">assets/images/</code> no ZIP.</>
            )}
            {externalImages.length > 0 && (
              <> URLs externas listadas em <code className="bg-black/20 px-1 rounded font-mono">LEIA-ME.txt</code>.</>
            )}
          </p>
        </div>
      )}

      {/* iframe */}
      <iframe
        srcDoc={previewHtml}
        sandbox="allow-scripts allow-same-origin"
        className="w-full bg-white"
        style={{ height: '560px' }}
        title="Preview HTML"
      />
    </div>
  )
}
