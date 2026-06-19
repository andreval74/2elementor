# 21_ADR.md — Architecture Decision Records
> Registro histórico de decisões técnicas relevantes
> Status: **Vivo** | Adicionar nova entrada para cada decisão arquitetural

---

## Formato

```
## ADR-NNN — Título da Decisão
**Data:** YYYY-MM-DD
**Status:** Aceita | Substituída por ADR-NNN | Revogada
**Contexto:** [o problema que motivou a decisão]
**Decisão:** [o que foi decidido]
**Consequências:** [o que muda, o que fica mais difícil, o que fica mais fácil]
```

---

## ADR-001 — DOMParser Nativo para Parsing HTML

**Data:** 2026-01-01
**Status:** Aceita

**Contexto:** O projeto precisava de um parser HTML para converter strings HTML em uma árvore de nós. As opções eram: cheerio (jQuery-like, 40KB gzip), htmlparser2 (rápido mas low-level), jsdom (pesado, para Node.js), ou DOMParser nativo.

**Decisão:** Usar `DOMParser` nativo do browser. Zero dependência adicional no bundle.

**Consequências:**
- Positivo: Bundle 40–100KB menor; parser C++ mais rápido que JS; suporte nativo HTML5
- Negativo: Indisponível no Node.js (requer happy-dom nos testes); sem CSS Selector support (usa TreeWalker)
- Neutro: Ambiente de teste requer `happy-dom` (substituto fiel do DOMParser)

---

## ADR-002 — Spread-based Patching (Sem Mutação)

**Data:** 2026-01-01
**Status:** Aceita

**Contexto:** O EDIT MODE precisa aplicar mudanças em um `ElementorTemplate` existente sem destruir configurações, IDs ou conteúdo fora do escopo da mudança.

**Decisão:** `snapshot-patcher.ts` usa spread operator exclusivamente. Nenhum objeto é mutado — cada operação retorna uma cópia nova.

```typescript
// PROIBIDO (mutação)
template.content[i].settings.title = 'Novo Título'

// OBRIGATÓRIO (spread)
const updated = { ...element, settings: { ...element.settings, title: 'Novo Título' } }
```

**Consequências:**
- Positivo: Zero risco de mutação acidental; operações são reversíveis; fácil de debugar
- Negativo: Maior uso de memória para páginas com 100+ widgets (microscopicamente)
- Neutro: Padrão já familiar em React (setState imutável)

---

## ADR-003 — localStorage para Histórico (Fase 1)

**Data:** 2026-01-01
**Status:** Aceita

**Contexto:** A V1 precisava de histórico de conversões sem backend. As opções eram: localStorage, IndexedDB, ou sem persistência.

**Decisão:** localStorage com `MAX_HISTORY = 5` entradas recentes.

**Consequências:**
- Positivo: Zero dependência de backend; interface idêntica à futura API (chave/valor); sem configuração
- Negativo: Limitado a ~5MB; sem sync entre abas/dispositivos; sem busca
- Migração futura: `useHistory.ts` tem interface `get/set/clear` idêntica à que uma API REST exigiria

---

## ADR-004 — Cloudflare Worker como Proxy de IA

**Data:** 2026-01-01
**Status:** Aceita

**Contexto:** As chaves de API de IA (Gemini, Groq, OpenRouter) não podem ser expostas no bundle JavaScript do frontend.

**Decisão:** Cloudflare Worker em `cloudflare-worker/index.js` atua como proxy. Frontend não conhece as chaves — apenas a URL do Worker.

**Consequências:**
- Positivo: Chaves seguras no Worker; CORS controlado por `ALLOWED_ORIGIN`; Gratuito (100k req/dia)
- Negativo: Latência adicional de ~50ms; dependência de Cloudflare; timeout máximo de 30s por request
- Neutro: Worker é stateless — sem banco de dados, sem auth

---

## ADR-005 — section→column→widget para Layouts Tailwind

**Data:** 2026-01-01
**Status:** Aceita

**Contexto:** Layouts modernos com Tailwind CSS têm CSS complexo (gradients, glows, animações) que não têm equivalente direto em widgets Elementor nativos.

**Decisão:** Para elementos sem mapeamento nativo, usar `container → column → widget(html)` com o HTML original injetado como string. Um `<style>` isolado é adicionado a cada widget html.

```json
{
  "elType": "container",
  "elements": [{
    "elType": "column",
    "elements": [{
      "elType": "widget",
      "widgetType": "html",
      "settings": {
        "html": "<style>.btn-gold {...}</style><button class=\"btn-gold\">..."
      }
    }]
  }]
}
```

**Consequências:**
- Positivo: 100% do CSS preservado; funciona sem plugin extra; layout pixel-perfect
- Negativo: Widget `html` não é editável visualmente no Elementor (usuário vê código)
- Neutro: `<style>` isolado por widget evita conflitos entre seções

---

## ADR-006 — Deduplicação de Seções com Numeração

**Data:** 2026-06-17
**Status:** Aceita

**Contexto:** Páginas com múltiplos headers (multi-step forms, sub-navegações) geravam 2–3 seções com nome idêntico ("Cabeçalho / Nav"), confundindo o usuário e sobrescrevendo arquivos de exportação.

**Decisão:** Em `section-detector.ts`, a primeira ocorrência de cada tipo mantém o nome original e o `outputFile` original. Ocorrências subsequentes recebem `#N` no label e `-N` no filename:
- 1ª: `"Cabeçalho / Nav"` → `header.json`
- 2ª: `"Cabeçalho / Nav #2"` → `header-2.json`
- 3ª: `"Cabeçalho / Nav #3"` → `header-3.json`

**Consequências:**
- Positivo: Nomes únicos; arquivos únicos; sem confusão para usuário
- Negativo: Nenhum
- Alternativa descartada: numerar TODAS as ocorrências (#1, #2, #3) — confuso quando há apenas uma

---

## ADR-007 — createPortal para Modais

**Data:** 2026-06-17
**Status:** Aceita

**Contexto:** O `SectionPreview` modal precisava sobrepor toda a tela incluindo a coluna de cards. Renderizado dentro da árvore React normal, sofreria `overflow: hidden` e `z-index` da coluna pai.

**Decisão:** Usar `ReactDOM.createPortal(node, document.body)` para renderizar o modal diretamente no `<body>`, fora de qualquer container com overflow.

**Consequências:**
- Positivo: Zero conflito de z-index; funciona em qualquer contexto
- Negativo: Evento de clique não borbulha naturalmente; requer ESC handler explícito
- Neutro: Padrão estabelecido no React para modais e tooltips

---

## ADR-008 — Estratégia Híbrida para Fidelidade Máxima

**Data:** 2026-06-18
**Status:** Draft (aguardando aprovação do usuário)

**Contexto:**
Atualmente o sistema usa uma estratégia híbrida básica:
- Elementos simples mapeados para widgets nativos
- Elementos complexos/Tailwind mapeados para `widget(html)`

Os usuários estão reportando que a conversão perde detalhes:
- Gradientes, sombras, glows e opacidade
- Responsividade breakpoints
- Animações
- Configurações específicas de widgets
- Imagens referenciadas no CSS

As opções consideradas foram:
1. **Opção 1 (Só Widgets Nativos):** Tentar mapear 100% do CSS para Elementor settings
   - Prós: Layouts editáveis
   - Contras: Muitos CSS não tem equivalente Elementor; fidelidade baixa
2. **Opção 2 (Só Widget HTML):** Colocar TUDO em `widget(html)`
   - Prós: 100% de fidelidade
   - Contras: Nada é editável visualmente; UX ruim
3. **Opção 3 (Estratégia Híbrida Inteligente — Escolhida):** Usar IA para decidir por seção
   - Prós: Melhor balanceamento entre editabilidade e fidelidade; inteligente
   - Contras: Requer prompts específicos e validação

**Decisão:**
Implementar a **Estratégia Híbrida Inteligente**:
- **Para cada seção**, usar a IA Vision para decidir automaticamente:
  a) "Modo Nativo": Se o layout é simples → mapear para widgets nativos com o máximo de CSS convertido
  b) "Modo Preservação Total": Se o layout é complexo (gradientes/glows/animações) → usar widget html
- **Melhorar o Mapeamento Nativo**:
  - Expandir o `elementor-mapper.ts` para mapear:
    - Mais propriedades CSS (cores, espaçamentos, bordas, sombras, gradientes, tipografia)
    - Breakpoints responsivos (mobile/tablet/desktop)
    - Motion Effects (animações de entrada)
    - Backgrounds de imagem
- **Smart Fallback**:
  - Se o mapeamento nativo não consegue preservar 80% do visual, automaticamente voltar para modo widget html

**Consequências:**
- Positivo: Balança editabilidade e fidelidade; usa IA para tomar decisões inteligentes; melhor UX para o usuário final
- Negativo: Requer mais chamadas de IA; mais complexidade no código; precisa validar a decisão da IA
- Neutro: Mantém a arquitetura existente; evolui incrementalmente; não quebra o que já funciona
