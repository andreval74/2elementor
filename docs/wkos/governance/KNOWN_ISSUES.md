# governance/KNOWN_ISSUES.md — Bugs e Problemas Conhecidos
> Documentar aqui ANTES de corrigir. Marcar como resolvido após fix + CHANGELOG.
> **Última atualização:** 2026-06-17

---

## Abertos

### KI-001 — refineSection sem contexto em VISION MODE
**Severidade:** P2
**Status:** Aberto

**Problema:** Seções geradas via Vision AI não têm `rawHtml` nos nodes. Quando `refineSection()` é chamado, o HTML enviado ao Worker é string vazia.

**Comportamento esperado:** Worker recebe HTML representativo da seção.
**Comportamento atual:** Worker recebe `""` como HTML, apenas o JSON.

**Impacto:** Refinamento de seções VISION MODE é sem contexto visual — IA só tem o JSON como referência.

**Workaround atual:** Nenhum. O refinamento ainda acontece mas com qualidade reduzida.

**Solução planejada:** Gerar HTML representativo a partir de `UIAnalysisResult` em `vision-registry.ts`.

**Referência:** `HIGH-005` em `18_TECH_DEBT.md`

---

### KI-002 — Layout não responsivo em mobile
**Severidade:** P2
**Status:** Aberto

**Problema:** Grid de 3 colunas (`grid-cols-3`) não adapta para telas < 1024px.

**Comportamento esperado:** Tabs ou stack vertical em mobile.
**Comportamento atual:** Colunas sobrepostas/comprimidas.

**Impacto:** App inutilizável em celulares — afeta ~30% dos usuários potenciais.

**Solução planejada:** `md:grid-cols-1 lg:grid-cols-3` + navegação por tabs.

**Referência:** `MED-001` em `18_TECH_DEBT.md`

---

### KI-003 — Score de qualidade não exibido na UI
**Severidade:** P2
**Status:** Aberto

**Problema:** `runQualityGate()` calcula `QualityGateResult` com score por dimensão, mas o resultado não é exibido ao usuário na interface.

**Comportamento esperado:** Badge ou gauge com score (ex: "Score: 87/100") no OutputPanel.
**Comportamento atual:** Score calculado, disponível em `result.qualityGateResult`, mas invisível.

**Impacto:** Usuário não sabe a qualidade da conversão. Impossível comparar entre tentativas.

**Solução planejada:** Componente de score no OutputPanel.

**Referência:** `HIGH-001` em `18_TECH_DEBT.md`

---

## Resolvidos

| ID | Problema | Resolvido em | Como foi corrigido |
|---|---|---|---|
| KI-R01 | Seções com mesmo nome (header/nav duplicado) confundiam o usuário | Jun 2026 (v1.4.0) | `section-detector.ts` deduplica: 1ª ocorrência mantém nome, subsequentes recebem `#2`, `#3` |
| KI-R02 | Preview de seção truncado — iframe cortava conteúdo | Jun 2026 (v1.4.0) | Corrigido em `SectionPreview`: `overflow-auto` + `height: 70vh` + Tailwind CDN no srcdoc |
| KI-R03 | Contador de refines não visível — usuário não sabia quantas vezes refinou | Jun 2026 (v1.4.0) | `SectionCard`: `refineCount` local + `wasRefining` ref + badge `×N` dourado |
| KI-R04 | Gemini timeout muito longo (18s) causava experiência ruim | Jun 2026 (v1.3.0) | Timeout reduzido para 12s + mensagem de fallback clara |
| KI-R05 | Worker sem fallback OpenRouter no /refine | Jun 2026 (v1.3.0) | Cascata adicionada: Gemini → Groq → OpenRouter |
