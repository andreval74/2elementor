# governance/TECH_DEBT.md — Dívida Técnica (Sumário)
> Sumário executivo. Ver `18_TECH_DEBT.md` para detalhes completos de cada item.
> **Última atualização:** 2026-06-17

---

## Resumo

| Severidade | Quantidade | Esforço Total Estimado |
|---|---|---|
| CRITICAL | 2 | ~6h |
| HIGH | 5 | ~21h |
| MEDIUM | 4 | ~2d |
| LOW | 3 | ~2h |

---

## CRITICAL (Resolver em < 1 semana)

| ID | Item | Esforço |
|---|---|---|
| CRIT-001 | CHANGELOG raiz desatualizado (Fases 2–5 não documentadas) | 2h |
| CRIT-002 | `elementor-mapper.ts` (~600 linhas) viola regra de 250 | 4h |

---

## HIGH (Resolver neste sprint ou próximo)

| ID | Item | Esforço |
|---|---|---|
| HIGH-001 | Score de qualidade invisível na UI | 3h |
| HIGH-002 | 7 serviços críticos sem cobertura de testes | 8h |
| HIGH-003 | Divergência prompt vision worker↔frontend | 4h |
| HIGH-004 | URL import sem spec | 1h (spec) |
| HIGH-005 | refineSection sem rawHtml em VISION MODE | 4h |

---

## MEDIUM (Próximo mês)

| ID | Item | Esforço |
|---|---|---|
| MED-001 | Layout não responsivo em mobile | 1d |
| MED-002 | Sem skeleton de loading | 3h |
| MED-003 | `prompts/PLANO.md` obsoleto | 30min |
| MED-004 | Sem badge "modificada" por seção | 2h |

---

## LOW (Quando houver tempo)

| ID | Item | Esforço |
|---|---|---|
| LOW-001 | `ROADMAP.md` raiz desatualizado | 1h |
| LOW-002 | `webkeeper-demo.html` sem documentação | 30min |
| LOW-003 | `.env.example` incompleto para Worker | 30min |

---

## Itens Quitados Recentemente

| Data | Item |
|---|---|
| Jun 2026 | Seções duplicadas com mesmo nome |
| Jun 2026 | Preview de seção truncado |
| Jun 2026 | Contador de refines invisível |
| Jun 2026 | Timeout Gemini muito longo (18s → 12s) |
| Jun 2026 | Worker sem fallback OpenRouter no /refine |
