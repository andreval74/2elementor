# 03_CTO_GUIDE.md — Guia do CTO
> Como evoluir o projeto sem quebrar o que já funciona
> Status: **Estável** | Audiência: Tech Lead + Arquiteto

---

## Princípio Central

**NUNCA reescreva funcionalidades funcionando.**
**NUNCA recrie sistemas completos.**
**SEMPRE evoluir incrementalmente.**
**SEMPRE documentar antes de alterar.**

---

## Antes de Qualquer Alteração

1. Ler `05_ARCHITECTURE.md` — entender o impacto no grafo de dependências
2. Ler `25_EVOLUTION_SYSTEM.md` — se a mudança envolver EDIT MODE
3. Verificar `governance/KNOWN_ISSUES.md` — o bug já foi documentado?
4. Verificar `18_TECH_DEBT.md` — existe dívida técnica relacionada?
5. Rodar `npm test` — confirmar 70/70 antes de qualquer commit

---

## Decision Tree: O que Fazer

```
Chegou uma demanda. O que é?
│
├── Bug reportado
│     └── Documentar em governance/KNOWN_ISSUES.md
│         → Investigar causa raiz (nunca corrigir sintoma)
│         → Fix + novo teste cobrindo o caso
│         → Atualizar 20_CHANGELOG.md
│
├── Feature nova
│     ├── Pequena (≤ 1 arquivo novo, ≤ 2 modificados)
│     │     └── Implementar + teste + CHANGELOG
│     └── Média/Grande
│           └── Criar SPEC em 22_SPECIFICATIONS.md ANTES de codar
│               → Planejar, aprovar, implementar em fases
│
├── Refatoração
│     ├── Exige ADR? (mudança de padrão, nova biblioteca, nova camada)
│     │     └── SIM → criar ADR em 21_ADR.md
│     └── Execução spread-based (nunca substituir inteiro)
│
└── Decisão arquitetural
      └── Sempre ADR em 21_ADR.md com contexto + consequências
```

---

## Quando um ADR é Obrigatório

Criar entrada em `21_ADR.md` quando:
- Nova biblioteca adicionada ao projeto
- Mudança de estratégia de validação
- Alteração de API pública de um hook ou serviço
- Mudança de formato de saída (afeta `.json` exportado)
- Qualquer decisão que seja difícil de reverter

---

## Quando uma SPEC é Obrigatória

Criar entrada em `22_SPECIFICATIONS.md` quando:
- Feature envolve novo componente principal
- Feature envolve novo serviço ou hook
- Feature tem critérios de aceite não óbvios
- Feature será desenvolvida em mais de 1 sessão

---

## Checklist de Release

Antes de fazer push para `main`:

- [ ] `npm run build` → 0 erros TypeScript
- [ ] `npm test` → 70/70 passando (ou mais se novos testes foram adicionados)
- [ ] `20_CHANGELOG.md` atualizado com todas as mudanças
- [ ] `governance/CURRENT_STATE.md` reflete o estado atual
- [ ] `governance/RELEASE_STATUS.md` atualizado
- [ ] Nenhum `console.log` sem `[DEBUG]` no commit
- [ ] Nenhum arquivo `.env` no commit
- [ ] Nenhuma função duplicada (cada função existe em apenas 1 arquivo)

---

## Regras de Gate por Tipo de Mudança

| Tipo | Requer Teste | Requer CHANGELOG | Requer ADR | Requer SPEC |
|---|---|---|---|---|
| Bugfix | ✅ Sim | ✅ Sim | ❌ | ❌ |
| Feature pequena | ✅ Sim | ✅ Sim | Depende | ❌ |
| Feature média/grande | ✅ Sim | ✅ Sim | Depende | ✅ Sim |
| Refatoração | ✅ Sim | ✅ Sim | Se padrão muda | ❌ |
| Decisão arquitetural | N/A | ❌ | ✅ Sim | Depende |
| Doc only | ❌ | ❌ | ❌ | ❌ |

---

## Camadas Intocáveis

Nunca alterar sem análise completa de impacto:

1. **`elementor.types.ts`** — formato Elementor é imutável (v0.4 é o padrão)
2. **`snapshot-patcher.ts`** — spread-based é garantia de não-destruição; qualquer mudança pode causar perda de dados
3. **API pública de `useConversion.ts`** — qualquer remoção de função/prop quebra `App.tsx`
4. **`ELEMENTOR_VERSION = '0.4'`** — não alterar sem pesquisa de compatibilidade Elementor

---

## Como Adicionar Nova Funcionalidade (Passo a Passo)

```
1. Criar SPEC se necessário (22_SPECIFICATIONS.md)
2. Identificar camada correta:
   - Lógica de negócio → src/services/
   - Estado React → src/hooks/
   - UI → src/components/
   - Tipos → src/types/
   - Constantes → src/utils/constants.ts
3. Verificar DRY: a função já existe?
   grep -r "nomeDaFuncao" src/
4. Implementar + JSDoc
5. Adicionar teste em src/test/
6. npm run build (0 erros)
7. npm test (70+/70 passando)
8. Atualizar ARCHITECTURE.md se nova camada/serviço
9. Atualizar CHANGELOG.md
10. Atualizar governance/CURRENT_STATE.md
```

---

## Score do Projeto (2026-06-17)

Ver `governance/PROJECT_STATUS.md` para score completo e atualizado.

Score geral atual: **74/100** — MVP sólido, lacunas em mobilidade, importação de URL e visibilidade do Quality Gate na UI.
