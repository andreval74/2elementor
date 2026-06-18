# 04_ENGINEERING_PRINCIPLES.md — Princípios de Engenharia
> Fonte: `prompts/DEVELOPMENT_RULES.md` | Status: **Estável** | Consultar antes de qualquer código

---

## Princípios Fundamentais

- **Português claro** em toda comunicação e comentários de produto; inglês apenas em código
- **Simples e direto**: explorar o stack atual antes de adicionar nova tecnologia
- **DRY total — zero repetição**: nenhuma função pode existir em mais de um arquivo. Se uma lógica aparece duas vezes, vira uma função em `utils/` ou `services/` e é importada. Corrigir em um lugar corrige em todo o sistema.
- **Não alterar além do solicitado** sem alinhamento prévio
- **Refatorar arquivos > 250–300 linhas** — dividir em módulos menores
- **Dados falsos apenas em testes isolados** — nunca em dev ou prod

---

## Stack Obrigatório

| Ferramenta | Versão | Uso |
|---|---|---|
| TypeScript strict | 5.6+ | Todo o código |
| React | 19 | UI |
| Tailwind CSS | 3.4 | Estilo |
| Vite | 5.4 | Build e dev server |
| Lucide React | 0.441 | Ícones |
| JSZip | 3.10 | Compactação |
| Vitest | 2.1 | Testes unitários |
| happy-dom | 15 | Ambiente de teste |

---

## Organização de Arquivos

```
src/
  components/    ← UI React (PascalCase, 1 componente por pasta)
  services/      ← lógica pura, sem React, sem DOM, testável unitariamente
  hooks/         ← orquestram services/ com estado React
  utils/         ← funções puras, zero dependência do projeto
  types/         ← interfaces e tipos TypeScript
```

**Regras por camada (invioláveis):**
- `services/`: funções puras — sem `useState`, sem DOM, sem `import` de componentes React
- `hooks/`: orquestram `services/` com estado React — sem lógica de negócio direta
- `components/`: apenas UI — sem lógica de negócio inline
- `utils/`: funções de zero dependência (não importam nada do projeto)

---

## Convenções de Nomenclatura

| Tipo | Convenção | Exemplo |
|---|---|---|
| Componentes React | PascalCase | `UploadPanel`, `SectionCard` |
| Hooks | `useNomeHook` | `useConversion`, `useTokens` |
| Funções utilitárias | camelCase | `generateId`, `formatBytes` |
| Constantes | UPPER_CASE | `MAX_FILE_SIZE_MB`, `ELEMENTOR_VERSION` |
| Arquivos | kebab-case | `html-parser.ts`, `section-card.tsx` |
| Interfaces/Types | PascalCase | `LayoutNode`, `TokenMap` |
| Variáveis de estado | camelCase | `rawHtml`, `conversionResult` |

---

## Comentários Obrigatórios

### JSDoc em toda função
```typescript
/**
 * Converte string HTML em árvore de LayoutNode.
 * @param html - HTML bruto do usuário
 * @returns Array de nós da árvore intermediária
 */
export function parseHTML(html: string): LayoutNode[] { ... }
```

### Marcadores de seção
```typescript
// ─── PARSING ────────────────────────────────────────────────────────────────
// ─── MAPPING ────────────────────────────────────────────────────────────────
```

### Decisões técnicas
```typescript
// [TECH DECISION]: usar section→column→widget para preservar CSS Tailwind
// [MAPPING DECISION]: <ul> com 3+ itens mapeado para icon-list
// [FUTURE: auth] — verificar autenticação aqui (Fase 2)
// [FUTURE: billing] — checar cota de conversões (Fase 2)
// [FUTURE: api-endpoint] — mover lógica para API REST (Fase 3)
// [FUTURE: wp-plugin] — publicação direta no WordPress (Fase 4)
// [FUTURE: ai-generate] — geração por IA (Fase 3)
```

### Pontos de manutenção
```typescript
// [MAINTENANCE: mapeamento] — adicionar novos widgetTypes aqui
// [MAINTENANCE: tokens] — adicionar novos tokens dinâmicos aqui
// [MAINTENANCE: detector] — melhorar heurísticas de seção aqui
// [REUSE]: importado de utils/X
```

---

## Regras de Código

1. **Sem lógica inline no JSX**: extrair para handler nomeado
2. **Sem `any`**: TypeScript strict — usar tipos explícitos sempre
3. **Funções máximo 30 linhas**: dividir em subfunções nomeadas se ultrapassar
4. **Props tipadas**: toda interface de componente tem `interface NomeProps {}`
5. **Sem `console.log` em produção**: usar apenas em debug temporário com marcação `[DEBUG]`
6. **Modularização obrigatória**: antes de criar qualquer função, procurar em `utils/`, `services/`, `hooks/`

---

## Segurança

- **Segredos somente no `.env`**: nunca no código
- **`.env.example` sempre atualizado**: documentar todas as variáveis sem valores reais
- **Nunca commitar `.env`**: garantido via `.gitignore`
- **Zero informação sensível no código**: WhatsApp, e-mail, URLs privadas → tokens `{{...}}`

---

## Git e Conventional Commits

```bash
# Prefixos obrigatórios
feat:     # Nova funcionalidade
fix:      # Correção de bug
docs:     # Documentação
style:    # CSS / visual
refactor: # Refatoração sem mudança de comportamento
test:     # Testes
chore:    # Manutenção / dependências
```

**Nunca commitar diretamente na `main`.** Feature branch → PR → review → merge → deploy automático.

---

## Caça-Bugs — Fluxo Obrigatório

1. Listar 5–7 hipóteses para a causa da falha
2. Afinar para 1–2 hipóteses mais prováveis
3. Inserir logs estratégicos: `console.log('[DEBUG module] info:', data)`
4. Analisar, propor ajuste, confirmar com o usuário antes de remover logs
5. Após corrigir, registrar no `20_CHANGELOG.md`

---

## Checklist Antes de Qualquer Entrega

- [ ] TypeScript compila sem erros (`npm run build`)
- [ ] Todos os testes passando (`npm test`)
- [ ] Todas as funções têm JSDoc
- [ ] Nenhum `console.log` sem `[DEBUG]`
- [ ] `.env` não está no commit
- [ ] `20_CHANGELOG.md` atualizado
- [ ] Arquivos com > 300 linhas foram refatorados ou têm justificativa documentada
- [ ] Nenhum dado sensível no código
- [ ] Nenhuma função duplicada
- [ ] Todos os imports estão resolvidos
