# ARCHITECTURE.md — Estrutura Técnica Interna
# WebKeeper Elementor Exporter
# Consultar sempre antes de qualquer alteração no código

---

## Fluxo de conversão

```
Entrada do usuário
  │
  ├── HTML (texto / arquivo / drag-drop)
  ├── ZIP (múltiplos HTMLs + imagens)
  └── IMAGEM (screenshot / mockup)
         │
         ▼
  [1] UPLOAD HANDLER
      src/services/zip-handler.ts        ← descompacta ZIP, lista arquivos
      src/services/image-analyzer.ts     ← Canvas API → análise heurística
         │
         ▼
  [2] PARSER
      src/services/html-parser.ts
      HTML string → LayoutNode[] (árvore intermediária)
         │
         ▼
  [3] SECTION DETECTOR
      src/services/section-detector.ts
      LayoutNode[] → Section[] (header/hero/services/cases/faq/cta/footer)
         │
         ▼
  [4] TOKEN RESOLVER
      src/services/token-resolver.ts
      Substitui {{WHATSAPP_LINK}}, {{EMAIL_CONTATO}}, {{INSTAGRAM_URL}} etc.
         │
         ▼
  [5] ELEMENTOR MAPPER
      src/services/elementor-mapper.ts
      Section[] → ElementorElement[] (container / section→column→widget)
         │
         ▼
  [6] ELEMENTOR EXPORTER
      src/services/elementor-exporter.ts
      ElementorElement[] → JSON string (version 0.4)
         │
         ▼
  [7] VALIDATOR
      src/services/validator.ts
      Valida estrutura antes de exibir/exportar
         │
         ▼
  [8] DOWNLOAD / CLIPBOARD
      page.json · header.json · hero.json · services.json · faq.json · footer.json · sections.zip
```

---

## Módulos

### `html-parser.ts`
**Responsabilidade:** converter string HTML em árvore `LayoutNode[]`.
**Entrada:** `string` (HTML bruto)
**Saída:** `LayoutNode[]`
**Dependências:** utils/generateId.ts
**Manutenção:** editar aqui para suportar novas tags HTML ou melhorar detecção de atributos inline.

### `section-detector.ts`
**Responsabilidade:** classificar nós da árvore em seções nomeadas.
**Entrada:** `LayoutNode[]`
**Saída:** `Section[]`
**Dependências:** html-parser.ts
**Manutenção:** editar aqui para adicionar novos tipos de seção ou melhorar heurísticas de detecção.

### `token-resolver.ts`
**Responsabilidade:** substituir tokens `{{...}}` no HTML pelo valor configurado pelo usuário.
**Entrada:** `string` (HTML), `TokenMap` (objeto de configurações)
**Saída:** `string` (HTML resolvido)
**Dependências:** nenhuma
**Manutenção:** editar aqui para adicionar novos tokens dinâmicos.

### `elementor-mapper.ts`
**Responsabilidade:** mapear `Section[]` para `ElementorElement[]`.
**Entrada:** `Section[]`
**Saída:** `ElementorElement[]`
**Dependências:** utils/generateId.ts, elementor.types.ts
**Manutenção:** editar aqui para adicionar suporte a novos widgetTypes ou melhorar o mapeamento HTML → Elementor.
**Decisão de mapeamento:**
- Elemento simples → widget nativo (heading, image, button, etc.)
- HTML com Tailwind/glows/animações → `section → column → widget(html)` com `<style>` injetado
- Documentar com `// [MAPPING DECISION]`

### `elementor-exporter.ts`
**Responsabilidade:** montar o JSON final Elementor (version 0.4).
**Entrada:** `ElementorElement[]`, `title: string`, `type: string`
**Saída:** `string` (JSON válido)
**Dependências:** validator.ts
**Manutenção:** editar aqui se a versão do formato Elementor mudar.

### `validator.ts`
**Responsabilidade:** validar a estrutura do JSON Elementor antes de exibir/exportar.
**Verifica:**
- `version === "0.4"`
- `type` é valor válido (page/header/footer/popup/post/error-404)
- `content` é array
- Cada elemento tem `id`, `elType`, `settings`, `elements`
- Widgets têm `widgetType`
- IDs são únicos
- Profundidade máxima ≤ 10
**Saída:** `ValidationResult { valid: boolean, errors: string[], warnings: string[] }`

### `zip-handler.ts`
**Responsabilidade:** abrir arquivos ZIP, listar conteúdo, extrair HTML selecionado.
**Dependências:** JSZip
**Manutenção:** editar aqui se precisar suportar outros formatos compactados.

### `image-analyzer.ts`
**Responsabilidade:** analisar imagem via Canvas API e estimar seções.
**Heurísticas:**
- Faixa escura no topo → header
- Bloco com contraste alto → hero / heading
- Grade repetitiva → services / cards
- Bloco com formulário → cta / contact
- Faixa escura no rodapé → footer
**Saída:** `SectionEstimate[] { type, confidence: number (0–1) }`
**Manutenção:** editar aqui para melhorar a acurácia da análise visual.

---

## Entidades (tipos TypeScript)

### `LayoutNode`
Nó intermediário da árvore DOM parseada.
```ts
interface LayoutNode {
  id: string;           // hex 8 chars
  type: NodeType;       // container | heading | text-editor | image | button | icon-list | ...
  tag: string;          // tag HTML original (section, div, h1, p, img...)
  children: LayoutNode[];
  attributes: Record<string, string>;
  textContent?: string;
  styles?: Record<string, string>; // estilos inline parseados
}
```

### `Section`
Seção detectada automaticamente.
```ts
interface Section {
  id: string;
  name: string;          // "header" | "hero" | "services" | "cases" | "faq" | "cta" | "footer"
  label: string;         // nome amigável para exibição
  confidence: number;    // 0–1 (para análise de imagem)
  nodes: LayoutNode[];
  outputFile: string;    // "header.json" | "hero.json" etc.
}
```

### `ElementorElement`
Elemento do JSON final Elementor.
```ts
interface ElementorElement {
  id: string;            // hex 8 chars — único por conversão
  elType: "container" | "section" | "column" | "widget";
  widgetType?: string;   // apenas para elType === "widget"
  isInner: boolean;
  settings: Record<string, unknown>;
  elements: ElementorElement[];
}
```

### `ElementorTemplate`
Documento JSON completo pronto para importar.
```ts
interface ElementorTemplate {
  title: string;
  type: "page" | "header" | "footer" | "popup" | "post" | "error-404";
  version: "0.4";        // imutável
  page_settings: Record<string, unknown> | [];
  content: ElementorElement[];
}
```

### `TokenMap`
Configurações do usuário para substituição dinâmica.
```ts
interface TokenMap {
  WHATSAPP_LINK: string;   // número completo com DDD
  WHATSAPP_MSG: string;    // mensagem padrão
  EMAIL_CONTATO: string;
  INSTAGRAM_URL: string;
  LINKEDIN_URL: string;
  FACEBOOK_URL: string;
  NOME_EMPRESA: string;
  TELEFONE: string;
}
```

### `ValidationResult`
Resultado da validação do JSON.
```ts
interface ValidationResult {
  valid: boolean;
  errors: string[];    // impedem exportação
  warnings: string[];  // alertas não bloqueantes
}
```

### `AppState`
Estado global da aplicação (único objeto de estado).
```ts
interface AppState {
  inputType: "html" | "zip" | "image";
  rawHtml: string;
  sections: Section[];
  tokens: TokenMap;
  conversionResult: ElementorTemplate | null;
  validationResult: ValidationResult | null;
  history: ConversionHistory[];  // últimas 5 conversões (localStorage)
  status: "idle" | "parsing" | "mapping" | "done" | "error";
}
```

---

## Estrutura de pastas

```
src/
  components/
    UploadPanel/         ← coluna esquerda: input HTML/ZIP/IMAGEM
    AnalysisPanel/       ← coluna central: estatísticas e árvore
    OutputPanel/         ← coluna direita: JSON + preview
    ConfigDashboard/     ← painel de tokens dinâmicos
    JsonViewer/          ← syntax highlight do JSON
    SectionCard/         ← card por seção com botões de exportação
  pages/                 ← páginas (se multi-rota futura)
  services/              ← lógica pura de conversão (sem React, testável)
    html-parser.ts
    section-detector.ts
    elementor-mapper.ts
    elementor-exporter.ts
    image-analyzer.ts
    zip-handler.ts
    token-resolver.ts
    validator.ts
  hooks/
    useConversion.ts     ← orquestra o fluxo completo
    useHistory.ts        ← localStorage (preparado para banco de dados)
    useTokens.ts         ← estado dos tokens e substituição em tempo real
  utils/
    generateId.ts        ← hex de 8 chars únicos
    formatBytes.ts       ← exibição de tamanho de arquivo
    syntaxHighlight.ts   ← highlight do JSON output
    downloadFile.ts      ← download de .json e .zip
  types/
    elementor.types.ts   ← ElementorElement, ElementorTemplate, ElementorSettings
    layout.types.ts      ← LayoutNode, Section, NodeType
    app.types.ts         ← AppState, TokenMap, ValidationResult, ConversionHistory
```

---

## Decisões técnicas registradas

| Data | Decisão | Motivo |
|---|---|---|
| — | Usar `section → column → widget(html)` para layouts Tailwind complexos | Preserva 100% do CSS sem mapear widget por widget |
| — | Injetar `<style>` isolado em cada widget HTML | Garante funcionamento sem depender do tema WordPress |
| — | localStorage para histórico (Fase 1) | Interface idêntica à futura API — migração sem refatoração |
| — | Deploy via FTP na Hostinger (sem Vercel) | Simplicidade e custo — suficiente para Fase 1 |

> Adicionar novas linhas aqui a cada decisão técnica relevante.
> Usar `// [TECH DECISION]: motivo` no código correspondente.

---

## Pontos de manutenção frequente

| O que mudar | Onde mexer |
|---|---|
| Novo tipo de widget Elementor | `elementor-mapper.ts` + `elementor.types.ts` |
| Nova heurística de seção | `section-detector.ts` |
| Novo token dinâmico | `token-resolver.ts` + `app.types.ts` (TokenMap) |
| Mudança no formato JSON Elementor | `elementor-exporter.ts` + `validator.ts` |
| Nova análise de imagem | `image-analyzer.ts` |
| Novo componente de UI | `src/components/NomeComponente/` |
| Novo arquivo de saída (.json) | `elementor-exporter.ts` + `PROMPT.md` tabela de arquivos |
