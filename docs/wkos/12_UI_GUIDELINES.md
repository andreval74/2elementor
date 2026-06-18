# 12_UI_GUIDELINES.md — Diretrizes de UI/UX
> Fonte: `src/index.css`, `tailwind.config.js`, componentes existentes | Status: **Estável**

---

## Design System

### Paleta de Cores (CSS Custom Properties)

```css
/* Backgrounds */
--brand-dark:    #0A0A0A;  /* background raiz */
--brand-surface: #111111;  /* cards, painéis */
--brand-card:    #161616;  /* cards internos */
--brand-elevated:#1A1A1A;  /* tooltips, dropdowns */

/* Bordas */
--brand-border:  rgba(255,255,255,0.08);  /* bordas sutis padrão */
--brand-border-gold: rgba(234,179,8,0.3); /* bordas de destaque */

/* Dourado (acento principal) */
--gold:      #EAB308;
--gold-dark: #CA8A04;
--gold-glow: rgba(234,179,8,0.15);

/* Texto */
--content-primary: rgba(255,255,255,0.95);  /* títulos */
--content-secondary:rgba(255,255,255,0.70); /* corpo */
--content-muted:   rgba(255,255,255,0.45);  /* metadados */
--content-disabled:rgba(255,255,255,0.25);  /* inativo */

/* Status */
--status-success: #22C55E;
--status-warning: #F59E0B;
--status-error:   #EF4444;
--status-info:    #3B82F6;
```

### Tokens Tailwind Customizados

```js
// tailwind.config.js
colors: {
  gold: '#EAB308',
  'gold-dark': '#CA8A04',
  'brand-dark': '#0A0A0A',
  'brand-surface': '#111111',
  'brand-border': 'rgba(255,255,255,0.08)',
}
fontFamily: {
  sans: ['Inter', 'sans-serif'],
}
```

---

## Classes Utilitárias WK

### Botões

```css
.wk-btn-icon {
  /* Botão ícone pequeno — Eye, Wand2, Download, Copy */
  padding: 4px;
  border-radius: 4px;
  color: rgba(255,255,255,0.45);
  transition: all 150ms;
}
.wk-btn-icon:hover {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.80);
}
.wk-btn-icon:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.wk-btn-primary {
  /* Botão de ação principal */
  background: linear-gradient(135deg, #EAB308, #CA8A04);
  color: #000;
  font-weight: 600;
  border-radius: 8px;
  padding: 8px 16px;
}
.wk-btn-secondary {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.80);
  border-radius: 8px;
}
```

### Cards

```css
.wk-card {
  background: #161616;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
}
.wk-card-hover:hover {
  border-color: rgba(255,255,255,0.14);
  background: #1A1A1A;
}
```

### Status Badges

```css
.wk-status-success { color: #22C55E; }
.wk-status-warning { color: #F59E0B; }
.wk-status-error   { color: #EF4444; }
.wk-status-info    { color: #3B82F6; }
.wk-status-idle    { color: rgba(255,255,255,0.45); }
```

---

## Layout: 3 Colunas

```
┌─────────────────────────────────────────────────────────────┐
│ Header (40px fixo)                                         │
├────────────────┬──────────────────┬────────────────────────┤
│ UploadPanel    │  AnalysisPanel   │     OutputPanel        │
│ (col-span-1)   │  (col-span-1)    │     (col-span-1)       │
│                │                  │                        │
│ - Input HTML   │ - Estatísticas   │ - JsonViewer           │
│ - Upload ZIP   │ - Árvore nodes   │ - SectionCard[]        │
│ - Upload Img   │ - TokenMap       │ - Download buttons     │
└────────────────┴──────────────────┴────────────────────────┘

Grid: grid grid-cols-3 gap-4 h-full overflow-hidden
Cada painel: flex flex-col overflow-hidden
```

**Limitação atual:** Layout não é responsivo. Em telas < 1024px as 3 colunas se sobrepõem.
Ver `governance/TECH_DEBT.md` → MEDIUM-001.

---

## Componentes Principais

### SectionCard
Exibe cada seção com 3 variantes visuais (compact, normal, expanded):
- Badge de tipo de seção (header/hero/services...)
- Botão Eye → abre `SectionPreview`
- Botão Wand2 → `onRefine()` + spinner `RefreshCw` quando `isRefining`
- Badge `×N` dourado quando `refineCount > 0`
- Botão Download → baixa JSON da seção
- Botão Copy → copia JSON para clipboard

### SectionPreview
Modal de preview via `createPortal(node, document.body)`:
- Renderiza HTML da seção em `<iframe sandbox="allow-same-origin allow-scripts">`
- Inclui Tailwind CDN + Inter font + brand color helpers no `srcdoc`
- Container `overflow-auto` (sem `overflow-hidden`)
- iframe com `height: 70vh` (não `h-full` — evita truncamento)
- ESC fecha + trava scroll do body

### JsonViewer
- Syntax highlight: roxo (keys), verde (strings), laranja (numbers), azul (booleans)
- Scroll interno: `overflow-auto h-full`
- Copia com feedback visual (ícone muda por 2s)

---

## Convenções de UX

| Padrão | Como implementar |
|---|---|
| Spinner de loading | `<RefreshCw className="animate-spin" />` (Lucide) |
| Badge de progresso | `×N` em `text-[9px] font-bold text-gold` |
| Modal/overlay | `createPortal(node, document.body)` — evita z-index/overflow |
| Notificação inline | Classe `.wk-status-*` dentro do componente pai |
| Botão desabilitado | `disabled` attr + `opacity-35 cursor-not-allowed` |
| Ícones | Lucide React — tamanho padrão `size={13}` em botões icon, `size={16}` em headers |

---

## Tipografia

| Uso | Classe Tailwind |
|---|---|
| Título de painel | `text-xs font-semibold text-white/60 uppercase tracking-wider` |
| Label de seção | `text-[11px] font-medium text-white/80` |
| Metadado | `text-[10px] text-white/40` |
| Badge | `text-[9px] font-bold` |
| Conteúdo JSON | `font-mono text-xs` |

---

## SectionPreview: srcdoc Template

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            gold: '#EAB308', 'gold-dark': '#CA8A04',
            'brand-dark': '#0A0A0A', 'brand-surface': '#111111',
            'brand-border': 'rgba(255,255,255,0.08)',
          },
          fontFamily: { sans: ['Inter', 'sans-serif'] }
        }
      }
    }
  </script>
</head>
<body class="bg-[#0A0A0A] text-white font-sans">
  ${html}
</body>
</html>
```

**Motivo do `sandbox="allow-same-origin allow-scripts"`:** O Tailwind CDN precisa de acesso ao DOM para injetar estilos — `allow-scripts` é obrigatório. `allow-same-origin` permite que o script leia o documento.
