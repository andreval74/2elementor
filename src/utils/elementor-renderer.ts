// ─── ELEMENTOR RENDERER ──────────────────────────────────────────────────────
// Converte ElementorTemplate → HTML estático para preview antes da importação.
// Aproximação visual: renderiza containers + widgets com inline styles + Tailwind CDN.
// NÃO substitui o Elementor — é apenas uma prévia de fidelidade moderada.

import { ELEMENTOR_PAGE_CSS, WEBKEEPER_FIRST_WIDGET_SETUP } from '@/utils/constants'
import type { ElementorElement, ElementorPadding, ElementorSettings, ElementorTemplate } from '@/types/elementor.types'

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function pad(p: ElementorPadding): string {
  return `${p.top}px ${p.right}px ${p.bottom}px ${p.left}px`
}

function buildStyles(pairs: (string | false | undefined | null)[]): string {
  return pairs.filter(Boolean).join(';')
}

function typoStyle(s: ElementorSettings): string {
  const parts: string[] = []
  if (s.typography_font_family) parts.push(`font-family:'${s.typography_font_family}',sans-serif`)
  if (s.typography_font_size) parts.push(`font-size:${s.typography_font_size.size}${s.typography_font_size.unit}`)
  if (s.typography_font_weight) parts.push(`font-weight:${s.typography_font_weight}`)
  return parts.join(';')
}

// ─── CONTAINER ───────────────────────────────────────────────────────────────

function containerToHtml(el: ElementorElement): string {
  const s = el.settings
  const isRow = s.flex_direction === 'row'
  const br = s.border_radius as ElementorPadding | undefined

  const style = buildStyles([
    'display:flex',
    isRow ? 'flex-direction:row;flex-wrap:wrap' : 'flex-direction:column',
    s.flex_align_items && `align-items:${s.flex_align_items}`,
    s.flex_justify_content && `justify-content:${s.flex_justify_content}`,
    s.gap && `gap:${s.gap.row ?? 0}px ${s.gap.column ?? 0}px`,
    s.content_width === 'full' && 'width:100%',
    s.background_color && `background-color:${s.background_color}`,
    s.background_image?.url && `background-image:url('${s.background_image.url}')`,
    s.background_image && 'background-size:cover;background-position:center center',
    s.padding && `padding:${pad(s.padding)}`,
    br && `border-radius:${br.top}px ${br.right}px ${br.bottom}px ${br.left}px`,
    s.border_border && s.border_color?.color && s.border_width &&
      `border:${s.border_width.top}px ${s.border_border} ${s.border_color.color}`,
  ])

  const cls = s._css_classes ? ` class="${s._css_classes}"` : ''
  const children = el.elements.map(elToHtml).join('')
  return `<div${cls} style="${style}">${children}</div>`
}

// ─── WIDGETS ─────────────────────────────────────────────────────────────────

function headingToHtml(s: ElementorSettings): string {
  const tag = s.header_size ?? 'h2'
  const style = buildStyles([
    s.title_color && `color:${s.title_color}`,
    s.align && `text-align:${s.align}`,
    typoStyle(s),
    'margin:0',
  ])
  const cls = s._css_classes ? ` class="${s._css_classes}"` : ''
  return `<${tag}${cls} style="${style}">${s.title ?? ''}</${tag}>`
}

function textEditorToHtml(s: ElementorSettings): string {
  const style = buildStyles([
    s.text_color && `color:${s.text_color}`,
    typoStyle(s),
  ])
  const cls = s._css_classes ? ` class="${s._css_classes}"` : ''
  return `<div${cls} style="${style}">${s.editor ?? ''}</div>`
}

function imageToHtml(s: ElementorSettings): string {
  if (!s.image?.url) return ''
  const align = s.align === 'center' ? 'margin:0 auto;display:block'
    : s.align === 'right' ? 'margin-left:auto;display:block' : ''
  const style = buildStyles(['max-width:100%;height:auto', align])
  const cls = s._css_classes ? ` class="${s._css_classes}"` : ''
  return `<img${cls} src="${s.image.url}" alt="${s.image.alt ?? ''}" style="${style}">`
}

function buttonToHtml(s: ElementorSettings): string {
  const tp = s.text_padding
  const br = s.border_radius as ElementorPadding | undefined
  const style = buildStyles([
    'display:inline-block;text-decoration:none;cursor:pointer',
    tp ? `padding:${pad(tp)}` : 'padding:12px 24px',
    s.background_color && `background-color:${s.background_color}`,
    s.button_text_color && `color:${s.button_text_color}`,
    br ? `border-radius:${br.top}px` : 'border-radius:6px',
    typoStyle(s),
  ])
  const cls = s._css_classes ? ` class="${s._css_classes}"` : ''
  const href = s.link?.url ?? '#'
  const target = s.link?.is_external ? ' target="_blank" rel="noopener"' : ''
  return `<a href="${href}"${target}${cls} style="${style}">${s.text ?? 'Botão'}</a>`
}

function iconListToHtml(s: ElementorSettings): string {
  if (!s.icon_list?.length) return ''
  const items = s.icon_list.map(item => {
    const href = item.link?.url ?? '#'
    return `<li style="margin:4px 0"><a href="${href}" style="color:inherit;text-decoration:none">${item.text}</a></li>`
  }).join('')
  const cls = s._css_classes ? ` class="${s._css_classes}"` : ''
  return `<ul${cls} style="list-style:none;padding:0;margin:0">${items}</ul>`
}

function dividerToHtml(s: ElementorSettings): string {
  const colorObj = s.color as { color?: string } | undefined
  const color = colorObj?.color ?? '#3A3A42'
  return `<hr style="border:none;border-top:1px solid ${color};width:100%;margin:8px 0">`
}

function videoToHtml(s: ElementorSettings): string {
  const rawSrc = s.youtube_url ?? s.vimeo_url ?? ''
  if (!rawSrc) return ''
  // Converte URL do YouTube para embed
  const src = rawSrc
    .replace('watch?v=', 'embed/')
    .replace('youtu.be/', 'www.youtube.com/embed/')
  return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden"><iframe src="${src}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none" allowfullscreen></iframe></div>`
}

function widgetToHtml(el: ElementorElement): string {
  const s = el.settings
  switch (el.widgetType) {
    case 'heading':     return headingToHtml(s)
    case 'text-editor': return textEditorToHtml(s)
    case 'image':       return imageToHtml(s)
    case 'button':      return buttonToHtml(s)
    case 'icon-list':   return iconListToHtml(s)
    case 'divider':     return dividerToHtml(s)
    case 'video':       return videoToHtml(s)
    case 'html':        return s.html ?? ''
    default:            return ''
  }
}

// ─── TRAVERSAL ───────────────────────────────────────────────────────────────

function elToHtml(el: ElementorElement): string {
  if (el.elType === 'container') return containerToHtml(el)
  if (el.elType === 'widget')    return widgetToHtml(el)
  return ''
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────

/**
 * Converte um ElementorTemplate em documento HTML estático para preview.
 * Inclui Tailwind CDN + ELEMENTOR_PAGE_CSS + custom_css da página.
 * As _css_classes dos widgets/containers são aplicadas via Tailwind.
 */
export function renderElementorTemplate(template: ElementorTemplate): string {
  const ps = template.page_settings as Record<string, unknown>
  const customCss = typeof ps.custom_css === 'string' ? ps.custom_css : ''
  const bodyColor = typeof ps.body_background_color === 'string' ? ps.body_background_color : '#000000'

  const bodyHtml = template.content.map(elToHtml).join('\n')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${WEBKEEPER_FIRST_WIDGET_SETUP}
<style>
${ELEMENTOR_PAGE_CSS}
${customCss}
</style>
</head>
<body style="margin:0;padding:0;background-color:${bodyColor};color:#ffffff;font-family:'Inter',sans-serif">
${bodyHtml}
</body>
</html>`
}
