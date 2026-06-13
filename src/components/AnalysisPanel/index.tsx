import { BarChart3, Code, Type, Image as ImageIcon, MousePointer, List, Box, Lightbulb, Globe, Braces, AlertTriangle } from 'lucide-react'
import type { Section } from '@/types/layout.types'

interface AnalysisPanelProps {
  sections: Section[]
  nodeStats: Record<string, number>
  rawHtml?: string
}

interface StatCard {
  label: string
  value: number
  Icon: React.ElementType
  color: string
}

interface Suggestion {
  id: string
  Icon: React.ElementType
  color: string
  title: string
  message: string
}

export function AnalysisPanel({ sections, nodeStats, rawHtml = '' }: AnalysisPanelProps) {
  const stats: StatCard[] = [
    { label: 'Containers', value: nodeStats.containers ?? 0, Icon: Box,          color: 'text-blue-400'   },
    { label: 'Headings',   value: nodeStats.headings   ?? 0, Icon: Type,         color: 'text-purple-400' },
    { label: 'Textos',     value: nodeStats.texts      ?? 0, Icon: Code,         color: 'text-green-400'  },
    { label: 'Imagens',    value: nodeStats.images     ?? 0, Icon: ImageIcon,    color: 'text-yellow-400' },
    { label: 'Botões',     value: nodeStats.buttons    ?? 0, Icon: MousePointer, color: 'text-gold'       },
    { label: 'Listas',     value: nodeStats.lists      ?? 0, Icon: List,         color: 'text-pink-400'   },
  ]

  const tokenMatches      = rawHtml ? Array.from(new Set(rawHtml.match(/\{\{[A-Z_]+\}\}/g) ?? [])) : []
  const hasExternalResources = rawHtml ? (/<link\s/i.test(rawHtml) || /<script[^>]+src=/i.test(rawHtml)) : false

  const suggestions: Suggestion[] = []
  if ((nodeStats.images ?? 0) > 0) {
    suggestions.push({
      id: 'images', Icon: ImageIcon, color: 'text-yellow-400',
      title: `${nodeStats.images} ${(nodeStats.images ?? 0) === 1 ? 'imagem detectada' : 'imagens detectadas'}`,
      message: 'Serão salvas em assets/images/ no ZIP. Não incluídas no JSON do Elementor.',
    })
  }
  if (tokenMatches.length > 0) {
    suggestions.push({
      id: 'tokens', Icon: Braces, color: 'text-gold',
      title: `${tokenMatches.length} ${tokenMatches.length === 1 ? 'token configurável' : 'tokens configuráveis'}`,
      message: `${tokenMatches.slice(0, 3).join(', ')}${tokenMatches.length > 3 ? ` +${tokenMatches.length - 3}` : ''}. Preencha no painel Configurar antes de converter.`,
    })
  }
  if (sections.length > 6) {
    suggestions.push({
      id: 'complex', Icon: AlertTriangle, color: 'text-orange-400',
      title: `Página complexa (${sections.length} seções)`,
      message: 'Use o paginas.zip para importar todas as seções individualmente.',
    })
  }
  if (hasExternalResources) {
    suggestions.push({
      id: 'external', Icon: Globe, color: 'text-blue-400',
      title: 'Scripts/estilos externos detectados',
      message: 'Recursos de CDN podem não carregar no Elementor. Verifique compatibilidade.',
    })
  }

  if (sections.length === 0) {
    return (
      <div className="wk-empty flex-1 py-8">
        <BarChart3 size={40} className="text-content-muted" />
        <p className="text-sm text-content-muted">Cole HTML e clique em<br />"Analisar" para ver as estatísticas</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="wk-stat-card">
            <Icon size={16} className={color} />
            <div>
              <p className="text-lg font-bold text-content-primary leading-none">{value}</p>
              <p className="text-xs text-content-muted mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Lightbulb size={13} className="text-gold" />
            <p className="wk-label">Observações</p>
          </div>
          {suggestions.map(({ id, Icon, color, title, message }) => (
            <div key={id} className="wk-suggestion-card">
              <Icon size={14} className={`${color} shrink-0 mt-0.5`} />
              <div>
                <p className={`text-xs font-semibold ${color}`}>{title}</p>
                <p className="text-xs text-content-muted mt-0.5 leading-relaxed">{message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
