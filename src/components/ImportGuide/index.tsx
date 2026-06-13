import { useState } from 'react'
import { BookOpen, Monitor, Package, Download, ChevronDown, ChevronUp, Upload, AlertTriangle } from 'lucide-react'

interface StepProps { number: number; text: React.ReactNode }

function Step({ number, text }: StepProps) {
  return (
    <div className="flex gap-3 items-start">
      <span className="wk-step-num">{number}</span>
      <p className="text-sm text-content-secondary leading-relaxed">{text}</p>
    </div>
  )
}

interface ImportGuideProps {
  onDownloadPage: () => void
  onDownloadAll: () => Promise<void>
}

export function ImportGuide({ onDownloadPage, onDownloadAll }: ImportGuideProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="wk-card-surface shadow-card overflow-hidden">

      <button onClick={() => setOpen(v => !v)} className="wk-guide-toggle">
        <div className="flex items-center gap-3">
          <div className="wk-icon-lg">
            <BookOpen size={15} className="text-gold" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-content-primary">Como importar para o WordPress / Elementor</h3>
            <p className="text-xs text-content-muted mt-0.5">Guia passo a passo · 2 métodos disponíveis</p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-content-muted" /> : <ChevronDown size={16} className="text-content-muted" />}
      </button>

      {open && (
        <div className="border-t border-border-subtle animate-fade-in">

          {/* Dois cards de método com passos + botão */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">

            {/* Método 1 — page.json */}
            <div className="wk-guide-method">
              <div className="flex items-center gap-2">
                <div className="wk-icon-blue"><Monitor size={13} className="text-blue-400" /></div>
                <p className="text-sm font-bold text-content-primary">Método 1 — page.json</p>
                <span className="wk-badge-blue ml-auto">simples</span>
              </div>
              <div className="space-y-3 flex-1">
                <Step number={1} text={<>Faça login no <span className="text-content-primary font-medium">WordPress Admin</span></>} />
                <Step number={2} text={<>No menu lateral: <span className="text-content-primary font-medium">Elementor → Meus Modelos</span></>} />
                <Step number={3} text={<>Clique em <span className="text-gold font-semibold">Importar Modelos</span></>} />
                <Step number={4} text={<>Selecione <code className="wk-code">page.json</code></>} />
                <Step number={5} text={<>Clique em <span className="text-content-primary font-medium">Inserir</span> no template importado</>} />
              </div>
              <button onClick={onDownloadPage} className="wk-btn-download">
                <Download size={12} /> Baixar page.json
              </button>
            </div>

            {/* Método 2 — paginas.zip */}
            <div className="wk-guide-method-gold">
              <div className="flex items-center gap-2">
                <div className="wk-icon-gold-sm"><Package size={13} className="text-gold" /></div>
                <p className="text-sm font-bold text-content-primary">Método 2 — paginas.zip</p>
                <span className="wk-badge-green ml-auto">Recomendado</span>
              </div>
              <div className="space-y-3 flex-1">
                <Step number={1} text={<>Faça login no <span className="text-content-primary font-medium">WordPress Admin</span></>} />
                <Step number={2} text={<>No menu lateral: <span className="text-content-primary font-medium">Elementor → Meus Modelos</span></>} />
                <Step number={3} text={<>Clique em <span className="text-gold font-semibold">Importar Modelos</span></>} />
                <Step number={4} text={<>Selecione <code className="wk-code">paginas.zip</code> — Elementor importa <strong className="text-content-primary">todos</strong> os templates automaticamente</>} />
                <Step number={5} text={<>Escolha o template e clique em <span className="text-content-primary font-medium">Inserir</span></>} />
              </div>
              <button onClick={onDownloadAll} className="wk-btn-download-gold">
                <Package size={12} /> Baixar paginas.zip
              </button>
            </div>
          </div>

          {/* Aviso de imagens (separado) */}
          <div className="wk-alert-yellow-bar">
            <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-200/80">
              <span className="font-semibold text-yellow-400">Imagens: </span>
              A pasta <code className="wk-code-dark">assets/images/</code> dentro do ZIP contém as imagens extraídas.
              Faça o upload via{' '}
              <span className="text-content-primary font-medium">WordPress → Mídia → Adicionar Novo</span>{' '}
              e substitua os placeholders no editor do Elementor.
              {' '}<Upload size={11} className="inline" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
