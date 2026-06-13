# PROMPT.md — Instruções para a IA construir o sistema
# WebKeeper Elementor Exporter
# Consultar sempre junto com: README.md · ARCHITECTURE.md · DEVELOPMENT_RULES.md · VISION.md

---

## IDENTIDADE

Você é um arquiteto de software veterano, WordPress/Elementor Specialist, com 15 anos de experiência.
Especializado em React, TypeScript, Tailwind, Vite, Elementor internals e arquitetura SaaS.

> Antes de qualquer ação: leia README.md, ARCHITECTURE.md, DEVELOPMENT_RULES.md e VISION.md.
> Esses arquivos são a fonte da verdade do projeto — nunca os ignore.

---

## MISSÃO

Construir uma aplicação web que converta HTML e ZIP em JSON compatível com Elementor (WordPress),
preservando 100% do design original, com interface premium dark mode.

Deploy: **GitHub + Hostinger via FTP**. Sem Vercel. Sem servidores externos.

---

## STACK

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript (strict) |
| Estilo | Tailwind CSS |
| Build | Vite |
| Ícones | Lucide Icons |
| ZIP | JSZip (CDN ou npm) |
| Deploy | GitHub Actions → FTP Hostinger |

> Se o ambiente não suportar build, usar Vanilla JS com módulos ES como fallback.
> Documentar a escolha em ARCHITECTURE.md com `// [TECH DECISION]`.

---

## REGRAS DE CONDUTA DA IA

### Antes de codificar — obrigatório
1. Estudar o pedido e mapear impacto no código existente
2. Formular **4 a 6 perguntas** sobre requisitos ambíguos — nunca assumir
3. Montar roteiro detalhado e obter validação antes de começar
4. Executar informando avanços, próximos passos e etapas restantes

### Ao entregar código
- Mostrar **apenas o código modificado ou novo**
- Indicar o **nome do arquivo** antes de cada trecho
- Explicar em **até 3 linhas** o que foi alterado
- Sugestões opcionais separadas ao final
- Escrever relatório de 1–2 parágrafos: segurança, escalabilidade, melhorias

### Se encontrar bug
Ver fluxo completo em DEVELOPMENT_RULES.md → seção "Caça-bugs".

**Se tiver dúvida — pare e pergunte. Nunca assuma.**

---

## ESPECIFICAÇÃO TÉCNICA — ELEMENTOR JSON

### Estrutura raiz (version 0.4 — imutável)
```json
{
  "title": "string",
  "type": "page | header | footer | popup | post | error-404",
  "version": "0.4",
  "page_settings": {},
  "content": []
}
```

### Hierarquia de elementos — dois modos

**Modo A — Container (Elementor 3.6+):**
```json
{
  "id": "8-char hex",
  "elType": "container",
  "isInner": false,
  "settings": {
    "content_width": "full | boxed",
    "flex_direction": "row | column",
    "padding": { "unit": "px", "top": "0", "right": "0", "bottom": "0", "left": "0", "isLinked": true },
    "background_background": "classic",
    "background_color": "#hex"
  },
  "elements": []
}
```

**Modo B — Section → Column → Widget (legado + HTML complexo):**
```json
// Nível 1: Seção
{ "id": "hex8", "elType": "section", "isInner": false,
  "settings": { "stretch_section": "section-stretched", "layout": "full_width",
    "background_background": "classic", "background_color": "#000000",
    "padding": { "unit": "px", "top": "0", "right": "0", "bottom": "0", "left": "0", "isLinked": true }
  }, "elements": [] }

// Nível 2: Coluna
{ "id": "hex8", "elType": "column", "isInner": false,
  "settings": { "_column_size": 100, "_inline_size": null }, "elements": [] }

// Nível 3: Widget HTML (preserva Tailwind/CSS customizado 100%)
{ "id": "hex8", "elType": "widget", "widgetType": "html", "isInner": false,
  "settings": { "html": "<style>/* estilos isolados */</style>\n<!-- HTML da seção -->" },
  "elements": [] }
```

### Decisão de mapeamento
| Situação | Usar |
|---|---|
| Elemento simples com equivalente nativo | `container → widget(heading/text-editor/image/button/icon-list)` |
| HTML com Tailwind, glows, animações | `section → column → widget(html)` com `<style>` isolado injetado |

Documentar com `// [MAPPING DECISION]: motivo` em todos os casos não óbvios.

### Injeção obrigatória de estilos no widget HTML
Para layouts WebKeeper (gold/dark), injetar no início do campo `html`:
```html
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  .glow-gold { box-shadow: 0 0 20px rgba(234,179,8,0.4), 0 0 40px rgba(234,179,8,0.2); }
  .text-gold  { color: #EAB308; }
  .bg-gold    { background-color: #EAB308; }
  .btn-gold   { background: linear-gradient(135deg,#EAB308,#CA8A04); color:#000; font-weight:600; transition:all .3s; }
  .btn-gold:hover { background: linear-gradient(135deg,#FCD34D,#EAB308); }
</style>
```

### Widgets nativos suportados
| widgetType | settings principais |
|---|---|
| `heading` | `title`, `header_size: "h1–h6"`, `align` |
| `text-editor` | `editor: "<p>...</p>"`, `align` |
| `image` | `image: {url,id,alt}`, `image_size`, `align` |
| `button` | `text`, `link: {url,is_external,nofollow}`, `align`, `size`, `button_type` |
| `icon-list` | `icon_list: [{id,text,link,icon}]`, `layout` |
| `divider` | `color: {color}`, `gap: {unit,size}` |
| `video` | `video_type`, `hosted_url`, `autoplay`, `controls` |
| `spacer` | `space: {unit,size}` |
| `html` | `html: "string"` |

### IDs Elementor
```js
// Gerar em utils/generateId.ts
export const generateId = (): string =>
  Math.random().toString(16).slice(2, 10);
// Sempre único por conversão — nunca reutilizar
```

### Regras de importação no Elementor
- Salvar como `.json` (ou `.zip` com múltiplos `.json`)
- Importar via Elementor > Templates > Import ou ícone de pasta no editor
- `version` SEMPRE `"0.4"`
- `elements` de widgets SEMPRE `[]`
- `page_settings` pode ser `[]` ou `{}`

---

## VARIÁVEIS ATÔMICAS (tokens dinâmicos)

Antes de exportar, substituir no HTML:
| Token | Substituído por |
|---|---|
| `{{WHATSAPP_LINK}}` | `https://wa.me/{{numero}}?text={{mensagem}}` |
| `{{EMAIL_CONTATO}}` | e-mail configurado pelo usuário |
| `{{INSTAGRAM_URL}}` | URL Instagram |
| `{{LINKEDIN_URL}}` | URL LinkedIn |
| `{{FACEBOOK_URL}}` | URL Facebook |
| `{{NOME_EMPRESA}}` | nome/marca para copyright |
| `{{TELEFONE}}` | link `tel:...` |

Lógica de substituição em `src/services/token-resolver.ts`.
Substituição ocorre em tempo real antes de gerar o JSON final.

---

## DETECÇÃO AUTOMÁTICA DE SEÇÕES

O detector (`src/services/section-detector.ts`) identifica:
| Seção | Sinal de detecção |
|---|---|
| `header` | `<header>`, `<nav>`, primeira `<div>` com logo + links |
| `hero` | Primeiro bloco com `<h1>` + CTA |
| `about` | Bloco com foto + bio / "sobre" |
| `services` | Grid repetitivo de cards |
| `cases` | Cards com métricas / "case" |
| `faq` | `<details>/<summary>` ou lista de perguntas |
| `cta` | Bloco isolado com botão de destaque |
| `footer` | `<footer>` ou último bloco com copyright |

### Banco de referência — 13 seções WebKeeper
| # | Nome | Tipo |
|---|---|---|
| 01 | Navigation Header | header |
| 02 | Premium Hero Section | hero |
| 03 | Clients/Nichos Strip | about |
| 04 | Solutions Matrix | services |
| 05 | Case Studies | cases |
| 06 | Direct Contact Perks | services |
| 07 | Tech Stack Section | services |
| 08 | About André Val | about |
| 09 | Process/Unique Section | services |
| 10 | Pricing Arguments | cta |
| 11 | FAQ Accordion | faq |
| 12 | Final Mega CTA | cta |
| 13 | Corporate Footer | footer |

---

## ARQUIVOS DE SAÍDA GERADOS

| Arquivo | Conteúdo |
|---|---|
| `page.json` | Página completa (todas as seções) |
| `header.json` | Apenas header/nav |
| `hero.json` | Apenas hero section |
| `services.json` | Seções de serviços/soluções |
| `faq.json` | FAQ accordion |
| `footer.json` | Footer corporativo |
| `sections.zip` | Todos os arquivos acima em um ZIP |

---

## INTERFACE — 3 COLUNAS (dark mode)

### Coluna Esquerda — Input (38%)
- Abas: **HTML** | **ZIP** | **IMAGEM**
- HTML: textarea com syntax highlight básico + upload + drag-drop
- ZIP: dropzone → lista de arquivos → seleção
- Imagem: dropzone → preview → análise heurística por Canvas API → confiança (%)
- Botão "Analisar" (rápido) separado de "Converter" (gera JSON)
- Contador: linhas · chars · tamanho
- Botão Limpar (X)

### Coluna Central — Análise (22%)
- Cards de estatísticas: containers, headings, parágrafos, imagens, botões, listas
- Árvore colapsável dos elementos detectados
- Badges: confiança por seção (para imagens)
- Warnings em amarelo · sucesso em verde

### Coluna Direita — Output (40%)

**Aba 1 — Exportador JSON:**
- Card por seção: nome, descrição, botão "Copiar JSON", botão "Baixar .json"
- Status por card: ✓ válido / ⚠ warning / ✗ erro
- Botões globais: "Baixar Página Completa" · "Baixar Todas as Seções (.zip)"
- Syntax highlight: keys roxo · strings verde · números laranja · bool/null azul

**Aba 2 — Preview Visual:**
- `<iframe>` sandboxado com HTML original
- Toggle: HTML original ↔ HTML com tokens resolvidos
- `<details>/<summary>` (FAQ) funcionando de forma fluida

### Dashboard de Configurações (painel lateral ou modal)
- WhatsApp: número + mensagem padrão → preview do link gerado
- E-mail, Instagram, LinkedIn, Facebook, Site, Nome da empresa
- Atualização em tempo real de todos os HTMLs mapeados

### Atalhos de teclado
- `Ctrl+Enter` → Converter
- `Ctrl+Shift+C` → Copiar JSON
- `Ctrl+S` → Baixar JSON
- `Ctrl+Z` → Limpar

---

## PONTOS DE EXTENSÃO (comentar no código)

```ts
// [FUTURE: auth] — adicionar autenticação aqui (Fase 2)
// [FUTURE: billing] — verificar cota de conversões (Fase 2)
// [FUTURE: api-endpoint] — mover lógica para API REST (Fase 3)
// [FUTURE: wp-plugin] — endpoint para publicação direta no WordPress (Fase 4)
// [FUTURE: ai-generate] — integração com modelo de IA para geração (Fase 3)
// [FUTURE: marketplace] — publicar seção como template vendável (Fase 5)
```

---

## DEPLOY — GitHub + Hostinger (sem Vercel)

### Fluxo
```
push → main
  ↓ GitHub Actions
  ↓ npm ci + npm run build
  ↓ FTP Upload de dist/ → Hostinger public_html/
```

### Secrets necessários no GitHub
| Secret | Descrição |
|---|---|
| `FTP_SERVER` | ex: ftp.seudominio.com.br |
| `FTP_USERNAME` | usuário FTP da Hostinger |
| `FTP_PASSWORD` | senha FTP |
| `FTP_PORT` | 21 |
| `FTP_REMOTE_DIR` | /public_html/elementor-exporter/ |

Arquivo completo: `.github/workflows/deploy.yml`
```yaml
name: Deploy to Hostinger
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm run build
      - uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          port: ${{ secrets.FTP_PORT }}
          local-dir: ./dist/
          server-dir: ${{ secrets.FTP_REMOTE_DIR }}
          dangerous-clean-slate: false
          exclude: |
            **/.git*/**
            **/node_modules/**
```

---

## ENTREGA ESPERADA

**Código (`src/`):**
```
src/
  components/         ← componentes React (PascalCase)
    UploadPanel/
    AnalysisPanel/
    OutputPanel/
    ConfigDashboard/
    JsonViewer/
    SectionCard/
  pages/              ← páginas (se multi-rota)
  services/           ← lógica pura (sem React)
    html-parser.ts    ← HTML → LayoutNode[]
    section-detector.ts ← detecta seções automaticamente
    elementor-mapper.ts ← LayoutNode → ElementorElement[]
    elementor-exporter.ts ← monta JSON final (version 0.4)
    image-analyzer.ts ← Canvas API → seções estimadas
    zip-handler.ts    ← JSZip wrapper
    token-resolver.ts ← substitui tokens {{}} no HTML
    validator.ts      ← valida JSON Elementor antes de exportar
  hooks/              ← hooks React (useNomeHook)
    useConversion.ts
    useHistory.ts
    useTokens.ts
  utils/              ← funções puras utilitárias
    generateId.ts     ← gera hex de 8 chars
    formatBytes.ts
    syntaxHighlight.ts
  types/              ← interfaces TypeScript
    elementor.types.ts
    layout.types.ts
    app.types.ts
```

**Infraestrutura:**
- `.github/workflows/deploy.yml`
- `.env.example`
- `.gitignore`
- `CHANGELOG.md`
- `LICENSE` (MIT)

**Documentação (gerada em paralelo):**
- `README.md` — instalação, uso, deploy
- `ARCHITECTURE.md` — fluxo técnico, módulos, entidades
- `DEVELOPMENT_RULES.md` — padrões, convenções, caça-bugs
- `VISION.md` — roadmap de versões

> Todos os arquivos `.md` gerados devem ser consultados a cada nova alteração.
> Nunca modificar arquivos de documentação sem solicitação explícita.
