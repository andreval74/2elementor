# 20_CHANGELOG.md — Histórico de Versões
> Atualizar após CADA feature entregue ou bug corrigido

---

## [1.5.0] — Jun 2026 — WKOS + Governança

### Added
- WKOS (WebKeeper Operating System): 26 docs de referência + 6 governance files em `/docs/wkos/`
- Score técnico por dimensão documentado (74/100 geral)
- Backlog executivo com CRITICAL/HIGH/MEDIUM/LOW
- SPEC-001: Smart Export Manager (especificação completa)

---

## [1.4.0] — Jun 2026 — Preview por Seção + UX Improvements

### Added
- `SectionPreview` — modal de preview por iframe sandboxado via `createPortal`
- Tailwind CDN + Inter font + brand color helpers no srcdoc do iframe
- Botão Eye (👁️) em cada SectionCard para abrir preview da seção
- Botão Wand2 (✨) em cada SectionCard para refinar apenas aquela seção
- Badge `×N` dourado no SectionCard mostrando quantas vezes a seção foi refinada
- Deduplicação automática de seções: primeira ocorrência mantém nome, subsequentes recebem `#2`, `#3` e `header-2.json`

### Fixed
- Preview de seção truncado: corrigido com `overflow-auto` + `height: 70vh` (não `h-full`)
- Seções com mesmo nome causando confusão: resolvido com numeração automática
- Contador de refines não visível: corrigido com `refineCount` local + `wasRefining` ref no SectionCard

---

## [1.3.0] — Jun 2026 — REFINE MODE por Seção

### Added
- `refineSection(sectionId)` em `useConversion.ts` — refina apenas 1 seção
- `sectionRefining: Record<string, boolean>` — tracking de quais cards estão refinando
- Pipeline isolado de refinamento: não altera `status` global, usa `sectionRefining[id]`
- Props `onRefine` e `isRefining` no `SectionCard`
- Props `onRefineSection` e `sectionRefining` no `OutputPanel`

---

## [1.2.0] — Jun 2026 — Quality Gate + Visual Validator

### Added
- `visual-validator.ts` — validação visual em 4 dimensões: cores, tipografia, layout, media
- `quality-gate.ts` — score geral = structural×50% + visual×30% + confidence×20%
- Thresholds por modo: create (55), edit (75), refine (75)
- `QualityGateResult` com passed/score/warnings
- Score visual em CREATE MODE: self-audit (headings, widgets mínimos)

---

## [1.1.0] — Jun 2026 — EDIT MODE + Snapshot Engine

### Added
- `page-snapshot.ts` — snapshot estrutural de ElementorTemplate
- `snapshot-diff.ts` — diff mínimo entre dois snapshots
- `snapshot-patcher.ts` — aplica diff cirurgicamente (spread-based)
- `structural-validator.ts` — validação profunda: 8 tipos de violação
- `structural-corrector.ts` — auto-correção de violações (até 3x)
- `evolve()` em `useConversion.ts` — pipeline completo EDIT MODE
- `validateNoRegression()` em `validator.ts`
- Novos estados na máquina de estados: `snapshotting`, `diffing`, `patching`, `correcting`

---

## [1.0.0] — Jun 2026 — MVP

### Added
- Conversor HTML/ZIP/Imagem → JSON Elementor v0.4
- Interface dark mode premium 3 colunas (Upload | Análise | Output)
- Pipeline de 8 etapas: parse → detect → tokens → map → export → validate
- Detecção automática de seções: header, hero, services, cases, faq, cta, footer, about
- Tokens dinâmicos: WhatsApp, e-mail, Instagram, LinkedIn, Facebook, empresa, telefone
- Syntax highlight do JSON (roxo/verde/laranja/azul)
- Download individual por seção e ZIP com todas as seções
- Preview visual com iframe sandboxado
- Histórico das últimas 5 conversões (localStorage)
- Dashboard de configuração de tokens em modal
- Deploy automático via GitHub Actions → FTP Hostinger
- Cloudflare Worker: cascata Gemini → Groq → OpenRouter para `/refine`
- 5 providers Vision AI com fallback automático
- 70 testes unitários (Vitest + happy-dom)
