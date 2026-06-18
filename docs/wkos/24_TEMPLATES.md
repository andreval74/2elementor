# 24_TEMPLATES.md — Templates de Documentação
> Copie e preencha. Não alterar os campos obrigatórios.

---

## Template de ADR (Architecture Decision Record)

```markdown
## ADR-NNN — [Título da Decisão]

**Data:** YYYY-MM-DD
**Status:** Draft | Aceita | Substituída por ADR-NNN | Revogada
**Proposto por:** [nome ou papel]

### Contexto
[Descreva o problema ou situação que motivou a decisão. O que está tentando ser resolvido? Quais são as forças em jogo?]

### Opções Consideradas
1. **[Opção A]** — [descrição curta]
2. **[Opção B]** — [descrição curta]
3. **[Opção C]** — [descrição curta] ← escolhida

### Decisão
[O que foi decidido e por quê. Por que essa opção foi escolhida sobre as outras?]

### Consequências

**Positivas:**
- [o que fica melhor]

**Negativas:**
- [o que fica mais difícil ou pior]

**Neutras:**
- [observações relevantes sem julgamento]
```

---

## Template de SPEC (Feature Specification)

```markdown
# SPEC-NNN: [Título da Feature]

**Status:** 📝 Planejado | 📋 Especificado | 🔨 Em Implementação | ✅ Entregue | ❌ Cancelado
**Prioridade:** CRITICAL | HIGH | MEDIUM | LOW
**Sprint:** [Sprint N]
**Criado em:** YYYY-MM-DD

---

## Problema
[Qual problema esta feature resolve? Seja específico — qual comportamento atual causa dor para o usuário?]

---

## Objetivo
[O que o usuário consegue fazer após esta feature que não conseguia antes? 2–3 frases.]

---

## Motivação
[Por que agora? O que torna isso prioritário? Dados, feedback de usuário, ou necessidade de produto?]

---

## Escopo
[Liste explicitamente o que está incluído nesta spec.]
- Feature A
- Feature B
- Feature C

---

## Fora de Escopo
[Liste o que NÃO está incluído — evita scope creep durante implementação.]
- X (motivo)
- Y (motivo)

---

## Arquitetura
[Diagrama ou descrição de como vai funcionar tecnicamente. Novos tipos, novos componentes, mudanças em hooks.]

---

## UX
[Mockup ASCII ou descrição do que o usuário vai ver. Fluxo de interação.]

---

## Critérios de Aceite
[Lista de verificação — a feature está DONE quando todos os itens estiverem ✅]
- [ ] Critério 1
- [ ] Critério 2
- [ ] Build 0 erros TypeScript
- [ ] N novos testes passando

---

## Plano de Migração
[Se há código existente que será substituído, como garantir zero regressão?]

---

## Rollback
[Como reverter se algo der errado em produção? Feature flag? 1 commit de revert?]
```

---

## Template de Bug Report

```markdown
## Bug: [Título curto]

**Severidade:** P0 (bloqueador) | P1 (crítico) | P2 (importante) | P3 (menor)
**Encontrado em:** [versão ou commit]
**Data:** YYYY-MM-DD

### Comportamento Atual
[O que acontece hoje que está errado? Seja específico.]

### Comportamento Esperado
[O que deveria acontecer?]

### Passos para Reproduzir
1. [Passo 1]
2. [Passo 2]
3. [Resultado errado]

### Contexto Adicional
- HTML de entrada: [link ou snippet curto]
- Erro no console: [se houver]
- Screenshot: [se relevante]

### Hipóteses de Causa
1. [Hipótese mais provável]
2. [Hipótese alternativa]

### Status
- [ ] Documentado
- [ ] Investigado
- [ ] Fix implementado
- [ ] Teste adicionado
- [ ] CHANGELOG atualizado
```

---

## Template de Feature Request

```markdown
## Feature Request: [Título]

**Solicitado por:** [papel ou usuário]
**Data:** YYYY-MM-DD
**Prioridade sugerida:** HIGH | MEDIUM | LOW

### Problema que resolve
[Qual dor de usuário ou gap de produto esta feature endereça?]

### Proposta
[Como você imagina que funcionaria? UX básico, não precisa ser técnico.]

### Impacto estimado
[Para quantos usuários? Com que frequência? Qual o valor entregue?]

### Notas técnicas (opcional)
[Alguma restrição técnica conhecida? Alguma dependência?]

### Próximos passos
- [ ] Avaliar prioridade vs. backlog
- [ ] Criar SPEC se aprovado
- [ ] Adicionar ao roadmap
```

---

## Template de PR Description

```markdown
## O que muda

[1–3 bullets com o que foi alterado e por quê]

- feat: adiciona X para resolver Y
- fix: corrige Z que causava W em determinada situação
- refactor: extrai lógica de A para melhor reutilização

## Como testar

- [ ] Carregar HTML com [tipo de página] → verificar [comportamento]
- [ ] Clicar em [botão] → verificar [resultado esperado]
- [ ] Comportamento anterior ainda funciona: [cenário de regressão]

## Checklist

- [ ] `npm run build` → 0 erros
- [ ] `npm test` → todos passando (N/N)
- [ ] CHANGELOG atualizado
- [ ] Nenhum `console.log` sem `[DEBUG]`
- [ ] Nenhum arquivo `.env` incluído
```
