# governance/CURRENT_STATE.md — Estado Atual do Projeto
> Reflete o que está implementado e funcionando em produção
> **Última atualização:** 2026-06-17 | Versão: 1.5.0

---

## Em Produção (Funcional)

### Core — Conversão
- ✅ HTML paste / arquivo → JSON Elementor v0.4
- ✅ ZIP upload → extrai HTML + assets → JSON
- ✅ Imagem / Screenshot → Vision AI → JSON
- ✅ 8 tipos de seção detectados: header, hero, services, cases, faq, cta, footer, about
- ✅ Deduplicação automática de seções duplicadas (#2, #3, `header-2.json`)
- ✅ 9 tokens dinâmicos configuráveis (WhatsApp, email, redes sociais, empresa, telefone)
- ✅ Export: page.json + seções individuais + ZIP completo com assets

### IA — Providers
- ✅ Vision AI: cascata de 5 providers (Gemini, OpenRouter, Groq, Claude proxy)
- ✅ Refine AI: Worker Cloudflare com cascata Gemini → Groq → OpenRouter
- ✅ REFINE MODE global: botão "Re-fazer" refina a página inteira
- ✅ REFINE MODE por seção: botão Wand2 no SectionCard refina apenas 1 seção
- ✅ Badge `×N` no SectionCard contando quantas vezes a seção foi refinada

### EDIT MODE
- ✅ `useConversion.evolve()` — pipeline completo EDIT MODE
- ✅ `page-snapshot.ts` — snapshot estrutural
- ✅ `snapshot-diff.ts` — diff mínimo entre snapshots
- ✅ `snapshot-patcher.ts` — patch cirúrgico spread-based
- ✅ `validateNoRegression()` — verificação anti-regressão

### Validação e Qualidade
- ✅ 4 camadas de validação: template → estrutural → visual → quality gate
- ✅ 8 tipos de violação estrutural com auto-correção (até 3x)
- ✅ Quality Gate: structural×50% + visual×30% + confidence×20%
- ✅ Thresholds por modo: create (55), edit (75), refine (75)

### UI e UX
- ✅ Layout dark mode premium 3 colunas
- ✅ SectionCard com preview (Eye), refine (Wand2), download, copy
- ✅ SectionPreview modal via createPortal (iframe sandboxed + Tailwind CDN)
- ✅ ConfigDashboard — modal de configuração de tokens
- ✅ JsonViewer — syntax highlight roxo/verde/laranja/azul
- ✅ Histórico das últimas 5 conversões (localStorage)

### DevOps
- ✅ Deploy automático: push → GitHub Actions → FTP Hostinger
- ✅ 70 testes unitários (Vitest + happy-dom)
- ✅ TypeScript strict (noUnusedLocals, noUnusedParameters)

### Documentação
- ✅ WKOS com 26 docs de referência + 6 governance files
- ✅ prompts/ com 6 arquivos técnicos de referência

---

## Em Desenvolvimento / Planejado

### Sprint 2 (próximo)
- 📝 Multi-pass por seção (DCGen) — Sprint 2A
- 📝 URL import — Sprint 2B

### Backlog
- 📋 SPEC-001: Smart Export Manager
- 📋 SPEC-002: URL Import
- 📋 Mobile responsivo
- 📋 Score de qualidade visível na UI
- 📋 Skeleton loading

---

## Não Suportado (Confirmado)

- ❌ Mobile / Tablet responsivo
- ❌ Import de JSON Elementor existente (re-import)
- ❌ Import por URL de site ao vivo
- ❌ Export para WPBakery / Divi / Bricks
- ❌ Autenticação / contas de usuário
- ❌ Backend / banco de dados
- ❌ Streaming de resposta da IA
