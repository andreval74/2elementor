# Plano: WebKeeper Elementor Exporter — MVP Completo

## Context

O usuário quer construir o sistema descrito nos arquivos da pasta `prompts/`: uma aplicação web que converte HTML/ZIP/imagens em JSON compatível com Elementor (WordPress). O projeto é o **WebKeeper Elementor Exporter**, um MVP com interface dark mode premium em 3 colunas, pipeline de 8 etapas de conversão, e deploy via GitHub Actions + FTP Hostinger.

A pasta `C:\Users\User\Desktop\cafe\2elementor` está vazia (apenas contém a pasta `prompts/` com a documentação). O sistema precisa ser criado do zero.

---

## Stack

- React 19 + TypeScript (strict)
- Tailwind CSS v3
- Vite
- Lucide Icons
- JSZip
- Deploy: GitHub Actions → FTP Hostinger

---

## Estrutura de arquivos a criar

```
2elementor/
├── .github/workflows/deploy.yml
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── CHANGELOG.md
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   ├── elementor.types.ts
    │   ├── layout.types.ts
    │   └── app.types.ts
    ├── utils/
    │   ├── generateId.ts
    │   ├── formatBytes.ts
    │   ├── syntaxHighlight.ts
    │   └── downloadFile.ts
    ├── services/
    │   ├── html-parser.ts
    │   ├── section-detector.ts
    │   ├── token-resolver.ts
    │   ├── elementor-mapper.ts
    │   ├── elementor-exporter.ts
    │   ├── image-analyzer.ts
    │   ├── zip-handler.ts
    │   └── validator.ts
    ├── hooks/
    │   ├── useConversion.ts
    │   ├── useHistory.ts
    │   └── useTokens.ts
    └── components/
        ├── UploadPanel/
        │   └── index.tsx
        ├── AnalysisPanel/
        │   └── index.tsx
        ├── OutputPanel/
        │   └── index.tsx
        ├── ConfigDashboard/
        │   └── index.tsx
        ├── JsonViewer/
        │   └── index.tsx
        └── SectionCard/
            └── index.tsx
```

---

## Regra adicionada ao DEVELOPMENT_RULES.md

**Arquivo:** `prompts/DEVELOPMENT_RULES.md`

**Onde inserir 1 — Princípios fundamentais** (expandir o DRY existente):
```
- **DRY total — zero repetição de funções e arquivos**: nenhuma função pode existir
  em mais de um lugar no projeto. Se uma lógica aparece duas vezes, ela vira uma
  função em `utils/` ou `services/` e é importada onde for necessário.
  O mesmo vale para trechos de markup, constantes e configurações.
  Usar sempre `import` (equivalente ao `include` do PHP) para reaproveitar código
  entre módulos — nunca copiar e colar. Facilita manutenção: corrigir em um lugar
  corrige em todo o sistema.
```

**Onde inserir 2 — Regras de código** (nova regra #7):
```
7. **Modularização obrigatória via import/export**:
   - Toda função usada em mais de um arquivo DEVE estar em `utils/` ou `services/`
   - Toda constante compartilhada DEVE estar em `utils/constants.ts`
   - Todo tipo/interface compartilhado DEVE estar em `types/`
   - Proibido duplicar código entre componentes — extrair para hook ou util
   - Padrão de verificação antes de criar qualquer função:
     1. Procurar em `utils/`, `services/`, `hooks/` se já existe algo equivalente
     2. Se existe: importar — nunca recriar
     3. Se não existe: criar no módulo correto e exportar para reuso futuro
   - Comentar com `// [REUSE]: importado de utils/X` quando não for óbvio
```

**Onde inserir 3 — Checklist antes de qualquer entrega** (novo item):
```
- [ ] Nenhuma função duplicada (`grep` confirma que cada nome de função aparece
      em apenas um arquivo de definição)
- [ ] Todos os imports estão resolvidos (sem copiar código entre arquivos)
```

---

## Ordem de implementação

### Fase 0 — Documentação (ANTES do código)
0. Atualizar `prompts/DEVELOPMENT_RULES.md` com a regra de DRY total + modularização obrigatória (conforme seção acima)

### Fase 1 — Scaffolding
1. `package.json` com dependências (react 19, typescript, tailwind, vite, lucide-react, jszip)
2. `tsconfig.json` (strict mode)
3. `vite.config.ts`
4. `tailwind.config.js` + `postcss.config.js`
5. `index.html` com tema dark base
6. `.gitignore`, `.env.example`, `CHANGELOG.md`

### Fase 2 — Types (base de tudo)
7. `types/elementor.types.ts` — ElementorElement, ElementorTemplate, ElementorSettings
8. `types/layout.types.ts` — LayoutNode, Section, NodeType, SectionEstimate
9. `types/app.types.ts` — AppState, TokenMap, ValidationResult, ConversionHistory

### Fase 3 — Utils
10. `utils/generateId.ts` — hex 8 chars
11. `utils/formatBytes.ts`
12. `utils/syntaxHighlight.ts` — tokenizer simples para JSON
13. `utils/downloadFile.ts` — download .json e .zip

### Fase 4 — Services (pipeline de conversão)
14. `services/html-parser.ts` — HTML string → LayoutNode[] via DOMParser
15. `services/section-detector.ts` — heurísticas para detectar 8 tipos de seção
16. `services/token-resolver.ts` — substitui {{TOKEN}} no HTML
17. `services/elementor-mapper.ts` — LayoutNode → ElementorElement (section→column→widget html)
18. `services/elementor-exporter.ts` — monta JSON final version 0.4
19. `services/validator.ts` — valida estrutura, IDs únicos, profundidade ≤ 10
20. `services/zip-handler.ts` — JSZip wrapper (abrir/extrair/criar ZIP)
21. `services/image-analyzer.ts` — Canvas API → SectionEstimate[]

### Fase 5 — Hooks
22. `hooks/useTokens.ts` — estado dos tokens + substituição em tempo real
23. `hooks/useHistory.ts` — localStorage, últimas 5 conversões
24. `hooks/useConversion.ts` — orquestra o pipeline completo

### Fase 6 — Componentes UI
25. `components/JsonViewer/index.tsx` — syntax highlight (roxo/verde/laranja/azul)
26. `components/SectionCard/index.tsx` — card por seção com status + botões copy/download
27. `components/UploadPanel/index.tsx` — abas HTML|ZIP|IMAGEM, drag-drop, textarea, contador
28. `components/AnalysisPanel/index.tsx` — stats cards + árvore colapsável + badges de confiança
29. `components/OutputPanel/index.tsx` — aba JSON exportador + aba preview iframe
30. `components/ConfigDashboard/index.tsx` — modal com todos os tokens, preview do link WhatsApp

### Fase 7 — App principal
31. `src/App.tsx` — layout 3 colunas, teclas de atalho (Ctrl+Enter/S/Z), estado global
32. `src/main.tsx` + `src/index.css` (Tailwind base)

### Fase 8 — Deploy
33. `.github/workflows/deploy.yml`

---

## Design UI (dark mode premium)

- **Background:** `#0A0A0B` (quase preto)
- **Surface:** `#111113` + `#1A1A1E` (cards)
- **Border:** `#2A2A30` (sutil)
- **Gold accent:** `#EAB308` / `#FCD34D` (títulos, botões primários, badges)
- **Text:** `#F1F1F3` primary, `#8B8B96` muted
- **Success:** `#22C55E`, **Warning:** `#F59E0B`, **Error:** `#EF4444`
- **Font:** Inter (Google Fonts)
- Bordas arredondadas `rounded-xl`
- Glow gold nos elementos em foco: `box-shadow: 0 0 20px rgba(234,179,8,0.4)`
- Header com logo WebKeeper + badge "MVP v1.0"
- Scroll suave, transições CSS 300ms

---

## Detalhes críticos de implementação

### html-parser.ts
- Usar `DOMParser` do browser (sem deps externas)
- Mapear tags → NodeType: `section/div` → container, `h1-h6` → heading, `p/span` → text-editor, `img` → image, `a/button` → button, `ul/ol` → icon-list, `details` → accordion
- Preservar todos os atributos e classes Tailwind

### section-detector.ts
- Heurística por ordem + sinal HTML: `<header>/<nav>` → header, `<h1>+CTA` → hero, grid repetitiva → services, `<details>/<summary>` → faq, `<footer>` → footer
- Confidence score: 0.0–1.0
- Referência: 13 seções WebKeeper descritas no PROMPT.md

### elementor-mapper.ts
- Estratégia padrão: `section → column → widget(html)` para preservar 100% do CSS
- Injetar `<style>` com classes gold/glow no início de cada widget html
- Widgets nativos apenas para elementos simples sem Tailwind

### validator.ts
- Verificar: version === "0.4", type válido, content array, id/elType/settings/elements presentes, widgetType em widgets, IDs únicos, profundidade ≤ 10

### useConversion.ts
- Status: idle → parsing → mapping → done/error
- Pipeline: parseHtml → detectSections → resolveTokens → mapToElementor → exportJson → validate
- Cada seção gera seu próprio ElementorTemplate independente

---

## Verificação

1. `npm install` sem erros
2. `npm run dev` — app abre em localhost
3. Colar HTML de exemplo → clicar "Analisar" → ver seções detectadas na coluna central
4. Clicar "Converter" → JSON aparece na coluna direita com syntax highlight
5. Botão "Copiar JSON" → clipboard
6. Botão "Baixar .json" → download do arquivo
7. Botão "Baixar Todas (.zip)" → ZIP com todos os arquivos
8. Painel de configurações → preencher WhatsApp → JSON atualiza tokens em tempo real
9. Preview tab → iframe mostra HTML original
10. Atalhos: Ctrl+Enter converte, Ctrl+S baixa, Ctrl+Z limpa
11. `npm run build` → gera `dist/` sem erros TypeScript
