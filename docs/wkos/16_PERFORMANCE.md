# 16_PERFORMANCE.md — Performance e Build
> Status: **Estável** | Audiência: Dev + Infra

---

## Métricas de Build (Vite 5.4)

| Bundle | Tamanho estimado | Conteúdo |
|---|---|---|
| `vendor.js` | ~180 KB (gz) | React + React-DOM |
| `jszip.js` | ~60 KB (gz) | JSZip (lazy loaded) |
| `icons.js` | ~15 KB (gz) | Lucide React (tree-shaken) |
| `index.js` | ~120 KB (gz) | Código da aplicação |

**Estratégia de code splitting:** Vite divide automaticamente bibliotecas grandes em chunks separados. `jszip` é importado via `import()` dinâmico apenas quando necessário (download de ZIP).

---

## Bottlenecks Conhecidos

### 1. Timeout do Worker (45s total)
O Cloudflare Worker tenta 3 providers em sequência com timeouts acumulativos:
- Gemini: 12s timeout
- Groq: 15s timeout
- OpenRouter: 20s timeout
- Total worst-case: ~47s

**Impacto:** O usuário fica sem feedback por até 45s durante refinamento.
**Mitigação atual:** Status `'refining'` + spinner
**Solução ideal:** Streaming de resposta do Worker (requer ReadableStream)

### 2. `elementor-mapper.ts` (~600 linhas)
O arquivo mais pesado da aplicação — processado synchronously no thread principal.

**Impacto:** Pode causar janks perceptíveis em páginas com 10+ seções e 100+ nós.
**Mitigação atual:** DOMParser nativo (mais rápido que alternativas)
**Solução ideal:** Web Worker para processamento pesado

### 3. Sem Skeleton de Loading
Durante `parsing` e `mapping`, o OutputPanel fica vazio.

**Impacto:** UX pobre — usuário não sabe se a conversão está progredindo
**Solução ideal:** Skeleton cards com animação pulse

### 4. Sem Lazy Loading de Componentes
Todos os componentes são carregados na inicialização, incluindo `ConfigDashboard` (modal raro).

**Solução ideal:** `React.lazy(() => import('./ConfigDashboard'))` para componentes de baixa frequência

---

## DOMParser Nativo

O `html-parser.ts` usa `DOMParser` nativo do browser (sem cheerio, jsdom ou parse5):

```typescript
const parser = new DOMParser()
const doc = parser.parseFromString(html, 'text/html')
```

**Vantagens:**
- Zero dependência adicional no bundle
- Parser mais rápido disponível (C++ nativo no browser)
- Suporte nativo a HTML5 (self-closing tags, malformed HTML)

**Desvantagem:**
- Disponível apenas em browser (testes precisam de happy-dom)
- Sem opções de configuração avançada

---

## Análise de Canvas API

O `image-analyzer.ts` usa Canvas API para análise heurística de imagem:

```typescript
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
```

**Performance:** O-linear na resolução da imagem. Para imagens de 1920×1080 = 8.3M pixels → ~33MB de dados RGBA em memória.

**Mitigação:** Redimensionar imagens para 800px de largura antes da análise (não implementado).

---

## Recomendações Futuras

| Melhoria | Impacto | Esforço | Roadmap |
|---|---|---|---|
| Streaming de resposta do Worker | Elimina 45s de espera cega | Alto | Sprint 3+ |
| Web Worker para o mapper | Zero janks em páginas grandes | Médio | Sprint 3 |
| Skeleton loading | UX significativamente melhor | Baixo | Sprint 2 |
| Lazy loading de modais | Reduz bundle inicial ~10% | Baixo | Sprint 2 |
| Redimensionar imagens antes de análise | Reduz uso de memória | Baixo | Sprint 2 |
| Service Worker + Cache | Reutiliza análises anteriores | Alto | V2 |
| Análise multi-pass por seção (DCGen) | +15% fidelidade visual | Alto | Sprint 2A |

---

## Métricas a Monitorar

| Métrica | Alvo | Como medir |
|---|---|---|
| Tempo de parsing (HTML → LayoutNode[]) | < 500ms | `performance.now()` antes/depois |
| Tempo de mapping (LayoutNode[] → JSON) | < 1s | `performance.now()` antes/depois |
| Tempo total de conversão (excl. IA) | < 2s | ConversionStatus timeline |
| Tempo de resposta do Worker /refine | < 15s (P95) | Cloudflare Worker analytics |
| Bundle size total (gzipped) | < 400KB | `npm run build` output |
