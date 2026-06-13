# DEVELOPMENT_RULES.md — Padrões e Convenções de Código
# WebKeeper Elementor Exporter
# Consultar antes de qualquer alteração de código

---

## Princípios fundamentais

- **Português claro** em toda comunicação e comentários de produto; inglês apenas em código (nomes de variáveis, funções, arquivos)
- **Simples e direto**: evitar novas tecnologias sem explorar o stack atual primeiro
- **DRY total — zero repetição de funções e arquivos**: nenhuma função pode existir em mais de um lugar no projeto. Se uma lógica aparece duas vezes, ela vira uma função em `utils/` ou `services/` e é importada onde for necessário. O mesmo vale para trechos de markup, constantes e configurações. Usar sempre `import` (equivalente ao `include` do PHP) para reaproveitar código entre módulos — nunca copiar e colar. Corrigir em um lugar corrige em todo o sistema.
- **Não alterar além do solicitado** sem alinhamento prévio
- **Refatorar arquivos > 250–300 linhas** — dividir em módulos menores
- **Dados falsos apenas em testes isolados** — nunca em dev ou prod

---

## Stack obrigatório

| Ferramenta | Uso |
|---|---|
| TypeScript strict | Todo o código |
| ESLint | Linting — configuração padrão React+TS |
| Prettier | Formatação automática |
| Vite | Build e dev server |
| React 19 | UI |
| Tailwind CSS | Estilo (sem CSS customizado exceto variáveis de token) |
| Lucide Icons | Ícones |

---

## Convenções de nomenclatura

| Tipo | Convenção | Exemplo |
|---|---|---|
| Componentes React | PascalCase | `UploadPanel`, `SectionCard` |
| Hooks | `useNomeHook` | `useConversion`, `useTokens` |
| Funções utilitárias | camelCase | `generateId`, `formatBytes` |
| Constantes | UPPER_CASE | `MAX_FILE_SIZE`, `ELEMENTOR_VERSION` |
| Arquivos | kebab-case | `html-parser.ts`, `section-card.tsx` |
| Interfaces/Types | PascalCase | `LayoutNode`, `TokenMap` |
| Variáveis de estado | camelCase | `rawHtml`, `conversionResult` |
| Enums | PascalCase + UPPER_CASE membros | `NodeType.CONTAINER` |

---

## Comentários obrigatórios

### JSDoc em toda função (sem exceção)
```ts
/**
 * Converte string HTML em árvore de LayoutNode.
 * @param html - HTML bruto do usuário
 * @returns Array de nós da árvore intermediária
 */
export function parseHTML(html: string): LayoutNode[] { ... }
```

### Marcadores de seção em arquivos longos
```ts
// ─── PARSING ────────────────────────────────────────────────────────────────
// ─── MAPPING ────────────────────────────────────────────────────────────────
// ─── EXPORT ─────────────────────────────────────────────────────────────────
```

### Decisões técnicas
```ts
// [TECH DECISION]: usar section→column→widget para preservar CSS Tailwind
// [MAPPING DECISION]: <ul> com 3+ itens mapeado para icon-list
// [FUTURE: auth] — verificar autenticação aqui (Fase 2)
// [FUTURE: billing] — checar cota de conversões (Fase 2)
// [FUTURE: api-endpoint] — mover lógica para API REST (Fase 3)
// [FUTURE: wp-plugin] — publicação direta no WordPress (Fase 4)
// [FUTURE: ai-generate] — geração por IA (Fase 3)
// [FUTURE: marketplace] — publicar como template vendável (Fase 5)
```

### Pontos de manutenção
```ts
// [MAINTENANCE: mapeamento] — adicionar novos widgetTypes aqui
// [MAINTENANCE: tokens] — adicionar novos tokens dinâmicos aqui
// [MAINTENANCE: detector] — melhorar heurísticas de seção aqui
```

---

## Organização dos arquivos

```
src/
  components/    ← componentes React (PascalCase, um por pasta)
  pages/         ← páginas (se multi-rota)
  services/      ← lógica pura, sem React, sem DOM, testável unitariamente
  hooks/         ← hooks React (useNomeHook)
  utils/         ← funções puras sem efeitos colaterais
  types/         ← interfaces e tipos TypeScript
```

**Regras por camada:**
- `services/`: funções puras — sem `useState`, sem acesso ao DOM, sem `import` de componentes React
- `hooks/`: orquestram `services/` com estado React
- `components/`: apenas UI — sem lógica de negócio diretamente
- `utils/`: funções de zero dependência (não importam nada do projeto)

---

## Regras de código

1. **Sem lógica inline no JSX**: `onClick={() => handleClick()}` em vez de lógica inline
2. **Sem `any`**: TypeScript strict — usar tipos explícitos sempre
3. **Funções máximo 30 linhas**: dividir em subfunções nomeadas se ultrapassar
4. **Estado global em `AppState`**: sem variáveis soltas no escopo global
5. **Props tipadas**: toda interface de componente tem `interface NomeProps {}`
6. **Sem `console.log` em produção**: usar apenas em debug temporário, remover antes de commitar
7. **Modularização obrigatória via import/export**:
   - Toda função usada em mais de um arquivo DEVE estar em `utils/` ou `services/`
   - Toda constante compartilhada DEVE estar em `utils/constants.ts`
   - Todo tipo/interface compartilhado DEVE estar em `types/`
   - Proibido duplicar código entre componentes — extrair para hook ou util
   - Padrão de verificação antes de criar qualquer função:
     1. Procurar em `utils/`, `services/`, `hooks/` se já existe algo equivalente
     2. Se existe: importar — nunca recriar
     3. Se não existe: criar no módulo correto e exportar para reuso futuro
   - Comentar com `// [REUSE]: importado de utils/X` quando não for óbvio

---

## Segurança

- **Segredos somente no `.env`**: senhas, tokens, chaves de API — nunca no código
- **`.env.example` sempre atualizado**: documentar todas as variáveis sem valores reais
- **Nunca comitar `.env`**: garantido via `.gitignore`
- **Nunca substituir `.env`** sem confirmar com o usuário
- **Validar variáveis no startup**: checar que todas as variáveis necessárias estão configuradas
- **Zero informação sensível no código**: WhatsApp, e-mail, URLs privadas → tokens `{{...}}`

---

## Git e versionamento

### Fluxo obrigatório
```bash
# Trabalhar sempre em feature branch
git checkout -b feature/nome-da-feature

# Commitar com convenção Conventional Commits
git commit -m "feat: adiciona suporte a exportação de FAQ"
git commit -m "fix: corrige geração de ID duplicado no mapper"
git commit -m "docs: atualiza ARCHITECTURE.md com módulo token-resolver"
git commit -m "refactor: divide elementor-mapper em submódulos"
git commit -m "style: ajusta layout da coluna de output"
git commit -m "chore: atualiza dependências"

# Nunca commitar diretamente na main
# PR → review → merge → deploy automático
```

### Convenções de commit
| Prefixo | Uso |
|---|---|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `docs:` | Documentação |
| `style:` | CSS / visual |
| `refactor:` | Refatoração sem mudança de comportamento |
| `test:` | Testes |
| `chore:` | Manutenção / dependências |

### CHANGELOG.md
Toda alteração relevante registrada com:
```markdown
## [1.0.1] - 2024-01-15
### Added
- Suporte a exportação de seção de cases separada

### Fixed
- Geração de ID duplicado no elementor-mapper
```

---

## Caça-bugs — fluxo obrigatório

Quando um bug for reportado, seguir este fluxo antes de alterar qualquer código:

1. **Listar 5 a 7 hipóteses** para a causa da falha
2. **Afinar para 1 ou 2** hipóteses mais prováveis com base na análise
3. **Inserir logs estratégicos** para validar suspeitas:
   ```ts
   console.log('[DEBUG html-parser] entrada:', html.slice(0, 200));
   console.log('[DEBUG mapper] nós detectados:', nodes.length);
   ```
4. Usar `getConsoleLogs`, `getConsoleErrors`, `getNetworkLogs`, `getNetworkErrors`
5. Solicitar logs do servidor quando aplicável
6. Analisar, propor ajuste, adicionar logs extras se necessário
7. **Confirmar com o usuário antes de remover** os logs de debug
8. Após corrigir, registrar no `CHANGELOG.md`

---

## Melhores práticas de desenvolvimento com IA

- **Um módulo por vez**: nunca pedir geração do sistema inteiro de uma vez
- **Passos pequenos e verificáveis**: testar cada entrega antes de avançar
- **Feedback específico**: "a função `parseHTML()` está ignorando `<article>` — adicionar ao switch de detecção"
- **Referenciar arquivo e função**: sempre indicar `src/services/html-parser.ts → função parseHTML`
- **Não avançar sem validação**: confirmar que a etapa anterior funciona antes da próxima
- **Arquivos `.md` como fonte da verdade**: nunca modificar `PROMPT.md`, `ARCHITECTURE.md`, `DEVELOPMENT_RULES.md` ou `VISION.md` sem solicitação explícita

---

## Checklist antes de qualquer entrega

- [ ] TypeScript compila sem erros (`tsc --noEmit`)
- [ ] ESLint sem warnings
- [ ] Todas as funções têm JSDoc
- [ ] Nenhum `console.log` sem marcação `[DEBUG]`
- [ ] `.env` não está no commit
- [ ] `CHANGELOG.md` atualizado
- [ ] `README.md` reflete o estado atual
- [ ] Arquivos com > 300 linhas foram refatorados
- [ ] Nenhum dado sensível no código
- [ ] Nenhuma função duplicada (cada nome de função definido em apenas um arquivo)
- [ ] Todos os imports estão resolvidos (sem copiar código entre arquivos)
