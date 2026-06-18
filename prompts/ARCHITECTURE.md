# ARCHITECTURE.md — Estrutura Técnica Interna
# WebKeeper Elementor Exporter
# Consultar sempre antes de qualquer alteração no código
# Documentação de referência: PROMPT.md · DEVELOPMENT_RULES.md · VISION.md · PAGE_EVOLUTION.md

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
      Valida estrutura básica (version, IDs únicos, hierarquia ≤ 10)
         │
         ▼
  [8] VISUAL VALIDATOR
      src/services/visual-validator.ts
      Em CREATE: self-audit de completude (headings, widgets mínimos)
      Em EDIT/REFINE: compara cores, tipografia, layout e media vs. original
         │
         ▼
  [9] QUALITY GATE
      src/services/quality-gate.ts
      Score geral = structural×50% + visual×30% + confidence×20%
      Thresholds por modo · blockers bloqueiam · warnings apenas logados
         │
         ▼
  [10] DOWNLOAD / CLIPBOARD
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
**Responsabilidade:** classificar nós da árvore em seções nomeadas com labels baseados no conteúdo.
**Entrada:** `LayoutNode[]`
**Saída:** `Section[]` — cada seção com `contentTitle` extraído e `label` no formato `"{ShortPrefix} — {ContentTitle}"`.
**Dependências:** html-parser.ts, utils/constants.ts (`SECTION_SHORT_LABELS`)
**Manutenção:**
- Heurísticas de tipo de seção: funções `scoreHeader`, `scoreHero`, etc.
- Extração de título: `extractContentTitle()` — prioridade H1 → H2 → heading → botão/link → parágrafo.
- `findFirstNodeByTag(node, tag)` e `truncateText(text, max)` exportados para reuso em testes.
- `SECTION_SHORT_LABELS` em constants.ts define prefixos curtos para labels compostos.
- Nunca gerar labels técnicos como "Header #3" ou "Services #2" — label sempre reflete conteúdo real.

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

### `page-snapshot.ts`
**Responsabilidade:** criar `PageSnapshot` a partir de `ElementorTemplate`, `ElementorElement[]` ou `UIAnalysisResult`.
**Entrada:** `ElementorTemplate` | `ElementorElement[]` | `UIAnalysisResult`
**Saída:** `PageSnapshot`
**Dependências:** snapshot.types.ts, elementor.types.ts, vision.types.ts, utils/generateId.ts
**Manutenção:** editar aqui para melhorar heurísticas de `inferSectionType` ou adicionar campos ao snapshot.

### `snapshot-diff.ts`
**Responsabilidade:** comparar dois `PageSnapshot` e produzir um `PageDiff` com operações atômicas mínimas.
**Entrada:** `PageSnapshot` (original), `PageSnapshot` (atualizado), `scope?: string`
**Saída:** `PageDiff`
**Dependências:** snapshot.types.ts, elementor.types.ts
**Manutenção:** editar aqui para melhorar o algoritmo de matching de seções/widgets ou adicionar `DiffOperationType`.

### `snapshot-patcher.ts`
**Responsabilidade:** aplicar um `PageDiff` cirurgicamente sobre um `ElementorTemplate` (spread-based, nunca recria).
**Entrada:** `ElementorTemplate` (original), `PageDiff`
**Saída:** `ElementorTemplate` (evoluído — o original não é mutado)
**Dependências:** snapshot.types.ts, elementor.types.ts, utils/generateId.ts
**Manutenção:** editar aqui para adicionar suporte a novos `DiffOperationType`.

### `structural-validator.ts`
**Responsabilidade:** comparação profunda entre dois `ElementorTemplate` para detectar perdas estruturais após geração.
**Entrada:** `ElementorTemplate` (original), `ElementorTemplate` (evoluído)
**Saída:** `StructuralReport`
**Dependências:** validation.types.ts, page-snapshot.ts, elementor.types.ts
**Verifica:**
- Contagem de widgets por tipo (heading, button, image, icon-list, html, video)
- Formulários: conta `<form` em html widgets
- Container bloat (>50% aumento) e container loss (>30% queda)
- Mudança de hierarquia: profundidade máxima da árvore aumentou >2 níveis
- IDs duplicados e heading titles duplicados
**Manutenção:** editar aqui para adicionar novas verificações estruturais.

### `structural-corrector.ts`
**Responsabilidade:** aplicar correções locais automáticas para violações estruturais detectadas.
**Entrada:** `ElementorTemplate` (evoluído), `ElementorTemplate` (original — fonte para re-injeção), `StructuralReport`
**Saída:** `ElementorTemplate` (corrigido — o input não é mutado)
**Dependências:** validation.types.ts, page-snapshot.ts, elementor.types.ts, utils/generateId.ts
**Estratégia por violação:**
- `missing-widget-type` / `missing-media`: re-injeta widgets ausentes do original na seção correspondente
- `missing-form`: re-injeta html widgets com `<form` da seção original
- `container-bloat` / `hierarchy-change`: achata containers vazios e single-child
- `duplicate-element`: regenera IDs duplicados com `generateUniqueId`
**Manutenção:** editar aqui para adicionar suporte a novos `StructuralViolationType`.

### `visual-validator.ts`
**Responsabilidade:** validação visual estrutural sem dependência de browser.
**Em CREATE MODE** (sem original): self-audit — verifica se o template gerado tem headings, widgets e seções mínimas.
**Em EDIT/REFINE** (com original): compara original vs. evoluído em 4 dimensões:
- `colorScore` (25%): sobreposição de cores de fundo das sections
- `typographyScore` (25%): sobreposição de famílias tipográficas
- `layoutScore` (35%): média entre razão de sections e razão de widgets
- `mediaScore` (15%): sobreposição de URLs de imagem
**Entrada:** `ElementorTemplate` (evoluído), `GenerationMode`, `ElementorTemplate?` (original)
**Saída:** `VisualValidationResult { passed, score, colorScore, typographyScore, layoutScore, mediaScore, issues }`
**Dependências:** validation.types.ts, page-snapshot.ts, elementor.types.ts
**Manutenção:** editar aqui para adicionar novas dimensões de comparação visual.

### `quality-gate.ts`
**Responsabilidade:** gate central de qualidade — combina `ValidationResult` + `StructuralReport` + `VisualValidationResult` + Confidence Score e aplica thresholds por modo.
**Score geral:** structural×50% + visual×30% + confidence×20%
**Bloqueadores:** apenas erros de `validateTemplate` ou `validateStructuralIntegrity` (já capturados upstream)
**Warnings:** score abaixo do threshold — registrados no resultado, não bloqueiam
**Thresholds:**

| Modo | Estrutural | Visual | Confiança | Geral |
|---|---|---|---|---|
| create | 70 | 50 | 30 | 55 |
| edit | 85 | 70 | 40 | 75 |
| refine | 85 | 70 | 40 | 75 |

**Entrada:** `{ mode: GenerationMode, validation, sections, visualValidation, structuralReport? }`
**Saída:** `QualityGateResult { passed, score, thresholds, blockers, warnings, mode }`
**Dependências:** validation.types.ts, layout.types.ts
**Manutenção:** ajustar `THRESHOLDS` ou pesos de score aqui.

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

### `StructuralViolation` e `StructuralReport` *(src/types/validation.types.ts)*
Tipos do sistema de validação profunda. `StructuralViolationType` cobre:
`missing-widget-type | missing-section | container-bloat | container-loss | duplicate-element | hierarchy-change | missing-form | missing-media`.
`StructuralReport` contém `violations[]`, `errors[]` (bloqueantes), `warnings[]` (não bloqueantes) e `summary`.

### `PageSnapshot` *(src/types/snapshot.types.ts)*
Fotografia estrutural de uma página em um instante no tempo. Usada pelo diff engine.
```ts
interface PageSnapshot {
  createdAt: string; source: 'elementor' | 'html-pipeline' | 'vision';
  sectionCount: number; totalWidgetCount: number;
  sections: SnapshotSection[]; designTokens: DesignTokenSnapshot;
}
```

### `SnapshotSection`
Container raiz (`content[i]`) com lista aplanada DFS de todos os widgets da seção.
`id` preservado do Elementor · `sectionType` inferido por heurística · `positionIndex` para matching.

### `SnapshotWidget`
Widget folha com `id` original preservado, `settings` copiado integralmente e `positionIndex` para matching por posição.

### `PageDiff` e `DiffOperation`
Resultado de `computeDiff()`. `PageDiff` contém `DiffOperation[]` atômicas do tipo:
`update-widget-settings | add-section | remove-section | add-widget | remove-widget | reorder-sections`.

### `GenerationMode` *(src/types/validation.types.ts)*
`'create' | 'edit' | 'refine'` — contexto de geração passado ao Visual Validator e ao Quality Gate para selecionar thresholds e modo de comparação.

### `VisualValidationResult` *(src/types/validation.types.ts)*
Score de similaridade visual em 4 dimensões (0–100 cada): `colorScore`, `typographyScore`, `layoutScore`, `mediaScore`.
Produzido por `visual-validator.ts → validateVisual()`. Em CREATE usa self-audit; em EDIT/REFINE usa comparação snapshot-a-snapshot.

### `QualityScore` e `QualityGateResult` *(src/types/validation.types.ts)*
`QualityScore`: dimensões `structural / visual / confidence / overall` (0–100 cada).
`QualityGateResult`: `passed`, `score`, `thresholds`, `blockers[]`, `warnings[]`, `mode`.
Produzido por `quality-gate.ts → runQualityGate()`. `passed = false` apenas quando há blockers (erros já capturados upstream).

### `ConversionStatus` e `ConversionResult` *(src/types/app.types.ts · src/hooks/useConversion.ts)*
O estado de conversão é gerenciado por `useConversion()` — não há `AppState` monolítico.

`ConversionStatus` é a máquina de estados do pipeline:
```ts
type ConversionStatus =
  | 'idle' | 'parsing' | 'mapping'
  | 'refining'       // aguarda resposta do Worker /refine
  | 'snapshotting' | 'diffing' | 'patching' | 'validating' | 'correcting'
  | 'done' | 'error'
```

`ConversionResult` é o objeto de saída completo — inclui campos opcionais por modo:
```ts
interface ConversionResult {
  sections: Section[]
  exports: SectionExport[]
  nodeStats: Record<string, number>
  pageJson: string
  extractedImages: ExtractedImage[]
  uiAnalysis?: UIAnalysisResult
  // EDIT MODE — presentes apenas quando evolve() foi chamado
  snapshot?: PageSnapshot
  diff?: PageDiff
  evolvedFrom?: string
  structuralReport?: StructuralReport
  // QUALITY GATE — presentes em todos os modos
  visualValidation?: VisualValidationResult
  qualityGateResult?: QualityGateResult
}
```

---

## Estrutura de pastas

```
src/
  components/
    UploadPanel/         ← coluna esquerda: input HTML/ZIP/IMAGEM
    AnalysisPanel/       ← coluna central: estatísticas e árvore
    OutputPanel/         ← coluna direita: JSON + preview + mapa da página
    ConfigDashboard/     ← painel de tokens dinâmicos
    JsonViewer/          ← syntax highlight do JSON
    SectionCard/         ← card por seção com miniatura inline + botões de exportação
    PageMap/             ← mapa visual da página completa (única renderização) com seções numeradas e sincronizadas
    SectionPreview/      ← modal full-screen de preview individual de seção
  pages/                 ← páginas (se multi-rota futura)
  services/              ← lógica pura de conversão (sem React, testável)
    html-parser.ts             ← HTML → LayoutNode[]
    section-detector.ts        ← LayoutNode[] → Section[]
    elementor-mapper.ts        ← Section[] → ElementorElement[]
    elementor-exporter.ts      ← monta JSON final (version 0.4)
    image-analyzer.ts          ← Canvas API → análise heurística de imagem
    zip-handler.ts             ← JSZip wrapper (UTF-8 via uint8array)
    token-resolver.ts          ← substitui tokens {{}} no HTML
    validator.ts               ← validateTemplate + validateNoRegression
    page-snapshot.ts           ← snapshot estrutural de ElementorTemplate / Elements / Vision
    snapshot-diff.ts           ← diff mínimo entre dois PageSnapshot
    snapshot-patcher.ts        ← aplica PageDiff cirurgicamente (spread-based)
    structural-validator.ts    ← validação profunda pós-geração → StructuralReport
    structural-corrector.ts    ← auto-correção de violações estruturais (até 3x)
    visual-validator.ts        ← validação visual: cores, tipografia, layout, media
    quality-gate.ts            ← gate central de qualidade com scores e thresholds
    ai-refiner.ts              ← chama Worker /refine para refinamento por IA
    vision-registry.ts         ← orquestra providers de Vision AI
    providers/                 ← gemini.ts · openrouter.ts · groq.ts · claude.ts · proxy.ts
  hooks/
    useConversion.ts     ← orquestra o fluxo completo (todos os 4 modos)
    useHistory.ts        ← localStorage (preparado para banco de dados)
    useTokens.ts         ← estado dos tokens e substituição em tempo real
  utils/
    generateId.ts        ← hex de 8 chars únicos
    formatBytes.ts       ← exibição de tamanho de arquivo
    syntaxHighlight.ts   ← highlight do JSON output
    downloadFile.ts      ← download de .json e .zip
  types/
    elementor.types.ts      ← ElementorElement, ElementorTemplate, ElementorSettings
    layout.types.ts         ← LayoutNode, Section, NodeType
    app.types.ts            ← ConversionStatus, TokenMap, SectionExport, ConversionHistory
    snapshot.types.ts       ← PageSnapshot, PageDiff, DiffOperation, SnapshotSection
    validation.types.ts     ← StructuralViolation, StructuralReport, VisualValidationResult, QualityGateResult
    vision.types.ts         ← UIAnalysisResult, VisionSection
```

---

## Decisões técnicas registradas

| Data | Decisão | Motivo |
|---|---|---|
| — | Usar `section → column → widget(html)` para layouts Tailwind complexos | Preserva 100% do CSS sem mapear widget por widget |
| — | Injetar `<style>` isolado em cada widget HTML | Garante funcionamento sem depender do tema WordPress |
| — | localStorage para histórico (Fase 1) | Interface idêntica à futura API — migração sem refatoração |
| — | Deploy via FTP na Hostinger (sem Vercel) | Simplicidade e custo — suficiente para Fase 1 |
| — | Snapshot/diff/patch em vez de reescrita (EDIT MODE) | Preservação máxima de IDs e settings — zero perda de configurações Elementor |
| — | Quality Gate com warnings não bloqueantes (Fase 3) | Introduz métricas de qualidade sem risco de regressão; thresholds podem ser apertados em fases futuras |
| — | Visual Validator sem browser (snapshot estrutural) | Validação em CI/testes sem dependência de DOM ou rendering engine |
| Jun 2026 | Labels de seção extraídos do conteúdo HTML (H1→H2→heading→botão→parágrafo) | Usuário não reconhece "Header #3" — label baseado em conteúdo identifica a seção imediatamente |
| Jun 2026 | PageMap com única renderização da página completa + postMessage para posições | Thumbnails individuais têm escala inconsistente; single render garante mesmo contexto visual e largura uniforme |
| Jun 2026 | Miniaturas lazy-loaded via IntersectionObserver (iframe 960px, scale 0.125) | Evita inicializar 8–10 iframes simultâneos; carrega apenas quando o card entra no viewport |

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
| Melhorar extração de título de seção | `section-detector.ts → extractContentTitle()` |
| Ajustar escala ou largura do Mapa da Página | `PageMap/index.tsx` — constantes `RENDER_WIDTH`, `DISPLAY_WIDTH` |
| Novo componente de UI | `src/components/NomeComponente/` |
| Novo arquivo de saída (.json) | `elementor-exporter.ts` + `PROMPT.md` tabela de arquivos |
| Novo suporte a EDIT MODE / evolução de página | `page-snapshot.ts` + `snapshot-diff.ts` + `snapshot-patcher.ts` + `validator.ts` (`validateNoRegression`) |
| Nova verificação de integridade estrutural | `structural-validator.ts` |
| Nova estratégia de correção automática | `structural-corrector.ts` |
| Nova dimensão de comparação visual | `visual-validator.ts` |
| Ajuste de thresholds de qualidade ou pesos de score | `quality-gate.ts` |

---

## Fluxo de evolução — EDIT MODE

Quando uma página já existe no Elementor e precisa de atualização, o fluxo de conversão
padrão (CREATE MODE) descrito acima não se aplica diretamente.

Em EDIT MODE, o pipeline opera sobre os artefatos existentes:

```
JSON original + HTML atualizado + Imagem de referência
  │
  ▼
Análise de diff → Plano de modificações mínimas
  │
  ▼
Aplicação cirúrgica → Preservação de IDs e settings
  │
  ▼
Validação estrutural + Validação anti-regressão + Validação visual
  │
  ▼
JSON final (extensão do original — nunca recriação completa)
```

Para as regras de filosofia, checklist e política de preservação:
**→ Consultar PAGE_EVOLUTION.md**

### Pipeline EDIT MODE (implementado via `useConversion.evolve()`)

```
JSON original + HTML atualizado + TokenMap
  │
  ├── [1] PARSING           parseHTML → detectSections → resolveNodeTree
  ├── [2] SNAPSHOTTING      createSnapshotFromElementor(originalTemplate) → originalSnapshot
  │                         mapSectionsToElementor → newElements
  │                         createSnapshotFromElements(newElements) → newSnapshot
  ├── [3] DIFFING           computeDiff(originalSnapshot, newSnapshot) → PageDiff
  ├── [4] PATCHING          applyDiff(originalTemplate, diff) → patchedTemplate (spread-based)
  ├── [5] VALIDATION        validateTemplate(patchedTemplate)
  │                         validateNoRegression(originalSnapshot, patchedTemplate)
  ├── [6] VALIDATING        validateStructuralIntegrity(originalTemplate, currentTemplate) → StructuralReport
  │   [7] CORRECTING        applyStructuralCorrections(current, original, report) — até 3x
  │                         re-valida após cada correção; bloqueia se erros persistirem
  ├── [8] QUALITY GATE      validateVisual(currentTemplate, 'edit', originalTemplate) → VisualValidationResult
  │                         runQualityGate({ mode: 'edit', validation, sections, visualValidation, structuralReport })
  └── [9] RESULT            setResult com pageJson, snapshot, diff, structuralReport, visualValidation, qualityGateResult
```

### Módulos do EDIT MODE

| Responsabilidade | Módulo |
|---|---|
| Criar snapshot de ElementorTemplate ou ElementorElement[] | `services/page-snapshot.ts` |
| Calcular diff entre dois snapshots | `services/snapshot-diff.ts` |
| Aplicar diff cirurgicamente (spread-based) | `services/snapshot-patcher.ts` |
| Validar ausência de regressões básicas | `services/validator.ts` → `validateNoRegression` |
| Validar integridade estrutural profunda | `services/structural-validator.ts` → `validateStructuralIntegrity` |
| Corrigir violações estruturais automaticamente | `services/structural-corrector.ts` → `applyStructuralCorrections` |
| Validar similaridade visual (cores, tipografia, layout, media) | `services/visual-validator.ts` → `validateVisual` |
| Calcular score de qualidade e aplicar thresholds | `services/quality-gate.ts` → `runQualityGate` |
| Orquestrar pipeline EDIT MODE | `hooks/useConversion.ts` → `evolve()` |
