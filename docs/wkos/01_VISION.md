# 01_VISION.md — Direção Estratégica do Produto
> Fonte: `prompts/VISION.md` | Status: **Estável** | Consultar antes de decisões de roadmap

---

## Missão

Permitir que qualquer pessoa transforme uma ideia em uma página profissional em poucos minutos. Sem conhecimento técnico. Sem necessidade de programação.

---

## Visão de longo prazo

Tornar o WebKeeper 2Elementor a **principal plataforma brasileira** para criação, conversão e publicação de páginas profissionais para WordPress — e eventualmente qualquer page builder.

O objetivo não é ser apenas um conversor HTML → Elementor. O objetivo é ser uma **plataforma completa de criação de páginas**.

---

## Estado Atual (2026-06-17)

| Versão | Status | Features |
|---|---|---|
| **V1 — Conversor** | ✅ **MVP Concluído** | HTML/ZIP/Imagem, 8 tipos de seção, tokens, export ZIP, Quality Gate, EDIT MODE, REFINE MODE por seção |

---

## Roadmap de Versões

### V1 — Conversor ✅ (Concluído)
- Importar HTML, ZIP, Imagem
- Detectar seções automaticamente (header/hero/services/cases/faq/cta/footer/about)
- Configurar 9 tokens dinâmicos (WhatsApp, e-mail, redes sociais, empresa)
- Gerar JSON Elementor v0.4
- Exportar página completa e seções individuais
- Preview visual por seção (iframe)
- Validação em 4 camadas (template → estrutural → visual → quality gate)
- EDIT MODE com snapshot/diff/patch cirúrgico
- Refinamento IA por seção (`refineSection`)

### V2 — Biblioteca de Conteúdo
- Biblioteca de templates prontos
- Biblioteca de blocos reutilizáveis
- Usuário salva seções favoritas
- **Implicação técnica:** introduzir banco de dados (SQLite local ou Supabase)

### V3 — Inteligência Artificial
- Geração por linguagem natural: "Crie uma landing page para clínica odontológica"
- Resultado gerado automaticamente: header, hero, serviços, CTA, FAQ, footer
- **Implicação técnica:** integração com API de LLM (ponto de extensão: `// [FUTURE: ai-generate]`)

### V4 — Integração WordPress Direta
- Publicar sem download manual: Criar → Gerar JSON → Publicar direto no WordPress
- Opção 1: Plugin WordPress que expõe endpoint REST
- Opção 2: WordPress REST API com Application Password
- **Implicação técnica:** ponto de extensão `// [FUTURE: wp-plugin]`

### V5 — Marketplace de Templates
- Designers publicam e vendem: hero sections, landing pages completas, blocos de FAQ
- Receita: comissão por venda
- **Implicação técnica:** autenticação de usuários, painel de vendedor, sistema de pagamento

### V_FINAL — WebKeeper Cloud
- Criar página no WebKeeper → publicar com 1 clique → página online no domínio WebKeeper Cloud
- Sem WordPress, sem Hostinger, sem configuração

---

## Builders Suportados (Atual e Futuro)

| Builder | Status |
|---|---|
| Elementor Free + Pro | ✅ V1 |
| Gutenberg (WordPress nativo) | Futuro |
| Bricks Builder | Futuro |
| Breakdance | Futuro |
| Oxygen Builder | Futuro |
| WPBakery | Sprint 5 |
| Divi | Sprint 5 |

---

## Modelo de Negócio

| Fase | Modelo | Status |
|---|---|---|
| 1 | Gratuito — MVP público, sem login, sem limite | ✅ Ativo |
| 2 | Freemium — N conversões/mês gratuitas + plano pago | Futuro |
| 3 | SaaS — dashboard, histórico, API pública, planos Free/Pro/Agency | Futuro |

---

## Princípios do Produto

| Princípio | Significado |
|---|---|
| **Simplicidade** | Qualquer pessoa usa sem tutorial |
| **Velocidade** | De HTML a página publicada em minutos |
| **Escalabilidade** | Código preparado para crescer sem reescrever |
| **Automação** | Detectar, mapear, exportar — mínimo de cliques |
| **Experiência Premium** | Dark mode, UI refinada, feedback instantâneo |

---

## Meta

> Tornar o WebKeeper uma plataforma SaaS capaz de gerar, converter e publicar sites profissionais em escala — começando com o melhor conversor HTML → Elementor do mercado brasileiro.

---

## Implicações Técnicas para V1 (já implementadas)

- **Lógica em `services/`** (funções puras) → fácil de mover para API REST na V3
- **`localStorage` para histórico** → interface idêntica à futura API de banco de dados
- **Pontos de extensão comentados** no código → `// [FUTURE: ...]`
- **Estrutura por responsabilidade** → times diferentes trabalham em paralelo sem conflito
- **Sem lock-in de infra** → deploy hoje no Hostinger, amanhã em qualquer cloud sem reescrever
