# 18_TECH_DEBT.md — Dívida Técnica
> Status: **Vivo** | Atualizar quando nova dívida é identificada ou quitada

---

## CRITICAL

### CRIT-001 — CHANGELOG desatualizado
**O que é:** O `CHANGELOG.md` tem apenas a entrada `[1.0.0]` da data de lançamento do MVP. As Fases 2–5 (Visual Validator, Quality Gate, Snapshot Engine, EDIT MODE, REFINE MODE, refineSection, SectionPreview, numeração de seções duplicadas) não estão documentadas.

**Impacto:** Histórico perdido; impossível saber o que foi adicionado em cada sprint; bloqueador para onboarding de novos colaboradores.

**Solução:** Criar entradas retroativas `[1.1.0]` a `[1.5.0]` documentando cada fase.

**Esforço:** 2h | **Responsável:** CTO

---

### CRIT-002 — `elementor-mapper.ts` com 600+ linhas
**O que é:** O arquivo `src/services/elementor-mapper.ts` tem ~600 linhas, violando a regra de 250 linhas máximas.

**Impacto:** Difícil manutenção; tempo de leitura > 10min; context window inadequado para edição assistida por IA.

**Solução:** Extrair para sub-módulos:
- `elementor-mapper-core.ts` — lógica de container/column
- `elementor-mapper-widgets.ts` — mapeamento widget por widget
- `elementor-mapper-html.ts` — fallback html widget

**Esforço:** 4h (cuidado com exports) | **Responsável:** Dev

---

## HIGH

### HIGH-001 — Score de qualidade invisível na UI
**O que é:** `runQualityGate()` calcula `QualityGateResult` com scores por dimensão (structural/visual/confidence/overall) mas esse resultado não é exibido ao usuário na UI.

**Impacto:** Usuário não sabe se a conversão teve score 55 ou 95. Impossível comparar qualidade entre conversões.

**Solução:** Adicionar badge ou gauge no OutputPanel exibindo score geral e warnings do Quality Gate.

**Esforço:** 3h | **Responsável:** Frontend Dev

---

### HIGH-002 — Testes ausentes para serviços novos
**O que é:** Os serviços criados nas Fases 3–5 não têm cobertura de testes:
`visual-validator.ts`, `quality-gate.ts`, `page-snapshot.ts`, `snapshot-diff.ts`, `snapshot-patcher.ts`, `structural-validator.ts`, `structural-corrector.ts`

**Impacto:** Mudanças nesses serviços podem quebrar silenciosamente. 7 serviços críticos sem cobertura.

**Solução:** Criar 7 arquivos de teste com pelo menos 3 casos cada.

**Esforço:** 8h | **Responsável:** Dev + QA

---

### HIGH-003 — Divergência vision-prompt worker ↔ frontend
**O que é:** O prompt de visão (UIAnalysisResult) existe duplicado: em `providers/` (frontend) e potencialmente no Worker Cloudflare. Uma atualização em um lado pode não ser replicada.

**Impacto:** Inconsistência silenciosa — o Worker pode retornar formato diferente do que o frontend espera.

**Solução:** Centralizar o prompt em 1 local. Opção A: apenas no Worker (frontend só proxy). Opção B: versionamento explícito do prompt em ambos.

**Esforço:** 4h | **Responsável:** AI Eng

---

### HIGH-004 — URL import não implementado
**O que é:** O roadmap prevê "Input por URL de site ao vivo" no Sprint 2B, mas não há spec nem implementação.

**Impacto:** Feature de alto valor de produto bloqueada por falta de especificação.

**Solução:** Criar SPEC-002 em `22_SPECIFICATIONS.md` antes de implementar.

**Esforço:** 1h (spec) + 2d (impl) | **Responsável:** Product + Dev

---

### HIGH-005 — refineSection sem contexto HTML em VISION MODE
**O que é:** Seções geradas via Vision AI não têm `rawHtml` nos nodes (`section.nodes[i].rawHtml === undefined`). Quando `refineSection()` é chamado, envia string vazia ao Worker.

**Impacto:** Refinamento de seções de VISION MODE é sem contexto — IA recebe JSON mas sem HTML de referência.

**Solução:** Gerar HTML representativo a partir do `UIAnalysisResult` para usar como contexto de refinamento.

**Esforço:** 4h | **Responsável:** Dev

---

## MEDIUM

### MED-001 — Mobile não responsivo
**O que é:** O layout de 3 colunas (`grid-cols-3`) não se adapta a telas < 1024px.

**Impacto:** App inutilizável em celulares e tablets.

**Solução:** Adicionar `md:grid-cols-1` + `lg:grid-cols-3` + navegação por tabs em mobile.

**Esforço:** 1d | **Responsável:** Frontend Dev

---

### MED-002 — Sem skeleton de loading
**O que é:** Durante `parsing` e `mapping`, o OutputPanel e AnalysisPanel ficam vazios.

**Impacto:** UX pobre — usuário não sabe se algo está acontecendo.

**Solução:** Skeleton cards animados com `animate-pulse` nos painéis durante loading.

**Esforço:** 3h | **Responsável:** Frontend Dev

---

### MED-003 — `prompts/PLANO.md` obsoleto
**O que é:** O arquivo `prompts/PLANO.md` contém decisões históricas que foram migradas para `ARCHITECTURE.md` mas o arquivo não foi arquivado.

**Impacto:** Confusão sobre qual documento é autoritativo.

**Solução:** Mover para `docs/wkos/archive/PLANO-HISTORICO.md` e adicionar nota de deprecação.

**Esforço:** 30min | **Responsável:** CTO

---

### MED-004 — Sem indicador "modificado" por seção
**O que é:** Após `refineSection()`, não há indicador visual de que a seção foi modificada em relação ao estado original.

**Impacto:** Usuário não sabe o que mudou sem olhar o JSON.

**Solução:** Badge "modificada" no SectionCard após refine bem-sucedido. Parte do SPEC-001 Smart Export Manager.

**Esforço:** 2h (isolado) ou incluído no SPEC-001 | **Responsável:** Frontend Dev

---

## LOW

### LOW-001 — `ROADMAP.md` desatualizado
**O que é:** `ROADMAP.md` na raiz lista Sprint 2–5 como "próximos". Alguns itens já implementados.

**Solução:** Atualizar com status atual ou redirecionar para `19_ROADMAP.md` (WKOS).

**Esforço:** 1h | **Responsável:** Product

---

### LOW-002 — `webkeeper-demo.html` sem propósito documentado
**O que é:** Existe um arquivo `webkeeper-demo.html` na raiz do projeto sem documentação de propósito ou uso.

**Solução:** Documentar no `README.md` ou mover para `docs/examples/`.

**Esforço:** 30min | **Responsável:** Dev

---

### LOW-003 — Sem `.env.example` completo para Worker
**O que é:** O `.env.example` do projeto frontend pode não incluir todas as variáveis necessárias para deploy do Worker Cloudflare.

**Solução:** Criar `cloudflare-worker/.env.example` com todas as variáveis do Worker.

**Esforço:** 30min | **Responsável:** Dev

---

## Quitado

| Item | Quando | O que foi feito |
|---|---|---|
| Seções duplicadas com mesmo nome | Jun 2026 | `section-detector.ts` deduplica automaticamente: primeira ocorrência mantém nome, subsequentes recebem `#2`, `#3` |
| Preview de seção truncado | Jun 2026 | Corrigido em `SectionPreview`: `overflow-auto` + `height: 70vh` + Tailwind CDN no `srcdoc` |
| Contador de refines invisível | Jun 2026 | `SectionCard` rastreia `refineCount` com `wasRefining` ref + badge `×N` |
