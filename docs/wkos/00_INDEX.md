# WKOS — WebKeeper Operating System
> Camada de governança do projeto WebKeeper 2Elementor
> Status: **Ativo** | Versão: 1.0 | Atualizado: 2026-06-17

---

## O que é o WKOS

O WKOS é a camada de documentação e governança que centraliza todo o conhecimento do projeto. É a fonte única da verdade para decisões arquiteturais, padrões de código, estado atual e evolução futura.

**Regra fundamental:** Antes de qualquer alteração no código, consultar o arquivo WKOS correspondente.

---

## Índice Completo

### Produto e Visão
| Arquivo | Propósito | Audiência |
|---|---|---|
| [01_VISION.md](01_VISION.md) | Missão, roadmap de versões, modelo de negócio | Todos |
| [02_PRODUCT_MANIFEST.md](02_PRODUCT_MANIFEST.md) | Filosofia, entradas suportadas, métricas de sucesso | Product + Eng |
| [19_ROADMAP.md](19_ROADMAP.md) | Sprints priorizados por ROI | Product + Eng |
| [20_CHANGELOG.md](20_CHANGELOG.md) | Histórico completo de versões | Todos |

### Engenharia e Arquitetura
| Arquivo | Propósito | Audiência |
|---|---|---|
| [03_CTO_GUIDE.md](03_CTO_GUIDE.md) | Como evoluir o projeto sem quebrar nada | CTO + Tech Lead |
| [04_ENGINEERING_PRINCIPLES.md](04_ENGINEERING_PRINCIPLES.md) | Princípios, convenções, proibições absolutas | Todo Dev |
| [05_ARCHITECTURE.md](05_ARCHITECTURE.md) | Fluxo, módulos, entidades, dependências | Arquiteto + Dev |
| [07_PIPELINE.md](07_PIPELINE.md) | Pipelines CREATE / EDIT / REFINE detalhados | Dev |
| [13_CODING_STANDARDS.md](13_CODING_STANDARDS.md) | Stack, nomenclatura, JSDoc, organização de arquivos | Todo Dev |
| [21_ADR.md](21_ADR.md) | Decisões técnicas registradas (Architecture Decision Records) | Arquiteto |

### IA e Qualidade
| Arquivo | Propósito | Audiência |
|---|---|---|
| [06_AI_MANIFEST.md](06_AI_MANIFEST.md) | Providers, prompts, cascata, variáveis de ambiente | AI Eng |
| [08_QUALITY_GATE.md](08_QUALITY_GATE.md) | Thresholds, pesos, política de bloqueio | QA + Dev |
| [09_VALIDATORS.md](09_VALIDATORS.md) | 4 camadas de validação, tipos de violação | QA + Dev |

### Funcionalidades Core
| Arquivo | Propósito | Audiência |
|---|---|---|
| [10_EXPORT_MANAGER.md](10_EXPORT_MANAGER.md) | O que é exportado, formato ZIP, page_settings | Dev |
| [11_IMPORT_MANAGER.md](11_IMPORT_MANAGER.md) | Inputs suportados, limitações, formatos futuros | Dev + Product |
| [25_EVOLUTION_SYSTEM.md](25_EVOLUTION_SYSTEM.md) | EDIT MODE — regras, filosofia, checklist, pipeline | Dev + Arquiteto |

### UI e Padrões Visuais
| Arquivo | Propósito | Audiência |
|---|---|---|
| [12_UI_GUIDELINES.md](12_UI_GUIDELINES.md) | Design tokens, componentes, convenções UX | Frontend Dev |

### Qualidade e Operações
| Arquivo | Propósito | Audiência |
|---|---|---|
| [14_DOCUMENTATION_STANDARDS.md](14_DOCUMENTATION_STANDARDS.md) | Como atualizar o WKOS | Todos |
| [15_TESTING.md](15_TESTING.md) | Suite de testes, cobertura, como adicionar testes | Dev + QA |
| [16_PERFORMANCE.md](16_PERFORMANCE.md) | Métricas de build, bottlenecks, recomendações | Dev |
| [17_SECURITY.md](17_SECURITY.md) | Variáveis de ambiente, sandbox, CORS | Dev + Infra |
| [18_TECH_DEBT.md](18_TECH_DEBT.md) | Backlog de dívida técnica priorizado | CTO + Dev |

### Referências e Templates
| Arquivo | Propósito | Audiência |
|---|---|---|
| [22_SPECIFICATIONS.md](22_SPECIFICATIONS.md) | Índice de specs + SPEC-001 (Smart Export Manager) | Product + Dev |
| [23_PLAYBOOKS.md](23_PLAYBOOKS.md) | Guias práticos: gerar HTML, adicionar provider, etc. | Dev |
| [24_TEMPLATES.md](24_TEMPLATES.md) | Templates de ADR, spec, PR, bug report | Todos |

---

## Governance (Estado Vivo)

> Estes arquivos refletem o estado atual do projeto. Devem ser atualizados após cada sprint.

| Arquivo | Propósito |
|---|---|
| [governance/PROJECT_STATUS.md](governance/PROJECT_STATUS.md) | Score técnico por dimensão (0–100) |
| [governance/CURRENT_STATE.md](governance/CURRENT_STATE.md) | O que está implementado hoje |
| [governance/NEXT_TASK.md](governance/NEXT_TASK.md) | Próximas tarefas priorizadas |
| [governance/KNOWN_ISSUES.md](governance/KNOWN_ISSUES.md) | Bugs e problemas conhecidos |
| [governance/TECH_DEBT.md](governance/TECH_DEBT.md) | Dívida técnica priorizada |
| [governance/RELEASE_STATUS.md](governance/RELEASE_STATUS.md) | Status da versão atual |

---

## Regra de Atualização

| Evento | Arquivos a Atualizar |
|---|---|
| Nova funcionalidade | `05_ARCHITECTURE.md`, `07_PIPELINE.md`, `20_CHANGELOG.md`, `governance/CURRENT_STATE.md` |
| Bug corrigido | `20_CHANGELOG.md`, `governance/KNOWN_ISSUES.md` |
| Decisão técnica | `21_ADR.md`, `05_ARCHITECTURE.md` |
| Nova spec aprovada | `22_SPECIFICATIONS.md` |
| Sprint concluído | `governance/PROJECT_STATUS.md`, `governance/NEXT_TASK.md` |
| Release publicada | `20_CHANGELOG.md`, `governance/RELEASE_STATUS.md` |

---

## Hierarquia de Documentos

```
WKOS (governança)
  └── prompts/ (referência técnica existente — NÃO remover)
        ├── ARCHITECTURE.md   → alimenta 05_ARCHITECTURE.md
        ├── PROMPT.md         → alimenta 02_PRODUCT_MANIFEST.md + 06_AI_MANIFEST.md
        ├── DEVELOPMENT_RULES.md → alimenta 04_ENGINEERING_PRINCIPLES.md + 13_CODING_STANDARDS.md
        ├── PAGE_EVOLUTION.md → alimenta 25_EVOLUTION_SYSTEM.md
        ├── VISION.md         → alimenta 01_VISION.md
        └── HTML-GENERATION.md → alimenta 23_PLAYBOOKS.md
```

Os arquivos em `prompts/` são preservados como estão. O WKOS os organiza e complementa.
