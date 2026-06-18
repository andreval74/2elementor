# 08_QUALITY_GATE.md — Quality Gate
> Fonte: `src/services/quality-gate.ts` + `validation.types.ts` | Status: **Estável**

---

## Visão Geral

O Quality Gate é o gate central de qualidade — combina 4 dimensões de score e aplica thresholds diferenciados por modo de geração.

```typescript
runQualityGate({
  mode: 'create' | 'edit' | 'refine',
  validation: ValidationResult,
  sections: Section[],
  visualValidation?: VisualValidationResult,
  structuralReport?: StructuralReport
}) → QualityGateResult
```

---

## Fórmula de Score

```
Score Geral = structural × 50% + visual × 30% + confidence × 20%

structural  = baseado em validateTemplate() — 100 se sem errors, -10 por warning
visual      = VisualValidationResult.score (0–100)
confidence  = baseado no número de seções detectadas e na qualidade dos nodes
```

---

## Thresholds por Modo

| Modo | Estrutural | Visual | Confiança | Geral |
|---|---|---|---|---|
| create | 70 | 50 | 30 | 55 |
| edit | 85 | 70 | 40 | 75 |
| refine | 85 | 70 | 40 | 75 |

**Motivo dos thresholds maiores em EDIT/REFINE:** Em CREATE, qualquer resultado funcional é válido. Em EDIT/REFINE, o JSON original é a referência — qualquer divergência é regressão.

---

## Política de Bloqueio

| Tipo | Comportamento |
|---|---|
| **Blocker** | `validateTemplate()` → `errors[]` não-vazio → `passed = false` |
| **Blocker** | `validateStructuralIntegrity()` → `errors[]` → pipeline lança `throw` antes do Gate |
| **Warning** | Score abaixo do threshold → `warnings[]` preenchido, `passed = true` |
| **Informativo** | Score acima do threshold → `passed = true`, `warnings = []` |

**Importante:** O Quality Gate em si **nunca bloqueia** o resultado (não lança erro). Blockers são capturados upstream (em `validateTemplate` e `runStructuralLoop`). O Gate apenas calcula e registra scores e warnings.

---

## Tipos de Saída

```typescript
interface QualityGateResult {
  passed: boolean;            // true se sem blockers
  score: QualityScore;        // { structural, visual, confidence, overall }
  thresholds: QualityScore;   // thresholds aplicados
  blockers: string[];         // erros críticos (upstream)
  warnings: string[];         // scores abaixo do threshold
  mode: GenerationMode;       // create | edit | refine
}

interface QualityScore {
  structural: number;   // 0–100
  visual: number;       // 0–100
  confidence: number;   // 0–100
  overall: number;      // 0–100
}
```

---

## Onde o Score é Usado

1. **`useConversion.ts`** — `result.qualityGateResult` disponível no resultado
2. **`OutputPanel`** — exibe warnings do Quality Gate (se presentes)
3. **`refineSection()`** — warnings logados no console, não bloqueiam

---

## Lacuna Atual

O score é calculado mas **não exibido visualmente** na UI ao usuário. O usuário não sabe se sua conversão teve score 55 ou 95.

**Backlog:** Criar indicador visual de score na `OutputPanel` (badge ou gauge).
Ver `governance/TECH_DEBT.md` → item HIGH-001.

---

## Como Adicionar Nova Dimensão de Score

1. Criar nova função de validação em `src/services/` (ex: `contrast-validator.ts`)
2. Adicionar campo ao tipo `QualityScore` em `validation.types.ts`
3. Atualizar `runQualityGate()` em `quality-gate.ts`:
   - Receber novo resultado como parâmetro
   - Calcular novo score (0–100)
   - Integrar ao `overall` com peso definido (ajustar outros pesos para somar 100%)
   - Adicionar threshold ao objeto `THRESHOLDS`
4. Chamar a nova validação em `useConversion.ts` antes de `runQualityGate`
5. Adicionar testes em `src/test/quality-gate.test.ts`
6. Atualizar este arquivo

---

## Como Ajustar Thresholds

Editar apenas `quality-gate.ts`:

```typescript
const THRESHOLDS = {
  create: { structural: 70, visual: 50, confidence: 30, overall: 55 },
  edit:   { structural: 85, visual: 70, confidence: 40, overall: 75 },
  refine: { structural: 85, visual: 70, confidence: 40, overall: 75 },
}
```

Após ajuste: rodar `npm test` para garantir que testes de threshold ainda passam.
