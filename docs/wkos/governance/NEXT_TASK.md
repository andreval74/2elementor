# governance/NEXT_TASK.md — Próximas Tarefas Priorizadas
> Atualizar ao início e fim de cada sprint
> **Última atualização:** 2026-06-17

---

## AGORA — Execução Imediata

### 1. Corrigir CHANGELOG (CRIT-001)
Criar entradas retroativas `[1.1.0]` a `[1.4.0]` no `CHANGELOG.md` raiz (não o WKOS — esse já foi atualizado).

**Esforço:** 1h

---

### 2. Exibir Score de Qualidade na UI (HIGH-001)
Adicionar badge ou gauge no OutputPanel mostrando `qualityGateResult.score.overall` e warnings.

**Esforço:** 3h

---

## PRÓXIMA SEMANA — Sprint 2A

### Multi-pass por seção (DCGen)
1. Criar `src/utils/image-slicer.ts` — corta imagem pelas seções detectadas
2. Modificar `src/services/providers/proxy.ts` — suporta "Análise Detalhada" com N chamadas
3. Adicionar botão "Análise Detalhada" vs "Análise Rápida" no UploadPanel
4. Testes: pelo menos 3 casos para image-slicer.ts

---

## PRÓXIMO MÊS — Sprint 2B + Backlog

### URL Import (SPEC-002 primeiro)
1. Criar SPEC-002 em `22_SPECIFICATIONS.md`
2. Implementar `src/services/url-screenshot.ts`
3. Adicionar aba "URL" no UploadPanel

### Testes para Serviços Novos (HIGH-002)
Criar 7 arquivos de teste:
- `visual-validator.test.ts`
- `quality-gate.test.ts`
- `page-snapshot.test.ts`
- `snapshot-diff.test.ts`
- `snapshot-patcher.test.ts`
- `structural-validator.test.ts`
- `structural-corrector.test.ts`

---

## BACKLOG PRIORIZADO

| # | Item | Prioridade | Referência |
|---|---|---|---|
| 1 | CHANGELOG desatualizado (raiz) | CRITICAL | CRIT-001 |
| 2 | Quebrar elementor-mapper.ts | CRITICAL | CRIT-002 |
| 3 | Score visível na UI | HIGH | HIGH-001 |
| 4 | Testes para 7 serviços novos | HIGH | HIGH-002 |
| 5 | Divergência prompt worker↔frontend | HIGH | HIGH-003 |
| 6 | SPEC-002: URL Import | HIGH | HIGH-004 |
| 7 | refineSection sem rawHtml em VISION | HIGH | HIGH-005 |
| 8 | Mobile responsivo | MEDIUM | MED-001 |
| 9 | Skeleton loading | MEDIUM | MED-002 |
| 10 | SPEC-001: Smart Export Manager | MEDIUM | 22_SPECIFICATIONS |
| 11 | Badge "modificada" por seção | MEDIUM | MED-004 |
| 12 | ROADMAP.md atualizar | LOW | LOW-001 |
| 13 | webkeeper-demo.html documentar | LOW | LOW-002 |
| 14 | .env.example Worker | LOW | LOW-003 |
