import { X, Settings, ExternalLink } from 'lucide-react'
import type { TokenMap } from '@/types/app.types'

interface ConfigDashboardProps {
  tokens: TokenMap
  onSetToken: (key: keyof TokenMap, value: string) => void
  onReset: () => void
  whatsappPreview: string
  onClose: () => void
}

interface FieldConfig {
  key: keyof TokenMap
  label: string
  placeholder: string
  type?: 'text' | 'url' | 'tel' | 'email'
}

const FIELDS: FieldConfig[] = [
  { key: 'NOME_EMPRESA', label: 'Nome da Empresa', placeholder: 'Ex: WebKeeper Digital' },
  { key: 'WHATSAPP_NUMBER', label: 'WhatsApp (com DDD)', placeholder: 'Ex: 5511999999999', type: 'tel' },
  { key: 'WHATSAPP_MSG', label: 'Mensagem padrão WhatsApp', placeholder: 'Olá! Gostaria de mais informações.' },
  { key: 'EMAIL_CONTATO', label: 'E-mail de contato', placeholder: 'contato@empresa.com', type: 'email' },
  { key: 'TELEFONE', label: 'Telefone', placeholder: 'Ex: +55 11 99999-9999', type: 'tel' },
  { key: 'SITE_URL', label: 'Site', placeholder: 'https://empresa.com.br', type: 'url' },
  { key: 'INSTAGRAM_URL', label: 'Instagram', placeholder: 'https://instagram.com/empresa', type: 'url' },
  { key: 'LINKEDIN_URL', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/empresa', type: 'url' },
  { key: 'FACEBOOK_URL', label: 'Facebook', placeholder: 'https://facebook.com/empresa', type: 'url' },
]

function TokenField({ field, value, onChange }: { field: FieldConfig; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-content-secondary">{field.label}</label>
      <input
        type={field.type ?? 'text'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="wk-input"
      />
    </div>
  )
}

export function ConfigDashboard({ tokens, onSetToken, onReset, whatsappPreview, onClose }: ConfigDashboardProps) {
  return (
    <div className="wk-modal-overlay">
      <div className="wk-modal">

        <div className="wk-modal-header">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-gold" />
            <h2 className="text-base font-bold text-content-primary">Configurações de Tokens</h2>
          </div>
          <button onClick={onClose} className="wk-btn-icon-md">
            <X size={18} />
          </button>
        </div>

        <div className="wk-modal-body">
          {FIELDS.map(field => (
            <TokenField
              key={field.key}
              field={field}
              value={tokens[field.key]}
              onChange={v => onSetToken(field.key, v)}
            />
          ))}

          {tokens.WHATSAPP_NUMBER && (
            <div className="wk-token-preview">
              <p className="text-xs text-green-400 font-semibold mb-1.5">Preview do link WhatsApp</p>
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-xs font-mono text-green-300 break-all flex-1">{whatsappPreview}</p>
                <a href={whatsappPreview} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 text-green-400 hover:text-green-300 transition-colors"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="wk-modal-footer">
          <button onClick={onReset} className="text-xs text-content-muted hover:text-red-400 transition-colors font-medium">
            Redefinir tudo
          </button>
          <button onClick={onClose} className="wk-btn-modal-save">
            Salvar e fechar
          </button>
        </div>

      </div>
    </div>
  )
}
