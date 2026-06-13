# VISION.md — Direção Estratégica do Produto
# WebKeeper Elementor Exporter
# Consultar antes de decisões de arquitetura e roadmap

---

## Missão

Permitir que qualquer pessoa transforme uma ideia em uma página profissional em poucos minutos.
Sem conhecimento técnico. Sem necessidade de programação.

---

## Visão de longo prazo

Tornar o WebKeeper Elementor Exporter a **principal plataforma brasileira** para criação, conversão e publicação de páginas profissionais para WordPress — e eventualmente qualquer page builder.

O objetivo não é ser apenas um conversor HTML → Elementor.
O objetivo é ser uma **plataforma completa de criação de páginas**.

---

## Modelo de negócio

### Fase 1 — Gratuito (MVP público — atual)
- App web disponível gratuitamente na Hostinger
- Sem login, sem limite de conversões
- Deploy: GitHub → FTP Hostinger (sem Vercel)
- Objetivo: validar o produto e gerar feedback real

### Fase 2 — Freemium
- Gratuito: N conversões/mês (a definir)
- Pago: ilimitado + funcionalidades avançadas
- Cobrança mensal ou por conversão de página

### Fase 3 — SaaS completo
- Dashboard de usuário com histórico de conversões
- API pública para integrações externas
- Planos: Free / Pro / Agency

---

## Roadmap de versões

### V1 — Conversor (atual)
**Status: em desenvolvimento**
Funcionalidades:
- Importar HTML, ZIP, Imagem
- Detectar seções automaticamente
- Configurar tokens dinâmicos (WhatsApp, e-mail, redes sociais)
- Gerar JSON Elementor (version 0.4)
- Exportar página completa e seções individuais
- Preview visual + validação do JSON

Deploy: HTML estático ou React + Vite → Hostinger via GitHub Actions FTP.

---

### V2 — Biblioteca de Conteúdo
**Adicionar:**
- Biblioteca de Templates prontos
- Biblioteca de Blocos reutilizáveis
- Biblioteca de seções CTA
- Biblioteca de FAQ
- Usuário salva suas seções favoritas

Implicação técnica: introduzir banco de dados (SQLite local ou Supabase).

---

### V3 — Inteligência Artificial
**Permitir geração por linguagem natural:**
> "Crie uma landing page para clínica odontológica"

**Resultado gerado automaticamente:**
- Header com logo e navegação
- Hero com headline + CTA
- Seção de benefícios
- CTA intermediário
- FAQ com 5 perguntas
- Footer com contato

Implicação técnica:
- Integração com API de LLM (Claude, GPT ou similar)
- Ponto de extensão já comentado no código: `// [FUTURE: ai-generate]`

---

### V4 — Integração WordPress Direta
**Publicar sem download manual:**
```
Criar no Exporter
       ↓
Gerar JSON
       ↓
Publicar direto no WordPress
       ↓
Página online
```

Opções técnicas:
1. Plugin WordPress que expõe endpoint REST para receber o JSON
2. Uso da WordPress REST API com autenticação por Application Password
3. Avaliação: plugin apenas se trouxer vantagem real — preferir API REST

Ponto de extensão: `// [FUTURE: wp-plugin]`

---

### V5 — Marketplace de Templates
**Permitir que designers publiquem e vendam:**
- Hero Sections
- Landing Pages completas
- Blocos de FAQ
- Seções de Cases
- Templates de nicho (clínicas, advocacia, e-commerce...)

Receita: comissão por venda.

Implicação técnica: autenticação de usuários, painel de vendedor, sistema de pagamento.

---

### Builders suportados no futuro

| Builder | Status |
|---|---|
| Elementor Free + Pro | ✅ V1 |
| Gutenberg (WordPress nativo) | Futuro |
| Bricks Builder | Futuro |
| Breakdance | Futuro |
| Oxygen Builder | Futuro |

---

### V_FINAL — WebKeeper Cloud
O usuário não precisa de WordPress ou hosting próprio.

```
Criar página no WebKeeper
         ↓
Gerar automaticamente
         ↓
Publicar com 1 clique
         ↓
Página online no domínio WebKeeper Cloud
```

Tudo dentro do ecossistema WebKeeper. Sem WordPress. Sem Hostinger. Sem configuração.

---

## Princípios do produto

| Princípio | Significado |
|---|---|
| **Simplicidade** | Qualquer pessoa usa sem tutorial |
| **Velocidade** | De HTML a página publicada em minutos |
| **Escalabilidade** | Código preparado para crescer sem reescrever |
| **Automação** | Detectar, mapear, exportar — mínimo de cliques |
| **Experiência Premium** | Dark mode, UI refinada, feedback instantâneo |

---

## Implicações técnicas imediatas (V1)

Mesmo no MVP, o código deve ser escrito pensando nas versões futuras:

- **Lógica de conversão em `services/`** (funções puras) → fácil de mover para API REST na V3
- **`localStorage` para histórico** → interface idêntica à futura integração com banco de dados
- **Pontos de extensão comentados** no código → não inventar onde adicionar auth/billing/API
- **Estrutura de pastas separada por responsabilidade** → times diferentes podem trabalhar em paralelo sem conflito
- **Sem lock-in de infra**: deploy hoje no Hostinger, amanhã em qualquer cloud sem reescrever o código

---

## Meta

> Tornar o WebKeeper uma plataforma SaaS capaz de gerar, converter e publicar sites profissionais em escala — começando com o melhor conversor HTML → Elementor do mercado brasileiro.
