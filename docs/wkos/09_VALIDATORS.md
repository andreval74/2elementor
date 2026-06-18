# 09_VALIDATORS.md — Sistema de Validação em 4 Camadas
> Fonte: `validator.ts`, `structural-validator.ts`, `visual-validator.ts`, `quality-gate.ts`

---

## Arquitetura das 4 Camadas

```
[1] Template Validator      → estrutura básica do JSON (sempre obrigatório)
[2] Structural Validator    → comparação profunda com original (EDIT/REFINE)
[3] Visual Validator        → similaridade visual em 4 dimensões
[4] Quality Gate            → score geral + thresholds por modo
```

Cada camada é independente. Todas rodadas sequencialmente em cada pipeline.

---

## Camada 1: Template Validator

**Módulo:** `src/services/validator.ts`
**Função:** `validateTemplate(template: ElementorTemplate) → ValidationResult`

### O que verifica

- `version === "0.4"` → error se diferente
- `type` é valor válido (`page/header/footer/popup/post/error-404`) → error se inválido
- `content` é array → error se não for
- Cada elemento tem `id`, `elType`, `settings`, `elements` → error por elemento inválido
- Widgets têm `widgetType` → error se `elType === 'widget'` sem `widgetType`
- IDs são únicos (hex 8 chars) → error se duplicados
- Profundidade máxima ≤ 10 → error se ultrapassar

### O que não verifica
- Conteúdo semântico dos widgets
- Comparação com template original
- Qualidade visual

### `validateNoRegression`
Função adicional para EDIT MODE:
- Compara `originalSnapshot` com `patchedTemplate`
- Verifica que nenhuma section foi removida sem instrução
- Verifica que nenhum ID foi regenerado sem necessidade

---

## Camada 2: Structural Validator + Corrector

**Módulo:** `src/services/structural-validator.ts`
**Função:** `validateStructuralIntegrity(original, current) → StructuralReport`
**Corrector:** `src/services/structural-corrector.ts`
**Função:** `applyStructuralCorrections(current, original, report) → ElementorTemplate`

### 8 Tipos de Violação Estrutural

| `StructuralViolationType` | Trigger | Severidade |
|---|---|---|
| `missing-widget-type` | Tipo de widget (heading, button, image...) presente no original mas ausente no evoluído | Error |
| `missing-section` | Section presente no original removida sem autorização | Error |
| `container-bloat` | Número de containers aumentou > 50% | Warning |
| `container-loss` | Número de containers caiu > 30% | Warning |
| `duplicate-element` | IDs hex duplicados no template evoluído | Error |
| `hierarchy-change` | Profundidade máxima da árvore aumentou > 2 níveis | Warning |
| `missing-form` | `<form` em html widgets do original não existe no evoluído | Error |
| `missing-media` | URLs de imagem do original ausentes no evoluído | Warning |

### Estratégias de Correção Automática

| Violação | Ação do Corrector |
|---|---|
| `missing-widget-type` / `missing-media` | Re-injeta widgets ausentes do original na seção correspondente |
| `missing-form` | Re-injeta html widgets contendo `<form` da seção original |
| `container-bloat` / `hierarchy-change` | Achata containers vazios e containers single-child |
| `duplicate-element` | Regenera IDs duplicados com `generateUniqueId()` |
| `missing-section` | Erro — não auto-corrigível, pipeline bloqueia |

### Loop de Correção (até 3 tentativas)

```
attempt 1: validateStructuralIntegrity → applyStructuralCorrections
attempt 2: re-validateStructuralIntegrity → applyStructuralCorrections
attempt 3: re-validateStructuralIntegrity → applyStructuralCorrections
se ainda há errors → throw → status = 'error'
```

### Como Adicionar Nova Verificação

1. Adicionar novo valor a `StructuralViolationType` em `validation.types.ts`
2. Implementar detecção em `structural-validator.ts` → `validateStructuralIntegrity()`
3. Implementar correção em `structural-corrector.ts` → `applyStructuralCorrections()`
4. Classificar como `error` (bloqueia) ou `warning` (apenas registra)
5. Adicionar teste específico em `src/test/structural-validator.test.ts`

---

## Camada 3: Visual Validator

**Módulo:** `src/services/visual-validator.ts`
**Função:** `validateVisual(template, mode, original?) → VisualValidationResult`

### Dois Modos

**CREATE MODE** (sem `original`): self-audit
- Verifica se o template tem headings mínimos (≥ 1)
- Verifica se tem widgets suficientes (≥ 2)
- Verifica se tem seções mínimas (≥ 1)

**EDIT/REFINE MODE** (com `original`): comparação snapshot-a-snapshot
- Compara 4 dimensões entre original e evoluído

### 4 Dimensões de Comparação (EDIT/REFINE)

| Dimensão | Peso | Como mede |
|---|---|---|
| `colorScore` | 25% | Sobreposição de cores de fundo das sections |
| `typographyScore` | 25% | Sobreposição de famílias tipográficas |
| `layoutScore` | 35% | Média entre razão de sections e razão de widgets |
| `mediaScore` | 15% | Sobreposição de URLs de imagem |

### Score Final

```
score = colorScore × 0.25 + typographyScore × 0.25 + layoutScore × 0.35 + mediaScore × 0.15
passed = score ≥ threshold_do_modo
```

### Como Adicionar Nova Dimensão

1. Adicionar campo ao `VisualValidationResult` em `validation.types.ts`
2. Implementar extração e comparação em `visual-validator.ts`
3. Integrar ao score final com peso (ajustar pesos para somar 100%)
4. Atualizar testes em `src/test/visual-validator.test.ts`
5. Atualizar `08_QUALITY_GATE.md`

---

## Camada 4: Quality Gate

Ver `08_QUALITY_GATE.md` completo.

---

## Tipos Principais de Saída

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];    // bloqueiam exportação
  warnings: string[];  // alertas não bloqueantes
}

interface StructuralReport {
  violations: StructuralViolation[];
  errors: string[];
  warnings: string[];
  summary: string;
}

interface VisualValidationResult {
  passed: boolean;
  score: number;      // 0–100
  colorScore: number;
  typographyScore: number;
  layoutScore: number;
  mediaScore: number;
  issues: string[];
}
```

---

## Resumo: O que bloqueia vs. o que adverte

| Condição | Camada | Resultado |
|---|---|---|
| `version !== "0.4"` | Template | ❌ Bloqueia pipeline |
| `elType === 'widget'` sem `widgetType` | Template | ❌ Bloqueia pipeline |
| IDs duplicados | Template | ❌ Bloqueia pipeline |
| Section removida sem autorização | Structural | ❌ Bloqueia após 3 tentativas |
| Widget-type ausente no evoluído | Structural | ❌ Bloqueia após 3 tentativas (se não corrigível) |
| Formulário ausente no evoluído | Structural | ❌ Bloqueia após 3 tentativas |
| Container bloat (>50%) | Structural | ⚠️ Warning (auto-corrigido) |
| Score visual abaixo do threshold | Visual + QG | ⚠️ Warning (não bloqueia) |
| Score geral abaixo do threshold | QG | ⚠️ Warning (não bloqueia) |
