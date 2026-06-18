# 05_ARCHITECTURE.md — Estrutura Técnica
> Fonte: `prompts/ARCHITECTURE.md` | Status: **Estável** | Sempre consultar antes de alterações

---

## Fluxo de Conversão (CREATE MODE)

```
Entrada
  ├── HTML (texto / arquivo / drag-drop)
  ├── ZIP (múltiplos HTMLs + imagens)
  └── IMAGEM (screenshot / mockup)
         │
  [1]  UPLOAD HANDLER
       zip-handler.ts · image-analyzer.ts
         │
  [2]  PARSER
       html-parser.ts → LayoutNode[]
         │
  [3]  SECTION DETECTOR
       section-detector.ts → Section[] (com deduplicação #2, #3)
         │
  [4]  TOKEN RESOLVER
       token-resolver.ts → substitui {{WHATSAPP_LINK}}, {{EMAIL_CONTATO}}, etc.
         │
  [5]  ELEMENTOR MAPPER
       elementor-mapper.ts → ElementorElement[]
         │
  [6]  ELEMENTOR EXPORTER
       elementor-exporter.ts → JSON string (version 0.4)
         │
  [7]  VALIDATOR
       validator.ts → ValidationResult
         │
  [8]  STRUCTURAL VALIDATOR + CORRECTOR
       structural-validator.ts → StructuralReport
       structural-corrector.ts → correção automática (até 3x)
         │
  [9]  VISUAL VALIDATOR
       visual-validator.ts → VisualValidationResult
         │
  [10] QUALITY GATE
       quality-gate.ts → QualityGateResult (score geral)
         │
  DOWNLOAD / CLIPBOARD
  page.json · header.json · hero.json · services.json · faq.json · footer.json · sections.zip
```

---

## Grafo de Dependências

```
types/ ──────────────────────────────────────────────────────────────────────┐
  elementor.types.ts ← elementor-mapper.ts, elementor-exporter.ts, patcher  │
  layout.types.ts    ← html-parser.ts, section-detector.ts, elementor-mapper │
  app.types.ts       ← useConversion.ts, SectionCard, OutputPanel           │
  snapshot.types.ts  ← page-snapshot.ts, snapshot-diff.ts, snapshot-patcher │
  validation.types.ts← structural-validator.ts, visual-validator.ts, QG     │
  vision.types.ts    ← vision-registry.ts, providers/                       │
                                                                             │
utils/                                                                       │
  generateId.ts ← html-parser.ts, elementor-mapper.ts, snapshot-patcher.ts  │
  formatBytes.ts ← UploadPanel                                               │
  syntaxHighlight.ts ← JsonViewer                                            │
  downloadFile.ts ← OutputPanel, SectionCard                                 │
  base64.ts ← zip-handler.ts                                                 │
  elementor-utils.ts ← elementor-mapper.ts                                   │
  provider-utils.ts ← providers/                                             │
                                                                             │
services/ (camada de lógica pura — sem React)                                │
  html-parser.ts                                                             │
  section-detector.ts ← html-parser.ts                                      │
  token-resolver.ts                                                          │
  elementor-mapper.ts ← section-detector.ts, elementor-utils.ts             │
  elementor-exporter.ts ← elementor-mapper.ts, validator.ts                 │
  validator.ts                                                               │
  page-snapshot.ts ← elementor.types.ts, snapshot.types.ts                  │
  snapshot-diff.ts ← page-snapshot.ts                                       │
  snapshot-patcher.ts ← snapshot-diff.ts                                    │
  structural-validator.ts ← page-snapshot.ts, validation.types.ts           │
  structural-corrector.ts ← structural-validator.ts                         │
  visual-validator.ts ← page-snapshot.ts, validation.types.ts               │
  quality-gate.ts ← validation.types.ts                                     │
  ai-refiner.ts ← providers/                                                │
  vision-registry.ts ← providers/                                           │
  zip-handler.ts ← base64.ts                                                │
  image-analyzer.ts (Canvas API)                                            │
                                                                             │
hooks/                                                                       │
  useConversion.ts ← TODOS os services/, TODOS os types/                    │
  useHistory.ts ← app.types.ts, localStorage                               │
  useTokens.ts ← app.types.ts                                               │
                                                                             │
components/ ← hooks/, types/, utils/                                        │
  App.tsx ← useConversion, useTokens, UploadPanel, AnalysisPanel, OutputPanel│
```

---

## Módulos e Responsabilidades

| Módulo | Responsabilidade | Entrada → Saída |
|---|---|---|
| `html-parser.ts` | HTML string → árvore DOM | `string` → `LayoutNode[]` |
| `section-detector.ts` | Classificar nós em seções nomeadas | `LayoutNode[]` → `Section[]` |
| `token-resolver.ts` | Substituir tokens `{{...}}` | `string, TokenMap` → `string` |
| `elementor-mapper.ts` | Mapear seções para Elementor | `Section[]` → `ElementorElement[]` |
| `elementor-exporter.ts` | Montar JSON final v0.4 | `ElementorElement[]` → `string` |
| `validator.ts` | Validar estrutura básica | `ElementorTemplate` → `ValidationResult` |
| `page-snapshot.ts` | Criar snapshot estrutural | `ElementorTemplate` → `PageSnapshot` |
| `snapshot-diff.ts` | Comparar dois snapshots | `PageSnapshot, PageSnapshot` → `PageDiff` |
| `snapshot-patcher.ts` | Aplicar diff cirurgicamente | `ElementorTemplate, PageDiff` → `ElementorTemplate` |
| `structural-validator.ts` | Validação profunda pós-geração | `ET, ET` → `StructuralReport` |
| `structural-corrector.ts` | Auto-correção de violações | `ET, ET, StructuralReport` → `ET` |
| `visual-validator.ts` | Validação visual (cores, tipografia, layout, media) | `ET, mode, ET?` → `VisualValidationResult` |
| `quality-gate.ts` | Gate central de qualidade | `{mode, validation, ...}` → `QualityGateResult` |
| `ai-refiner.ts` | Chama Worker /refine | `string, string` → `string` |
| `vision-registry.ts` | Orquestra providers de Vision AI | `File` → `UIAnalysisResult` |
| `zip-handler.ts` | Abrir/extrair arquivos ZIP | `File` → `{name, content}[]` |
| `image-analyzer.ts` | Canvas API → análise de imagem | `File` → `SectionEstimate[]` |

---

## Entidades TypeScript Principais

### `LayoutNode`
```ts
interface LayoutNode {
  id: string;           // hex 8 chars
  type: NodeType;       // container | heading | text-editor | image | button | icon-list | ...
  tag: string;          // tag HTML original
  children: LayoutNode[];
  attributes: Record<string, string>;
  textContent?: string;
  styles?: Record<string, string>;
  rawHtml?: string;     // HTML bruto preservado (usado por refineSection)
}
```

### `Section`
```ts
interface Section {
  id: string;
  name: string;         // "header" | "hero" | "services" | "cases" | "faq" | "cta" | "footer"
  label: string;        // "Cabeçalho / Nav" | "Cabeçalho / Nav #2"
  confidence: number;   // 0–1
  nodes: LayoutNode[];
  outputFile: string;   // "header.json" | "header-2.json"
}
```

### `ElementorTemplate`
```ts
interface ElementorTemplate {
  title: string;
  type: "page" | "header" | "footer" | "popup" | "post" | "error-404";
  version: "0.4";       // imutável
  page_settings: Record<string, unknown> | [];
  content: ElementorElement[];
}
```

### `SectionExport`
```ts
interface SectionExport {
  section: Section;
  template: ElementorTemplate;
  validation: ValidationResult;
}
```

### `ConversionStatus`
```ts
type ConversionStatus =
  | 'idle' | 'parsing' | 'mapping'
  | 'refining'       // aguarda Worker /refine
  | 'snapshotting' | 'diffing' | 'patching' | 'validating' | 'correcting'
  | 'done' | 'error'
```

### `ConversionResult`
```ts
interface ConversionResult {
  sections: Section[]
  exports: SectionExport[]
  nodeStats: Record<string, number>
  pageJson: string
  extractedImages: ExtractedImage[]
  uiAnalysis?: UIAnalysisResult    // VISION MODE apenas
  snapshot?: PageSnapshot           // EDIT MODE apenas
  diff?: PageDiff                   // EDIT MODE apenas
  evolvedFrom?: string              // EDIT MODE apenas
  structuralReport?: StructuralReport
  visualValidation?: VisualValidationResult
  qualityGateResult?: QualityGateResult
}
```

---

## Estrutura de Pastas

```
src/
  components/
    UploadPanel/         ← coluna esquerda: input HTML/ZIP/IMAGEM
    AnalysisPanel/       ← coluna central: estatísticas e árvore
    OutputPanel/         ← coluna direita: JSON + preview
    ConfigDashboard/     ← painel de tokens dinâmicos
    JsonViewer/          ← syntax highlight do JSON
    SectionCard/         ← card por seção com botões (Eye, Wand2, Download)
    SectionPreview/      ← modal de preview por iframe (createPortal)
  services/              ← lógica pura (sem React, testável)
  hooks/
    useConversion.ts     ← orquestra todos os 4 modos
    useHistory.ts        ← localStorage
    useTokens.ts         ← estado dos tokens
  utils/                 ← funções puras (zero dependência do projeto)
  types/                 ← interfaces TypeScript
```

---

## Decisões Técnicas Registradas

| Decisão | Motivo |
|---|---|
| `section → column → widget(html)` para layouts Tailwind | Preserva 100% do CSS sem mapear widget por widget |
| `<style>` isolado em cada widget HTML | Funciona sem depender do tema WordPress |
| localStorage para histórico | Interface idêntica à futura API — migração sem refatoração |
| Deploy FTP (Hostinger) | Simplicidade e custo — suficiente para V1 |
| Snapshot/diff/patch em vez de reescrita | Preservação máxima de IDs e settings |
| Quality Gate com warnings não bloqueantes | Métricas sem risco de regressão; thresholds apertáveis |
| Visual Validator sem browser | Validação em CI sem dependência de DOM |
| DOMParser nativo (sem cheerio/jsdom) | Zero dependência extra no bundle |
| `refineSection` isolado de `status` global | Spinner por card sem poluir máquina de estados principal |

---

## Pontos de Manutenção Frequente

| O que mudar | Onde mexer |
|---|---|
| Novo tipo de widget Elementor | `elementor-mapper.ts` + `elementor.types.ts` |
| Nova heurística de seção | `section-detector.ts` |
| Novo token dinâmico | `token-resolver.ts` + `app.types.ts` |
| Mudança no formato JSON Elementor | `elementor-exporter.ts` + `validator.ts` |
| Nova análise de imagem | `image-analyzer.ts` |
| Novo componente de UI | `src/components/NomeComponente/` |
| Nova verificação estrutural | `structural-validator.ts` |
| Nova estratégia de auto-correção | `structural-corrector.ts` |
| Nova dimensão de comparação visual | `visual-validator.ts` |
| Ajuste de thresholds de qualidade | `quality-gate.ts` |
