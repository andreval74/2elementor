# 13_CODING_STANDARDS.md — Padrões de Código
> Fonte: `prompts/DEVELOPMENT_RULES.md` | Status: **Estável**

---

## Stack Obrigatório

| Ferramenta | Versão | Propósito |
|---|---|---|
| TypeScript | 5.6+ | Linguagem principal — strict mode obrigatório |
| React | 19 | UI |
| Tailwind CSS | 3.4 | Estilo |
| Vite | 5.4 | Build + dev server |
| Lucide React | 0.441 | Ícones |
| JSZip | 3.10 | Compactação |
| Vitest | 2.1 | Testes unitários |
| happy-dom | 15 | Ambiente de teste (substitui jsdom) |

**Adicionar nova biblioteca:** requer ADR em `21_ADR.md`. Sempre verificar se o stack atual resolve antes.

---

## TypeScript Strict Mode

```json
// tsconfig.json — não alterar sem ADR
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

- **Sem `any`** — sempre usar tipos explícitos
- **Sem variáveis não utilizadas** — TypeScript vai reclamar
- **Sem parâmetros não utilizados** — prefixar com `_` se necessário por contrato

---

## Organização de Arquivos e Responsabilidades

```
src/
  components/   ← UI apenas. Sem lógica de negócio. 1 componente por pasta.
  services/     ← Funções puras. Sem useState, sem DOM, sem imports React.
  hooks/        ← Orquestram services/ com estado React. Sem lógica inline.
  utils/        ← Zero dependência do projeto (não importam nada de src/).
  types/        ← Interfaces e types TypeScript. Sem lógica.
```

**Regra de arquivos por componente:**
```
src/components/SectionCard/
  ├── index.tsx       ← componente principal
  ├── types.ts        ← tipos locais (se complexo)
  └── utils.ts        ← helpers locais (se necessário)
```

---

## Tamanho de Arquivo

| Limite | Regra |
|---|---|
| ≤ 250 linhas | Padrão — refatorar se ultrapassar |
| 250–400 linhas | Justificar em comentário no topo do arquivo |
| > 400 linhas | Exceção documentada — ex: `elementor-mapper.ts` (alto acoplamento lógico) |

**Exceções documentadas:**
- `elementor-mapper.ts` (~600 linhas): 100+ mapeamentos HTML→Elementor fortemente acoplados. Refatoração planejada em `18_TECH_DEBT.md`.

---

## Convenções de Nomenclatura

```typescript
// Componentes: PascalCase
export function SectionCard({ ... }: SectionCardProps) {}

// Hooks: use + PascalCase
export function useConversion() {}

// Funções: camelCase
export function parseHTML(html: string): LayoutNode[] {}
export function generateId(): string {}

// Constantes: UPPER_SNAKE_CASE
const MAX_FILE_SIZE_MB = 10
const ELEMENTOR_VERSION = '0.4'

// Arquivos: kebab-case
// html-parser.ts, section-detector.ts, useConversion.ts

// Interfaces/Types: PascalCase
interface LayoutNode {}
type ConversionStatus = 'idle' | 'parsing' | ...

// Variáveis de estado: camelCase, descritivas
const [rawHtml, setRawHtml] = useState('')
const [sectionRefining, setSectionRefining] = useState<Record<string, boolean>>({})
```

---

## JSDoc Obrigatório

Toda função exportada deve ter JSDoc:

```typescript
/**
 * Converte string HTML em árvore de LayoutNode.
 * @param html - HTML bruto do usuário (pode conter Tailwind, SVG, scripts inline)
 * @returns Array de nós representando a árvore DOM intermediária
 */
export function parseHTML(html: string): LayoutNode[] { ... }

/**
 * @param sectionId - ID da Section a refinar (section.id, não section.name)
 */
const refineSection = useCallback(async (sectionId: string) => { ... }, [result])
```

---

## Marcadores de Código

### Seções dentro de arquivos grandes
```typescript
// ─── PARSING ────────────────────────────────────────────────────────────────
// ─── MAPPING ────────────────────────────────────────────────────────────────
// ─── VALIDATION ─────────────────────────────────────────────────────────────
```

### Decisões técnicas no código
```typescript
// [TECH DECISION]: seção→coluna→widget para preservar CSS Tailwind sem mapear widget por widget
// [MAPPING DECISION]: <ul> com ≥3 itens → icon-list
// [FUTURE: auth] — verificar autenticação aqui (Fase 2)
// [FUTURE: wp-plugin] — publicação direta no WordPress (Fase 4)
// [MAINTENANCE: mapeamento] — adicionar novos widgetTypes aqui
// [REUSE]: reutiliza generateId de utils/generateId.ts
```

---

## Regras de React

```typescript
// ✅ CERTO: handler nomeado
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { ... }
return <input onChange={handleFileUpload} />

// ❌ ERRADO: lógica inline no JSX
return <input onChange={(e) => { /* 10 linhas de lógica */ }} />

// ✅ CERTO: props tipadas
interface SectionCardProps {
  sectionExport: SectionExport
  onRefine?: () => void
  isRefining?: boolean
}

// ✅ CERTO: useCallback para funções em deps de useEffect
const refineSection = useCallback(async (sectionId: string) => { ... }, [result])
```

---

## Testes

Ver `15_TESTING.md` para guia completo.

Convenção de nomes:
```
src/test/
  html-parser.test.ts
  section-detector.test.ts
  elementor-mapper.test.ts
  elementor-exporter.test.ts
  validator.test.ts
  zip-handler.test.ts
  token-resolver.test.ts
```

---

## Convenção de Imports

```typescript
// 1. Bibliotecas externas
import { useState, useCallback, useEffect, useRef } from 'react'
import { Eye, Wand2, RefreshCw } from 'lucide-react'

// 2. Types
import type { SectionExport, ElementorTemplate } from '@/types/app.types'

// 3. Services
import { validateTemplate } from '@/services/validator'
import { refinePageJson } from '@/services/ai-refiner'

// 4. Utils
import { templateToJson } from '@/utils/elementor-utils'

// 5. Componentes
import { SectionPreview } from '@/components/SectionPreview'
```

---

## Commits

```bash
feat: adiciona refineSection por seção no useConversion
fix: corrige truncamento no iframe de SectionPreview
docs: adiciona WKOS com 26 arquivos de governança
refactor: extrai runStructuralLoop como helper compartilhado
test: adiciona cobertura para structural-corrector
chore: atualiza lucide-react para 0.441
```

Nunca commitar diretamente na `main`. Branch → PR → CI → merge.
