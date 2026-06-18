# 22_SPECIFICATIONS.md — Especificações de Feature
> Índice de todas as specs. Criar nova spec ANTES de implementar feature média/grande.

---

## Índice de Specs

| Spec | Título | Status | Prioridade |
|---|---|---|---|
| SPEC-001 | Smart Export Manager | 📋 Especificado | HIGH |
| SPEC-002 | URL Import | 📝 Planejado | MEDIUM |

---

## Template de SPEC

Ver `24_TEMPLATES.md` para o template completo.

Campos obrigatórios: Problema, Objetivo, Motivação, Escopo, Fora de Escopo, Arquitetura, UX, Critérios de Aceite, Plano de Migração, Rollback.

---

---

# SPEC-001: Smart Export Manager

**Status:** 📋 Especificado — aguardando aprovação para implementação
**Prioridade:** HIGH
**Sprint:** Sprint 5 (após Sprint 2A e 2B)
**Criado em:** 2026-06-17

---

## Problema

O Export Manager atual é funcional mas simples: gera ZIP com JSONs estáticos a partir do estado atual em memória. Não há:
- Histórico de exports (o usuário não pode baixar uma versão anterior)
- Seleção parcial de seções (tudo ou nada)
- Indicador de "o que mudou" desde o último export
- Progresso durante geração do ZIP

---

## Objetivo

Criar um sistema de exportação inteligente que permita ao usuário:
1. Selecionar quais seções incluir no ZIP
2. Saber quais seções foram modificadas desde o último export
3. Ter histórico navegável das últimas 3 exportações
4. Baixar novamente qualquer exportação anterior

---

## Motivação

- Usuário refina 1 seção → não sabe se o ZIP que tem é o mais atual
- Páginas com 10+ seções: o usuário quer exportar só as 3 que modificou
- Histórico evita perda de estado caso o usuário feche o browser acidentalmente

---

## Escopo

- Histórico de exports por sessão (últimas 3)
- Seleção de seções via checkbox (padrão: todas marcadas)
- Badge "modificada" por seção após `refineSection()` bem-sucedido
- Progresso de geração do ZIP (barra ou spinner por seção)
- Botão "Baixar novamente" no histórico de exports

---

## Fora de Escopo

- Persistência entre sessões (localStorage é suficiente para V1)
- Export para outros builders (WPBakery, Divi) — Sprint 5 separado
- API REST de export — V3
- Versionamento server-side
- Comparação visual antes/depois de cada seção

---

## Arquitetura

### Novo tipo
```typescript
interface ExportRecord {
  id: string               // generateId()
  timestamp: number        // Date.now()
  sections: SectionExport[] // cópia do estado no momento do export
  pageJson: string         // cópia do pageJson
  trigger: 'manual' | 'auto'
  sectionIds: string[]     // IDs das seções incluídas
}
```

### Mudanças em `useConversion.ts`
```typescript
// Adicionar ao estado
const [exportHistory, setExportHistory] = useState<ExportRecord[]>([])
const [modifiedSectionIds, setModifiedSectionIds] = useState<Set<string>>(new Set())

// Marcar seção como modificada após refineSection bem-sucedido
setModifiedSectionIds(prev => new Set([...prev, sectionId]))

// Criar ExportRecord ao exportar
const createExportRecord = (selectedIds: string[]) => { ... }

// Limpar "modified" após export incluindo aquela seção
setModifiedSectionIds(prev => { /* remover IDs exportados */ })
```

### Novo componente: `ExportPanel`
Substitui os botões de export no `OutputPanel`:
- Lista de seções com checkbox
- Badge dourado em seções modificadas
- Botão "Exportar selecionadas" + barra de progresso
- Lista histórico: timestamp + seções incluídas + "Baixar novamente"

---

## UX

```
┌─── Export Panel ────────────────────────────────┐
│ Selecionar seções para exportar:                │
│                                                 │
│ [✓] Cabeçalho / Nav         header.json       │
│ [✓] Hero Principal    ✨ mod  hero.json         │
│ [✓] Serviços / Soluções      services.json    │
│ [ ] Cabeçalho / Nav #2       header-2.json    │
│ [✓] FAQ                      faq.json          │
│ [✓] Rodapé                   footer.json       │
│                                                 │
│ [  Exportar 5 seções selecionadas  ]           │
│                                                 │
│ ─── Histórico ───────────────────────────────── │
│ 14:32 — 6 seções  [⬇ Baixar novamente]        │
│ 14:15 — 5 seções  [⬇ Baixar novamente]        │
│ 13:58 — 6 seções  [⬇ Baixar novamente]        │
└─────────────────────────────────────────────────┘
```

`✨ mod` = badge dourado de "modificada desde último export"

---

## Critérios de Aceite

- [ ] Usuário pode selecionar/desmarcar seções individualmente
- [ ] ZIP exportado contém apenas as seções marcadas
- [ ] Badge "modificada" aparece na seção após `refineSection()` bem-sucedido
- [ ] Badge "modificada" desaparece após export incluir aquela seção
- [ ] Histórico mostra últimas 3 exportações com timestamp
- [ ] "Baixar novamente" regenera ZIP do estado salvo (não do estado atual)
- [ ] `npm run build` → 0 erros TypeScript
- [ ] 3 novos testes: seleção parcial, badge de modificada, histórico de exports

---

## Plano de Migração

1. Adicionar `ExportRecord`, `exportHistory`, `modifiedSectionIds` ao hook (backward compatible)
2. Manter botões existentes de export durante desenvolvimento (`VITE_ENABLE_EXPORT_PANEL=false`)
3. Implementar `ExportPanel` com interface completa
4. Feature flag `VITE_ENABLE_EXPORT_PANEL=true` para testar
5. Swap: substituir botões legacy pelo `ExportPanel` no `OutputPanel`
6. Remover feature flag e botões legacy após QA

---

## Rollback

Feature flag `VITE_ENABLE_EXPORT_PANEL` em `.env.local`:
- `false` (padrão): comportamento atual — botões originais de export
- `true`: novo ExportPanel

Remoção em 1 commit: `delete ExportPanel/ && revert OutputPanel` + remoção de estado no hook.

---

---

# SPEC-002: URL Import (Planejado)

**Status:** 📝 Planejado — sem spec completa ainda
**Prioridade:** MEDIUM
**Sprint:** Sprint 2B

Ver `19_ROADMAP.md` → Sprint 2B para contexto.

Criar spec completa antes de iniciar implementação.
