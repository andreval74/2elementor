import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import { X, Eye } from 'lucide-react'
import type { SectionExport } from '@/types/app.types'

interface SectionPreviewProps {
  sectionExport: SectionExport
  onClose: () => void
}

export function SectionPreview({ sectionExport, onClose }: SectionPreviewProps) {
  const { section } = sectionExport
  const html = section.nodes.map(n => n.rawHtml ?? '').join('\n').trim()

  // Inclui Tailwind CDN + Inter para renderizar fielmente as classes do HTML original
  const srcdoc = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script>
window.addEventListener('load', function () {
  if (typeof tailwind !== 'undefined') {
    tailwind.config = {
      theme: { extend: { colors: { brand: { gold: '#EAB308', dark: '#0A0A0A', card: '#121212' } } } }
    }
  }
})
</script>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; font-family: 'Inter', sans-serif; background: #fff; }
  .glow-gold { box-shadow: 0 0 20px rgba(234,179,8,.4), 0 0 40px rgba(234,179,8,.2); }
  .text-gold { color: #EAB308; }
  .bg-gold { background-color: #EAB308; }
  .btn-gold { background: linear-gradient(135deg,#EAB308,#CA8A04); color: #000; font-weight: 600; transition: all .3s; }
  .max-container { max-width: 80rem; margin-left: auto; margin-right: auto; }
</style>
</head>
<body>
${html}
</body>
</html>`

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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-sm pt-8 pb-6 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl flex flex-col rounded-xl overflow-hidden shadow-2xl"
        style={{ maxHeight: 'calc(100vh - 3.5rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Barra de título */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-surface-card border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2.5">
            <Eye size={14} className="text-gold shrink-0" />
            <div className="min-w-0">
              <span className="text-sm font-semibold text-content-primary">{section.label}</span>
              <span className="ml-2 text-xs text-content-muted font-mono">{section.outputFile}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] text-content-disabled">ESC para fechar</span>
            <button onClick={onClose} className="wk-btn-icon" aria-label="Fechar preview">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Área de preview — overflow-auto para o modal rolar, iframe com altura própria */}
        <div className="flex-1 min-h-0 bg-white overflow-auto">
          {html ? (
            <iframe
              srcDoc={srcdoc}
              title={`Preview: ${section.label}`}
              style={{ width: '100%', height: '70vh', border: 'none', display: 'block' }}
              sandbox="allow-same-origin allow-scripts"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-center py-16 px-8">
              <Eye size={36} className="text-content-disabled opacity-40" />
              <p className="text-sm text-content-muted font-medium">
                Sem HTML disponível para esta seção
              </p>
              <p className="text-xs text-content-disabled max-w-xs">
                Esta seção foi gerada por Vision AI e não possui HTML original.<br />
                Use o botão Refinar para melhorar o JSON.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
