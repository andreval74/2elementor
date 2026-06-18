# 15_TESTING.md — Suite de Testes
> Fonte: `src/test/` | Status: **Estável** | Rodar: `npm test`

---

## Visão Geral

| Métrica | Valor |
|---|---|
| Total de testes | 70+ |
| Arquivos de teste | 7 |
| Framework | Vitest 2.1 |
| Ambiente | happy-dom 15 |
| Cobertura de serviços core | ✅ Alta |
| Cobertura de serviços novos | ⚠️ Baixa (ver lacunas) |

---

## Arquivos de Teste

| Arquivo | Cobertura | Testes aprox. |
|---|---|---|
| `html-parser.test.ts` | `html-parser.ts` | ~15 |
| `section-detector.test.ts` | `section-detector.ts` | ~12 |
| `elementor-mapper.test.ts` | `elementor-mapper.ts` | ~15 |
| `elementor-exporter.test.ts` | `elementor-exporter.ts` | ~10 |
| `validator.test.ts` | `validator.ts` | ~10 |
| `zip-handler.test.ts` | `zip-handler.ts` | ~5 |
| `token-resolver.test.ts` | `token-resolver.ts` | ~8 |

---

## Fixtures Disponíveis

Localizadas em `src/test/fixtures/` (ou inline nos arquivos de teste):

| Fixture | Descrição |
|---|---|
| `FX_HERO` | HTML de seção hero simples com heading e CTA |
| `FX_FAQ` | HTML de FAQ com 3 perguntas em accordion |
| `FX_CTA` | HTML de CTA com botão WhatsApp |
| `FX_FOOTER` | HTML de footer com links e redes sociais |
| `FX_FULL_PAGE` | HTML completo com 5+ seções encadeadas |
| `FX_EDGE_EFFECTS` | HTML com glows, animações Tailwind, SVG inline |
| `FX_TAILWIND_COMPLEX` | Grid Tailwind com 6 cards de serviços |
| `FX_VIDEO_SECTION` | Seção com iframe YouTube embutido |

---

## Como Rodar os Testes

```bash
# Todos os testes (uma vez)
npm test

# Modo watch (re-roda ao salvar)
npm run test:watch

# Com cobertura
npm run test:coverage

# Arquivo específico
npx vitest src/test/validator.test.ts
```

---

## Como Adicionar Novo Teste

### 1. Criar arquivo de teste (serviço novo)

```typescript
// src/test/meu-servico.test.ts
import { describe, it, expect } from 'vitest'
import { minhaFuncao } from '../services/meu-servico'

describe('meuServico', () => {
  describe('minhaFuncao', () => {
    it('deve retornar X quando Y', () => {
      const input = { ... }
      const result = minhaFuncao(input)
      expect(result).toEqual({ ... })
    })
  })
})
```

### 2. Adicionar caso em arquivo existente

```typescript
// em elementor-mapper.test.ts
it('deve mapear <hr> para widget divider', () => {
  const section = createSection([createNode('hr', 'divider')])
  const result = mapSectionsToElementor([section])
  expect(result[0].elements[0].widgetType).toBe('divider')
})
```

### 3. Adicionar nova fixture

```typescript
// No arquivo de teste ou em fixtures/index.ts
export const FX_NOVA_FIXTURE = `
  <section id="minha-secao">
    ...
  </section>
`
```

---

## Lacunas de Cobertura

Os seguintes serviços **não têm testes** ainda:

| Serviço | Motivo | Prioridade |
|---|---|---|
| `visual-validator.ts` | Criado na Fase 3 sem testes | HIGH |
| `quality-gate.ts` | Criado na Fase 3 sem testes | HIGH |
| `page-snapshot.ts` | Criado na Fase 3 sem testes | HIGH |
| `snapshot-diff.ts` | Criado na Fase 3 sem testes | HIGH |
| `snapshot-patcher.ts` | Criado na Fase 3 sem testes | HIGH |
| `structural-validator.ts` | Criado na Fase 3 sem testes | MEDIUM |
| `structural-corrector.ts` | Criado na Fase 3 sem testes | MEDIUM |
| `ai-refiner.ts` | Requer mock de fetch | LOW |
| `vision-registry.ts` | Requer mock de File + providers | LOW |
| `SectionCard` (UI) | Requer testes de componente React | MEDIUM |
| `SectionPreview` (UI) | Requer testes de createPortal | LOW |

---

## Padrão de Testes

```typescript
describe('nomeDoModulo', () => {
  describe('nomeDaFuncao', () => {
    it('deve [comportamento esperado] quando [condição]', () => {
      // Arrange
      const input = ...
      // Act
      const result = nomeDaFuncao(input)
      // Assert
      expect(result).toEqual(...)
    })

    it('deve lançar erro quando input é inválido', () => {
      expect(() => nomeDaFuncao(null)).toThrow()
    })
  })
})
```

---

## Configuração Vitest

```typescript
// vite.config.ts
test: {
  environment: 'happy-dom',
  globals: true,
}
```

`happy-dom` fornece `DOMParser`, `document`, `window` sem browser real — permite testar `html-parser.ts` que usa `DOMParser` nativo.
