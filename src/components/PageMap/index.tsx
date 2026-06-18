// ─── PAGE MAP ────────────────────────────────────────────────────────────────
// Mapa visual da página completa: única renderização escalada com seções
// numeradas, sincronizada via hover/clique com a lista de exportação.
// [TECH DECISION]: postMessage entre o iframe e o parent para comunicar
//   posições de seção e estado de destaque sem dependência de biblioteca externa.

import { useEffect, useRef, useState } from 'react'
import { Map } from 'lucide-react'
import type { SectionExport } from '@/types/app.types'

export interface PageMapProps {
  exports: SectionExport[]
  activeSectionId?: string
  onHoverSection?: (id: string | null) => void
  onClickSection?: (id: string) => void
}

// Largura de renderização do iframe (px). Controla a resolução do mapa.
const RENDER_WIDTH = 1280
// Largura exibida (px). Escala = DISPLAY_WIDTH / RENDER_WIDTH.
const DISPLAY_WIDTH = 200
const SCALE = DISPLAY_WIDTH / RENDER_WIDTH

interface SectionBound {
  id: string
  top: number
  height: number
}

// ─── CONSTRUÇÃO DO HTML DA PÁGINA COMPLETA ───────────────────────────────────

/**
 * Constrói o srcdoc do iframe com todas as seções concatenadas, cada uma
 * envolvida em um wrapper com data-wk-id. Injeta script que reporta as
 * posições via postMessage após o carregamento.
 */
function buildFullPageSrcdoc(exports: SectionExport[]): string {
  const sectionsHtml = exports
    .map(({ section }, i) => {
      const raw = section.nodes.map(n => n.rawHtml ?? '').join('\n')
      return `<div data-wk-id="${section.id}" data-wk-index="${i}">${raw}</div>`
    })
    .join('\n')

  return `<!DOCTYPE html>
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
  .btn-gold { background: linear-gradient(135deg,#EAB308,#CA8A04); color: #000; font-weight: 600; }
  .max-container { max-width: 80rem; margin-left: auto; margin-right: auto; }
  [data-wk-id] { transition: outline 0.15s; }
</style>
</head>
<body>
${sectionsHtml}
<script>
(function () {
  function reportBounds() {
    var els = document.querySelectorAll('[data-wk-id]');
    var bounds = [];
    els.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      bounds.push({
        id: el.getAttribute('data-wk-id'),
        top: rect.top + window.scrollY,
        height: el.offsetHeight,
      });
    });
    window.parent.postMessage(
      { type: 'wk-bounds', bounds: bounds, totalHeight: document.body.scrollHeight },
      '*'
    );
  }

  if (document.readyState === 'complete') {
    reportBounds();
  } else {
    window.addEventListener('load', reportBounds);
  }

  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'wk-highlight') return;
    document.querySelectorAll('[data-wk-id]').forEach(function (el) {
      el.style.outline = '';
    });
    if (e.data.id) {
      var target = document.querySelector('[data-wk-id="' + e.data.id + '"]');
      if (target) target.style.outline = '2px solid #EAB308';
    }
  });
})();
</script>
</body>
</html>`
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

/**
 * Mapa da Página: renderização única da página completa escalada, com badges
 * numerados por seção, sincronizados com a lista de exportação via hover/clique.
 */
export function PageMap({ exports, activeSectionId, onHoverSection, onClickSection }: PageMapProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [bounds, setBounds]           = useState<SectionBound[]>([])
  const [totalHeight, setTotalHeight] = useState(0)
  const [srcdoc]                      = useState(() => buildFullPageSrcdoc(exports))

  // Recebe posições das seções do iframe via postMessage
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.data || e.data.type !== 'wk-bounds') return
      setBounds(e.data.bounds as SectionBound[])
      setTotalHeight(e.data.totalHeight as number)
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Envia destaque da seção ativa ao iframe
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'wk-highlight', id: activeSectionId ?? null },
      '*',
    )
  }, [activeSectionId])

  const displayHeight = Math.round(totalHeight * SCALE)

  if (exports.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {/* Cabeçalho */}
      <div className="flex items-center gap-1.5">
        <Map size={12} className="text-gold shrink-0" />
        <span className="text-[11px] font-semibold text-content-secondary uppercase tracking-wide">
          Mapa da Página
        </span>
        <span className="text-[10px] text-content-disabled ml-auto">
          {exports.length} seção{exports.length !== 1 ? 'ões' : ''}
        </span>
      </div>

      {/* Mapa com iframe escalado + overlay de badges */}
      <div
        className="relative rounded-lg overflow-hidden border border-border-subtle bg-bg-base"
        style={{ width: DISPLAY_WIDTH, height: displayHeight || 400 }}
      >
        {/* Iframe escalado da página completa */}
        <div
          style={{
            width: RENDER_WIDTH,
            height: totalHeight || 4000,
            transform: `scale(${SCALE})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
          }}
        >
          <iframe
            ref={iframeRef}
            srcDoc={srcdoc}
            title="Mapa da Página"
            style={{ width: RENDER_WIDTH, height: totalHeight || 4000, border: 'none', display: 'block' }}
            sandbox="allow-same-origin allow-scripts"
          />
        </div>

        {/* Overlay: badges interativos sobre cada seção */}
        {bounds.map((bound, i) => {
          const exp = exports.find(e => e.section.id === bound.id)
          if (!exp) return null
          const isActive = activeSectionId === bound.id
          const top   = Math.round(bound.top * SCALE)
          const height = Math.round(bound.height * SCALE)
          const num = String(i + 1).padStart(2, '0')

          return (
            <button
              key={bound.id}
              title={exp.section.label}
              onMouseEnter={() => onHoverSection?.(bound.id)}
              onMouseLeave={() => onHoverSection?.(null)}
              onClick={() => onClickSection?.(bound.id)}
              style={{ position: 'absolute', top, left: 0, width: DISPLAY_WIDTH, height: Math.max(height, 20) }}
              className={[
                'flex items-start justify-start px-1.5 pt-1',
                'transition-all duration-150 text-left',
                isActive
                  ? 'bg-gold/20 border-l-2 border-gold'
                  : 'hover:bg-white/10 border-l-2 border-transparent',
              ].join(' ')}
            >
              <span
                className={[
                  'text-[9px] font-bold leading-none rounded px-1 py-0.5',
                  isActive ? 'bg-gold text-black' : 'bg-black/60 text-white/80',
                ].join(' ')}
              >
                {num}
              </span>
            </button>
          )
        })}
      </div>

      {/* Legenda das seções */}
      <div className="flex flex-col gap-0.5">
        {exports.map((exp, i) => {
          const isActive = activeSectionId === exp.section.id
          const num = String(i + 1).padStart(2, '0')
          return (
            <button
              key={exp.section.id}
              onMouseEnter={() => onHoverSection?.(exp.section.id)}
              onMouseLeave={() => onHoverSection?.(null)}
              onClick={() => onClickSection?.(exp.section.id)}
              className={[
                'flex items-center gap-1.5 px-2 py-1 rounded text-left w-full transition-colors',
                isActive ? 'bg-gold/10 text-gold' : 'hover:bg-bg-elevated text-content-secondary',
              ].join(' ')}
            >
              <span className="text-[9px] font-bold shrink-0 tabular-nums">{num}</span>
              <span className="text-[10px] truncate">{exp.section.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
