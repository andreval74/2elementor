# 06_AI_MANIFEST.md — Manifesto de IA
> Fonte: `prompts/PROMPT.md` + `cloudflare-worker/index.js` | Status: **Estável**

---

## Arquitetura de IA

O sistema tem **duas camadas de IA independentes**:

```
CAMADA 1 — VISION (análise de imagem)
  Frontend → Vision Registry → Provider cascade (5 providers)
  Endpoint: /vision no Worker

CAMADA 2 — REFINE (refinamento de JSON)
  Frontend → ai-refiner.ts → Worker /refine
  Worker: cascata Gemini → Groq → OpenRouter
```

---

## Camada 1: Vision (Análise de Imagem)

### Providers Frontend (5 providers, em ordem de tentativa)
| Provider | Modelo | Rota |
|---|---|---|
| Gemini | gemini-2.0-flash | API direta via `VITE_GEMINI_KEY` |
| OpenRouter | google/gemini-2.0-flash | `https://openrouter.ai/api/v1` |
| OpenRouter | meta-llama/llama-4-scout | `https://openrouter.ai/api/v1` |
| Groq | meta-llama/llama-4-scout-17b-16e-instruct | `https://api.groq.com/openai/v1` |
| Claude (via Worker proxy) | claude-haiku-4-5 | `VITE_PROXY_URL/vision` |

### Vision System Prompt
O prompt de visão instrui o modelo a:
- Identificar seções visíveis na imagem (header, hero, services, cases, faq, cta, footer, about)
- Para cada seção: detectar elementos (heading, subheading, image, button, list, text, form, video)
- Extrair cores primárias da paleta visual
- Extrair fontes por categoria (heading, body)
- Estimar animações/efeitos (glow, gradient, parallax)
- Retornar JSON estruturado `UIAnalysisResult`

### Variáveis de Ambiente (Frontend)
```env
VITE_GEMINI_KEY=                 # Google AI Studio
VITE_OPENROUTER_KEY=             # openrouter.ai
VITE_GROQ_KEY=                   # console.groq.com
VITE_PROXY_URL=https://2elementor.web3cafe.workers.dev
```

---

## Camada 2: Refine (Refinamento de JSON Elementor)

### Worker: Cascata de Providers

```
POST /refine (body: { html, json })
  │
  ├─ [1] Gemini 2.5 Flash (gemini-2.5-flash)
  │       Timeout: 12s | Fallback → [2]
  │
  ├─ [2] Groq Llama 4 Scout (llama-4-scout-17b-16e-instruct)
  │       Timeout: 15s | Fallback → [3]
  │
  └─ [3] OpenRouter Llama 4 Scout (meta-llama/llama-4-scout:free)
          Timeout: 20s | Error se falhar
```

### Refine System Prompt (Worker)
O prompt instrui o modelo a:
- Receber HTML da seção original + JSON Elementor atual
- Melhorar o JSON mantendo fidelidade visual ao HTML
- Não remover widgets, apenas melhorar settings
- Retornar APENAS JSON puro (sem markdown, sem texto extra)
- Preservar todos os IDs hexadecimais
- Manter hierarquia container→column→widget

### Variáveis de Ambiente (Worker Cloudflare)
```env
GEMINI_KEY=                      # Google AI Studio
GROQ_KEY=                        # console.groq.com
OPENROUTER_KEY=                  # openrouter.ai
ALLOWED_ORIGIN=https://seudominio.com.br
```

---

## Endpoint `/refine` — Protocolo

### Request
```json
POST https://2elementor.web3cafe.workers.dev/refine
Content-Type: application/json

{
  "html": "<section>...</section>",
  "json": "{\"title\":\"hero\",\"type\":\"page\",\"version\":\"0.4\",...}"
}
```

### Response (sucesso)
```json
{
  "result": "{\"title\":\"hero\",\"type\":\"page\",\"version\":\"0.4\",...}"
}
```

### Response (erro)
```json
{
  "error": "All AI providers failed"
}
```

---

## Endpoint `/vision` — Protocolo

### Request
```json
POST https://2elementor.web3cafe.workers.dev/vision
Content-Type: application/json

{
  "image": "data:image/png;base64,..."
}
```

### Response
```json
{
  "result": "{...UIAnalysisResult...}"
}
```

---

## Regra de Sincronização de Prompts

O Worker em `cloudflare-worker/index.js` contém os prompts de refinamento. Os providers frontend em `src/services/providers/` contêm os prompts de visão.

**Regra:** Quando um prompt for atualizado, verificar se há versão equivalente no outro lado e sincronizar.

```
Prompt de visão atualizado em providers/ ?
  → Verificar se Worker /vision usa o mesmo prompt
  → Atualizar Worker se divergir

Prompt de refine atualizado no Worker?
  → Verificar se ai-refiner.ts constrói o mesmo contexto
  → Sincronizar se necessário
```

---

## Como Adicionar Novo Provider

Ver Playbook 3 em `23_PLAYBOOKS.md`.

Resumo:
1. Criar `src/services/providers/novo-provider.ts` com função `analyzeWithNovoProvider(file, prompt)`
2. Registrar em `vision-registry.ts` na cascata de tentativas
3. Adicionar `VITE_NOVO_KEY` ao `.env.example`
4. Documentar aqui na tabela de providers
5. Testar com 3 imagens diferentes (simples, complexa, escura)

---

## Integração com `useConversion.ts`

```
refine() (página toda):
  html = result.exports.map(e => section nodes html).join('\n')
  json = pageJson
  → ai-refiner.ts → Worker /refine
  → validateTemplate + runStructuralLoop + validateVisual + runQualityGate
  → setResult({ exports: updatedExports, pageJson: newPageJson })

refineSection(sectionId):
  html = section.nodes.map(n => n.rawHtml ?? '').join('\n')
  json = templateToJson(originalTemplate)
  → ai-refiner.ts → Worker /refine
  → validateTemplate + runStructuralLoop
  → validateVisual + runQualityGate (warnings apenas — não bloqueia)
  → setResult({ exports: updatedExports com seção corrigida })
```

---

## Custos e Limites

| Provider | Custo | Free Tier |
|---|---|---|
| Gemini 2.5 Flash | Gratuito (limitado) | Sim (quota diária) |
| Groq Llama 4 Scout | Gratuito | Sim (rate limited) |
| OpenRouter :free | Gratuito | Sim (créditos) |
| Claude Haiku (proxy) | Pago | Não |
| OpenRouter pago | Pago | Não |

**Estratégia:** Gratuito prioritário → fallback pago apenas se necessário.
