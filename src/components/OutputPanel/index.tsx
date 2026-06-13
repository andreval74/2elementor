import { Download, Package, Info, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { SectionCard } from '@/components/SectionCard'
import type { SectionExport } from '@/types/app.types'
import type { ExtractedImage } from '@/services/image-extractor'

interface OutputPanelProps {
  exports: SectionExport[]
  extractedImages: ExtractedImage[]
  onDownloadPage: () => void
  onDownloadAll: () => Promise<void>
  onPreview: () => void
}

export function OutputPanel({ exports, extractedImages, onDownloadPage, onDownloadAll, onPreview }: OutputPanelProps) {
  const [showFormatInfo, setShowFormatInfo] = useState(false)

  const base64Images = extractedImages.filter(img => img.type === 'base64')

  if (exports.length === 0) {
    return (
      <div className="wk-empty h-48">
        <Package size={40} className="text-content-muted" />
        <p className="text-sm text-content-muted">O JSON aparecerá aqui<br />após a conversão</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Barra de ações */}
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
          <button onClick={onPreview} className="wk-tab-action" title="Abrir Preview no navegador">
            <ExternalLink size={13} /> Preview
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
    </div>
  )
}
