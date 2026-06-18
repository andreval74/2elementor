# 07_PIPELINE.md — Pipelines de Conversão
> Fonte: `prompts/ARCHITECTURE.md` + `src/hooks/useConversion.ts` | Status: **Estável**

---

## Máquina de Estados: ConversionStatus

```
idle
  │
  ├─ convert() →
  │     parsing → mapping → [refining?] → validating → correcting → done | error
  │
  ├─ evolve() →
  │     parsing → snapshotting → diffing → patching → validating → correcting → done | error
  │
  └─ refineSection() →
        (não altera status global — usa sectionRefining[id] boolean)
```

---

## Pipeline CREATE MODE (10 etapas)

```
useConversion.convert(html, tokens)
  │
  [1]  status = 'parsing'
       parseHTML(html) → LayoutNode[]
       detectSections(nodes) → Section[] (com deduplicação automática)
       resolveTokens(html, tokens) → HTML com tokens substituídos
  │
  [2]  status = 'mapping'
       mapSectionsToElementor(sections) → ElementorElement[]
       exportElementorTemplate(elements, title, type) → SectionExport[]
  │
  [3]  status = 'refining' (apenas se modo REFINE global ativado)
       refinePageJson(html, pageJson) → via Worker /refine
  │
  [4]  status = 'validating'
       validateTemplate(template) → ValidationResult
       (se !valid → throw → status = 'error')
  │
  [5]  status = 'correcting' (loop estrutural — até 3x)
       validateStructuralIntegrity(original, current) → StructuralReport
       se violations → applyStructuralCorrections(current, original, report)
       re-validar após cada correção
       (se erros persistirem após 3x → throw → status = 'error')
  │
  [6]  validateVisual(template, 'create') → VisualValidationResult
       runQualityGate({ mode: 'create', validation, sections, visualValidation }) → QualityGateResult
  │
  [7]  status = 'done'
       setResult({ sections, exports, nodeStats, pageJson, qualityGateResult, ... })
```

---

## Pipeline EDIT MODE (9 etapas)

```
useConversion.evolve(updatedHtml, originalJson, tokens)
  │
  [1]  status = 'parsing'
       parseHTML(updatedHtml) → newNodes
       detectSections(newNodes) → newSections
       resolveNodeTree(newNodes, tokens)
  │
  [2]  status = 'snapshotting'
       originalTemplate = JSON.parse(originalJson)
       createSnapshotFromElementor(originalTemplate) → originalSnapshot
       mapSectionsToElementor(newSections) → newElements
       createSnapshotFromElements(newElements) → newSnapshot
  │
  [3]  status = 'diffing'
       computeDiff(originalSnapshot, newSnapshot) → PageDiff
  │
  [4]  status = 'patching'
       applyDiff(originalTemplate, diff) → patchedTemplate (spread-based)
  │
  [5]  status = 'validating'
       validateTemplate(patchedTemplate) → ValidationResult
       validateNoRegression(originalSnapshot, patchedTemplate) → check
  │
  [6]  status = 'correcting' (loop estrutural — até 3x)
       validateStructuralIntegrity(originalTemplate, currentTemplate)
       applyStructuralCorrections(current, original, report)
  │
  [7]  validateVisual(currentTemplate, 'edit', originalTemplate) → VisualValidationResult
       runQualityGate({ mode: 'edit', validation, sections, visualValidation, structuralReport })
  │
  [8]  status = 'done'
       setResult({ pageJson, snapshot, diff, evolvedFrom, structuralReport, ... })
```

---

## Pipeline REFINE MODE (global — página toda)

```
useConversion.refine() (botão "Re-fazer" global)
  │
  [1]  status = 'refining'
       html = result.exports.flatMap(nodes rawHtml).join('\n')
       json = result.pageJson
  │
  [2]  refinedJson = await refinePageJson(html, json)
       (Worker /refine → Gemini → Groq → OpenRouter)
  │
  [3]  status = 'validating'
       validateTemplate(refinedTemplate) → ValidationResult
       (se !valid → throw → status = 'error')
  │
  [4]  status = 'correcting' (loop estrutural — até 3x)
       validateStructuralIntegrity(original, refined)
       applyStructuralCorrections(refined, original, report)
  │
  [5]  validateVisual(corrected, 'refine', original) → VisualValidationResult
       runQualityGate({ mode: 'refine', ... }) → QualityGateResult
  │
  [6]  status = 'done'
       setResult({ exports, pageJson: newPageJson, qualityGateResult, ... })
```

---

## Pipeline REFINE SECTION (por seção — isolado)

```
useConversion.refineSection(sectionId)
  │
  [1]  sectionRefining[sectionId] = true
       sectionExport = result.exports.find(e.section.id === sectionId)
       html = section.nodes.map(n.rawHtml ?? '').join('\n')
       json = templateToJson(originalTemplate)
  │
  [2]  refinedJson = await refinePageJson(html, json)
       (mesmo Worker /refine)
  │
  [3]  validateTemplate(refinedTemplate) → ValidationResult
       (se !valid → throw → sectionRefining[id] = false)
  │
  [4]  runStructuralLoop(original, refined, 'refine-section[name]', () => {})
       ← onStatus é no-op para NÃO alterar status global
  │
  [5]  validateVisual(corrected, 'refine', original)
       runQualityGate({ mode: 'refine', ... }) → warnings apenas
  │
  [6]  updatedExports = result.exports.map(e =>
         e.section.id === sectionId ? { ...e, template: corrected } : e
       )
       newPageJson = templateToJson({ ...basePage, content: allContent })
       setResult(prev => ({ ...prev, exports: updatedExports, pageJson: newPageJson }))
  │
  [7]  sectionRefining[sectionId] = false
```

### Diferença chave REFINE vs REFINE SECTION

| Aspecto | REFINE (global) | REFINE SECTION |
|---|---|---|
| Contexto enviado ao Worker | Página completa (todas as seções) | 1 seção apenas (contexto menor) |
| Status global | Altera `status = 'refining'` | NÃO altera status global |
| Tracking | `refineCount` no botão global | `sectionRefining[id]` + badge `×N` no SectionCard |
| Bloqueio de UI | Tela toda spinneriza | Apenas o card da seção |

---

## Pipeline VISION MODE

```
useConversion.analyzeVision(imageFile)
  │
  [1]  status = 'parsing'
       analyzeWithGemini(file) → UIAnalysisResult (tenta provider 1)
       ou analyzeWithOpenRouter(file) → UIAnalysisResult (provider 2)
       ou analyzeWithGroq(file) → UIAnalysisResult (provider 3)
       ou analyzeWithClaude(file) → UIAnalysisResult (proxy)
  │
  [2]  status = 'mapping'
       mapVisionResultToSections(uiAnalysis) → Section[]
       mapSectionsToElementor(sections) → SectionExport[]
  │
  [3]  status = 'validating'
       validateTemplate(template) para cada seção
  │
  [4]  status = 'done'
       setResult({ sections, exports, uiAnalysis, ... })
```

---

## Helper Compartilhado: `runStructuralLoop`

```typescript
function runStructuralLoop(
  original: ElementorTemplate,
  current: ElementorTemplate,
  scope: string,
  onStatus: (s: ConversionStatus) => void  // no-op em refineSection
): { template: ElementorTemplate, report: StructuralReport }
```

Usado por: `convert()`, `evolve()`, `refine()`, `refineSection()`.

Loop interno:
```
attempt = 0
while attempt < 3:
  report = validateStructuralIntegrity(original, current)
  if !report.violations → break
  current = applyStructuralCorrections(current, original, report)
  re-validate
  attempt++
```
