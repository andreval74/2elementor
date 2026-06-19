// ─── CSS EXTRACTOR ────────────────────────────────────────────────────────────
// Extrai informações de CSS de classes (Tailwind) e estilos inline

// Regex para extrair background-image URL
const BG_IMAGE_URL_REGEX = /url\(['"]?([^'")\s]+)['"]?\)/i

// Regex para extrair gradientes (incluindo conic-gradient)
const GRADIENT_REGEX = /(linear|radial|conic)-gradient\([^)]+\)/i

// Regex para extrair múltiplas propriedades em background-image
const MULTIPLE_BACKGROUND_REGEX = /(url|linear-gradient|radial-gradient|conic-gradient)\([^)]+\)/gi

// Tailwind spacing scale (padrão)
const TW_SPACING: Record<string, string> = {
  '0': '0', 'px': '1px', '0.5': '2px', '1': '4px', '1.5': '6px', '2': '8px', '2.5': '10px',
  '3': '12px', '3.5': '14px', '4': '16px', '5': '20px', '6': '24px', '7': '28px', '8': '32px',
  '9': '36px', '10': '40px', '11': '44px', '12': '48px', '14': '56px', '16': '64px',
  '20': '80px', '24': '96px', '28': '112px', '32': '128px', '36': '144px', '40': '160px',
  '44': '176px', '48': '192px', '52': '208px', '56': '224px', '60': '240px', '64': '256px',
  '72': '288px', '80': '320px', '96': '384px',
}

// Tailwind border radius scale
const TW_BORDER_RADIUS: Record<string, string> = {
  'none': '0', 'sm': '2', 'md': '6', 'lg': '8', 'xl': '12', '2xl': '16',
  '3xl': '24', 'full': '9999',
}

// Tailwind shadow scale
const TW_SHADOW: Record<string, string> = {
  'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
}

export interface ExtractedCSS {
  colors?: { text?: string; bg?: string; border?: string }
  spacing?: { m?: string; p?: string; gap?: string }
  border?: { width?: string; radius?: string; color?: string }
  shadow?: string
  bgImage?: string
  gradient?: string
  typography?: {
    fontSize?: string
    fontWeight?: string
    lineHeight?: string
    letterSpacing?: string
  }
  opacity?: string
  animation?: string
  responsive?: {
    sm?: ExtractedCSS
    md?: ExtractedCSS
    lg?: ExtractedCSS
    xl?: ExtractedCSS
    "2xl"?: ExtractedCSS
  }
}

// Função auxiliar para extrair CSS de um grupo de classes (incluindo responsivos)
function extractCSSFromClassGroup(classGroup: string[]): ExtractedCSS {
  const css: ExtractedCSS = {}

  // --- Cores ---
  // Prioriza classes de cor que não sejam tamanho: text-white, text-[#123], text-gray-500, etc.
  const textColorClass = classGroup.find(c => {
    if (!c.startsWith('text-')) return false
    if (c.startsWith('text-(') || c.startsWith('text-opacity-')) return false
    // Evita classes de tamanho: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, etc.
    const suffix = c.slice(5)
    const sizeKeywords = ['xs','sm','base','lg','xl','2xl','3xl','4xl','5xl','6xl','7xl','8xl','9xl']
    if (sizeKeywords.includes(suffix)) return false
    return true
  })
  if (textColorClass) {
    css.colors = css.colors || {}
    const color = extractColorFromClass(textColorClass)
    if (color) css.colors.text = color
  }
  const bgColorClass = classGroup.find(c => c.startsWith('bg-') && !c.startsWith('bg-(') && !c.startsWith('bg-opacity-'))
  if (bgColorClass) {
    css.colors = css.colors || {}
    const color = extractColorFromClass(bgColorClass)
    if (color) css.colors.bg = color
  }
  const borderColorClass = classGroup.find(c => c.startsWith('border-') && !c.match(/border-(none|collapse|separate|opacity|\d)/))
  if (borderColorClass) {
    css.colors = css.colors || {}
    const color = extractColorFromClass(borderColorClass)
    if (color) css.colors.border = color
  }

  // --- Espaçamentos ---
  const gapClass = classGroup.find(c => c.startsWith('gap-'))
  if (gapClass) {
    const key = gapClass.replace('gap-', '')
    css.spacing = css.spacing || {}
    css.spacing.gap = TW_SPACING[key] || key
  }
  const mClass = classGroup.find(c => c.match(/^m-([0-9.]+|px)$/))
  if (mClass) {
    const key = mClass.replace('m-', '')
    css.spacing = css.spacing || {}
    css.spacing.m = TW_SPACING[key] || key
  }
  const pClass = classGroup.find(c => c.match(/^p-([0-9.]+|px)$/))
  if (pClass) {
    const key = pClass.replace('p-', '')
    css.spacing = css.spacing || {}
    css.spacing.p = TW_SPACING[key] || key
  }

  // --- Bordas ---
  const borderClass = classGroup.find(c => c.match(/^border-([0-9]+)$/))
  if (borderClass) {
    const width = borderClass.replace('border-', '')
    css.border = css.border || {}
    css.border.width = width === '0' ? '0' : `${width}px`
  }
  const roundedClass = classGroup.find(c => c.startsWith('rounded-') || c === 'rounded')
  if (roundedClass) {
    let key = roundedClass.replace('rounded-', '')
    if (key === 'rounded') key = 'md' // padrão
    css.border = css.border || {}
    css.border.radius = TW_BORDER_RADIUS[key] || key
  }

  // --- Sombras ---
  const shadowClass = classGroup.find(c => c.startsWith('shadow-') || c === 'shadow')
  if (shadowClass) {
    let key = shadowClass.replace('shadow-', '')
    if (key === 'shadow') key = 'sm' // padrão
    css.shadow = TW_SHADOW[key] || shadowClass
  }

  // --- Tipografia ---
  // Prioriza classes de tamanho: text-xs, text-sm, etc.
  const textSizeClass = classGroup.find(c => {
    if (!c.startsWith('text-')) return false
    if (c.startsWith('text-opacity-')) return false
    const suffix = c.slice(5)
    const sizeKeywords = ['xs','sm','base','lg','xl','2xl','3xl','4xl','5xl','6xl','7xl','8xl','9xl']
    return sizeKeywords.includes(suffix)
  })
  if (textSizeClass) {
    const key = textSizeClass.replace('text-', '')
    css.typography = css.typography || {}
    css.typography.fontSize = mapTailwindFontSize(key)
  }
  const fontClass = classGroup.find(c => c.startsWith('font-'))
  if (fontClass) {
    const weight = fontClass.replace('font-', '')
    css.typography = css.typography || {}
    css.typography.fontWeight = mapTailwindFontWeight(weight)
  }
  const leadingClass = classGroup.find(c => c.startsWith('leading-'))
  if (leadingClass) {
    css.typography = css.typography || {}
    css.typography.lineHeight = leadingClass.replace('leading-', '')
  }
  const trackingClass = classGroup.find(c => c.startsWith('tracking-'))
  if (trackingClass) {
    css.typography = css.typography || {}
    css.typography.letterSpacing = mapTailwindLetterSpacing(trackingClass.replace('tracking-', ''))
  }

  // --- Opacidade ---
  const opacityClass = classGroup.find(c => c.startsWith('opacity-'))
  if (opacityClass) {
    css.opacity = opacityClass.replace('opacity-', '')
  }

  // --- Animações ---
  // Mapeia animações comuns para os efeitos do Elementor
  const animMap: Record<string, string> = {
    'animate-fade': 'fadeIn',
    'animate-fadeIn': 'fadeIn',
    'animate-fadeInUp': 'fadeInUp',
    'animate-fadeInDown': 'fadeInDown',
    'animate-fadeInLeft': 'fadeInLeft',
    'animate-fadeInRight': 'fadeInRight',
    'animate-fadeInUpBig': 'fadeInUpBig',
    'animate-fadeInDownBig': 'fadeInDownBig',
    'animate-fadeInLeftBig': 'fadeInLeftBig',
    'animate-fadeInRightBig': 'fadeInRightBig',
    'animate-slideInUp': 'slideInUp',
    'animate-slideInDown': 'slideInDown',
    'animate-slideInLeft': 'slideInLeft',
    'animate-slideInRight': 'slideInRight',
    'animate-zoomIn': 'zoomIn',
    'animate-zoomInUp': 'zoomInUp',
    'animate-zoomInDown': 'zoomInDown',
    'animate-zoomInLeft': 'zoomInLeft',
    'animate-zoomInRight': 'zoomInRight',
    'animate-flipInX': 'flipInX',
    'animate-flipInY': 'flipInY',
    'animate-bounce': 'bounce',
    'animate-pulse': 'pulse',
    'animate-rubberBand': 'rubberBand',
    'animate-shake': 'shake',
    'animate-swing': 'swing',
    'animate-tada': 'tada',
    'animate-wobble': 'wobble',
    'animate-jello': 'jello',
    'animate-heartBeat': 'heartBeat',
  }
  const animClass = classGroup.find(c => c.startsWith('animate-'))
  if (animClass && animMap[animClass]) {
    css.animation = animMap[animClass]
  } else if (animClass) {
    // Se não encontrar no mapa, salva o nome da animação para usar em widget HTML
    css.animation = animClass
  }

  return css
}

/**
 * Extrai CSS de classes Tailwind e estilos inline, incluindo valores responsivos!
 * @param classes - Classes do elemento (string)
 * @param inlineStyles - Estilos inline (Record<string, string>)
 * @returns Objeto com CSS extraído estruturado (incluindo responsive)
 */
export function extractCSS(classes: string = '', inlineStyles: Record<string, string> = {}): ExtractedCSS {
  const classList = classes.split(/\s+/).filter(Boolean)

  // Separa as classes por breakpoint
  const baseClasses = classList.filter(c => !c.includes(':'))
  const smClasses = classList.filter(c => c.startsWith('sm:')).map(c => c.replace('sm:', ''))
  const mdClasses = classList.filter(c => c.startsWith('md:')).map(c => c.replace('md:', ''))
  const lgClasses = classList.filter(c => c.startsWith('lg:')).map(c => c.replace('lg:', ''))
  const xlClasses = classList.filter(c => c.startsWith('xl:')).map(c => c.replace('xl:', ''))
  const twoXlClasses = classList.filter(c => c.startsWith('2xl:')).map(c => c.replace('2xl:', ''))

  const css = extractCSSFromClassGroup(baseClasses)

  // Adiciona estilos inline ao base (tem prioridade)
  if (inlineStyles.color) (css.colors = css.colors || {}).text = inlineStyles.color
  if (inlineStyles['background-color']) (css.colors = css.colors || {}).bg = inlineStyles['background-color']
  if (inlineStyles['border-color']) (css.colors = css.colors || {}).border = inlineStyles['border-color']
  if (inlineStyles['border-width']) (css.border = css.border || {}).width = inlineStyles['border-width']
  if (inlineStyles['border-radius']) (css.border = css.border || {}).radius = inlineStyles['border-radius']
  if (inlineStyles['box-shadow']) css.shadow = inlineStyles['box-shadow']
  if (inlineStyles['font-size']) (css.typography = css.typography || {}).fontSize = inlineStyles['font-size']
  if (inlineStyles['font-weight']) (css.typography = css.typography || {}).fontWeight = inlineStyles['font-weight']
  if (inlineStyles['line-height']) (css.typography = css.typography || {}).lineHeight = inlineStyles['line-height']
  if (inlineStyles['letter-spacing']) (css.typography = css.typography || {}).letterSpacing = inlineStyles['letter-spacing']
  if (inlineStyles.opacity) css.opacity = inlineStyles.opacity

  // --- Background Image / Gradient ---
  if (inlineStyles['background-image']) {
    const bgImgMatch = inlineStyles['background-image'].match(BG_IMAGE_URL_REGEX)
    const gradientMatch = inlineStyles['background-image'].match(GRADIENT_REGEX)
    if (gradientMatch) {
      css.gradient = gradientMatch[0]
    } else if (bgImgMatch) {
      css.bgImage = bgImgMatch[1]
    }
  }

  // Processa breakpoints responsivos
  css.responsive = {}
  if (smClasses.length > 0) {
    css.responsive.sm = extractCSSFromClassGroup(smClasses)
  }
  if (mdClasses.length > 0) {
    css.responsive.md = extractCSSFromClassGroup(mdClasses)
  }
  if (lgClasses.length > 0) {
    css.responsive.lg = extractCSSFromClassGroup(lgClasses)
  }
  if (xlClasses.length > 0) {
    css.responsive.xl = extractCSSFromClassGroup(xlClasses)
  }
  if (twoXlClasses.length > 0) {
    css.responsive["2xl"] = extractCSSFromClassGroup(twoXlClasses)
  }

  return css
}

/**
 * Extrai uma cor de uma classe Tailwind (ex: text-yellow-400, bg-[#EAB308], etc.)
 */
export function extractColorFromClass(className: string): string | undefined {
  // Primeiro, verifica se é uma cor customizada: text-[#EAB308]
  const bracketMatch = className.match(/\[#([0-9a-fA-F]{3,8})\]/)
  if (bracketMatch) {
    return `#${bracketMatch[1]}`
  }
  // Verifica cores padrão
  if (className.includes('white')) return '#FFFFFF'
  if (className.includes('black')) return '#000000'
  if (className.includes('yellow') || className.includes('gold')) return '#EAB308'
  if (className.includes('gray')) {
    const shadeMatch = className.match(/gray-(\d+)/)
    if (shadeMatch) {
      const shade = shadeMatch[1]
      const grayMap: Record<string, string> = {
        '50': '#F9FAFB', '100': '#F3F4F6', '200': '#E5E7EB', '300': '#D1D5DB',
        '400': '#9CA3AF', '500': '#6B7280', '600': '#4B5563', '700': '#374151',
        '800': '#1F2937', '900': '#111827',
      }
      return grayMap[shade]
    }
  }
  if (className.includes('zinc')) {
    const shadeMatch = className.match(/zinc-(\d+)/)
    if (shadeMatch) {
      const shade = shadeMatch[1]
      const zincMap: Record<string, string> = {
        '50': '#F9FAFB', '100': '#F4F4F5', '200': '#E4E4E7', '300': '#D4D4D8',
        '400': '#A1A1AA', '500': '#71717A', '600': '#52525B', '700': '#3F3F46',
        '800': '#27272A', '900': '#18181B', '950': '#09090B',
      }
      return zincMap[shade]
    }
  }
  return undefined
}

function mapTailwindFontSize(key: string): string {
  const scale: Record<string, string> = {
    'xs': '12px', 'sm': '14px', 'base': '16px', 'lg': '18px', 'xl': '20px',
    '2xl': '24px', '3xl': '30px', '4xl': '36px', '5xl': '48px', '6xl': '60px',
  }
  return scale[key] || key
}

function mapTailwindFontWeight(key: string): string {
  const scale: Record<string, string> = {
    'thin': '100', 'light': '300', 'normal': '400', 'medium': '500',
    'semibold': '600', 'bold': '700', 'extrabold': '800', 'black': '900',
  }
  return scale[key] || key
}

function mapTailwindLetterSpacing(key: string): string {
  const scale: Record<string, string> = {
    'tighter': '-0.05em', 'tight': '-0.025em', 'normal': '0em',
    'wide': '0.025em', 'wider': '0.05em', 'widest': '0.1em',
  }
  return scale[key] || key
}

export interface PageAssets {
  css: string
  fontLinks: string
}

export function extractPageAssets(html: string): PageAssets {
  let css = ''
  let fontLinks = ''
  // Extrai estilos inline
  const styleMatches = html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)
  for (const match of styleMatches) {
    css += match[1]
  }
  // Extrai links de fontes
  const linkMatches = html.matchAll(/<link[^>]*rel=["'](?:stylesheet|preload)["'][^>]*>/gi)
  for (const match of linkMatches) {
    if (match[0].includes('font')) {
      fontLinks += match[0]
    }
  }
  return { css, fontLinks }
}
