# 14_DOCUMENTATION_STANDARDS.md — Padrões de Documentação
> Status: **Estável** | Audiência: Todos

---

## Princípio

A documentação do WKOS é uma **ferramenta de trabalho**, não um arquivo histórico. Ela deve ser **sempre verdadeira** — se o código divergir dos docs, os docs estão errados.

**Regra de ouro:** Um doc desatualizado é pior que nenhum doc. Prefira doc curto e correto a doc longo e parcialmente errado.

---

## Quando Atualizar Cada Arquivo

| Evento | Arquivos a Atualizar Obrigatoriamente |
|---|---|
| Nova feature deployada | `05_ARCHITECTURE.md` (se novo módulo), `07_PIPELINE.md` (se novo fluxo), `20_CHANGELOG.md`, `governance/CURRENT_STATE.md` |
| Bug corrigido | `20_CHANGELOG.md`, `governance/KNOWN_ISSUES.md` (marcar como resolvido) |
| Nova decisão técnica | `21_ADR.md` + arquivo afetado |
| Nova spec aprovada | `22_SPECIFICATIONS.md` |
| Sprint concluído | `governance/PROJECT_STATUS.md` (score), `governance/NEXT_TASK.md` |
| Release publicada | `20_CHANGELOG.md`, `governance/RELEASE_STATUS.md` |
| Bug conhecido documentado | `governance/KNOWN_ISSUES.md` |
| Dívida técnica identificada | `governance/TECH_DEBT.md` |

---

## Formato de Arquivo WKOS

### Cabeçalho obrigatório

```markdown
# NN_NOME.md — Título do Documento
> Fonte: `caminho/do/arquivo.ts` | Status: **[Draft|Review|Estável]** | Audiência: [Todos|Dev|CTO|...]
```

### Status possíveis

| Status | Significado |
|---|---|
| **Draft** | Rascunho — conteúdo pode estar incompleto ou incorreto |
| **Review** | Em revisão — conteúdo escrito, aguarda validação |
| **Estável** | Aprovado — conteúdo correto e refletindo estado atual |

---

## Como Criar Novo Arquivo WKOS

1. Verificar se o conteúdo não pertence a um arquivo existente (atualizar é preferível a criar)
2. Escolher número sequencial disponível
3. Criar em `docs/wkos/NN_NOME.md` com cabeçalho padrão e status `Draft`
4. Adicionar entrada em `00_INDEX.md` (tabela da seção correspondente)
5. Preencher conteúdo
6. Mudar status para `Review` → revisão → `Estável`

---

## Como Atualizar Arquivo Existente

1. Localizar a seção específica que mudou
2. Editar apenas aquela seção
3. Não reescrever o arquivo inteiro — preservar context e links existentes
4. Se mudança é grande, atualizar a data no cabeçalho

---

## O que NÃO pertence ao WKOS

| Conteúdo | Onde vai |
|---|---|
| Comentários de código | No próprio arquivo `.ts` |
| Histórico de PR | GitHub PR description |
| Notas de sessão de trabalho | Memória do assistente (`.claude/`) |
| Configuração de ambiente local | `.env.local` |
| Decisões pendentes | `governance/NEXT_TASK.md` |

---

## Arquivos em `prompts/`

Os arquivos em `prompts/` são a **referência técnica primária** do projeto e não devem ser removidos. O WKOS os organiza e complementa:

| Arquivo `prompts/` | Relação com WKOS |
|---|---|
| `ARCHITECTURE.md` | Fonte para `05_ARCHITECTURE.md` + `07_PIPELINE.md` |
| `PROMPT.md` | Fonte para `02_PRODUCT_MANIFEST.md` + `06_AI_MANIFEST.md` |
| `DEVELOPMENT_RULES.md` | Fonte para `04_ENGINEERING_PRINCIPLES.md` + `13_CODING_STANDARDS.md` |
| `PAGE_EVOLUTION.md` | Fonte para `25_EVOLUTION_SYSTEM.md` |
| `VISION.md` | Fonte para `01_VISION.md` |
| `HTML-GENERATION.md` | Fonte para `23_PLAYBOOKS.md` (Playbook 1) |

Quando o arquivo `prompts/` for atualizado, o WKOS correspondente deve ser atualizado também.

---

## Templates

Ver `24_TEMPLATES.md` para templates de:
- ADR (Architecture Decision Record)
- SPEC (Specification)
- Bug report
- Feature request

---

## Governança dos Docs de Governança

Os 6 arquivos em `governance/` são os **mais dinâmicos** — devem ser atualizados com maior frequência:

| Arquivo | Frequência de Atualização |
|---|---|
| `CURRENT_STATE.md` | A cada feature entregue |
| `NEXT_TASK.md` | A cada inicio/fim de sprint |
| `KNOWN_ISSUES.md` | A cada bug documentado ou resolvido |
| `TECH_DEBT.md` | A cada dívida identificada ou quitada |
| `PROJECT_STATUS.md` | Mensalmente ou por sprint |
| `RELEASE_STATUS.md` | A cada release |
