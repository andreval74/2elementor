# 19_ROADMAP.md — Roadmap de Produto
> Fonte: `ROADMAP.md` + `prompts/VISION.md` | Status: **Vivo** | Atualizar por sprint

---

## Status Atual

**V1 — MVP Concluído** ✅ (Jun 2026)

Tudo abaixo está concluído e em produção:
- HTML/ZIP/Imagem → JSON Elementor v0.4
- 8 tipos de seção com detecção automática
- Deduplicação de seções com numeração (#2, #3)
- 9 tokens dinâmicos
- Export ZIP + seções individuais
- Preview visual por seção (iframe sandboxed)
- EDIT MODE com snapshot/diff/patch cirúrgico
- REFINE MODE global + por seção (`refineSection`)
- Quality Gate em 4 dimensões
- Validação estrutural em loop (até 3 tentativas)
- Deploy automático via GitHub Actions → FTP Hostinger

---

## Sprint 2 — Qualidade de Análise

### 2A. Multi-pass por seção (DCGen) ← NEXT
**Impacto:** Alto (+15% fidelidade visual, baseado em pesquisa DCGen arxiv:2406.16386)
**Esforço:** Médio (2–3 dias)
**Custo API:** ~4× mais chamadas ao Worker

**Fluxo:**
```
Imagem original
   → image-analyzer.ts (detecta seções por variância de pixel)
   → Cortar cada fatia com Canvas API (image-slicer.ts — novo)
   → Enviar cada fatia separadamente ao Worker /vision
   → Combinar UIAnalysisResult de cada fatia
```

**Arquivos a criar:** `src/utils/image-slicer.ts`
**Arquivos a modificar:** `src/services/providers/proxy.ts`, `UploadPanel` (botão "Análise Detalhada")

---

### 2B. Input por URL de site ao vivo
**Impacto:** Médio-Alto
**Esforço:** Pequeno (1 dia)

**Fluxo:**
```
URL do site → API de screenshot → Blob de imagem → mesmo fluxo de VISION MODE
```

**Arquivo a criar:** `src/services/url-screenshot.ts`
**Arquivo a modificar:** `UploadPanel` (4ª aba "URL")
**Pré-requisito:** Criar SPEC-002 antes de implementar

---

## Sprint 3 — Editor Visual

### 3A. Editor inline de seções (VisionEditor)
**Impacto:** Muito Alto (diferencial vs. competidores)
**Esforço:** Alto (1 semana)

Após análise de imagem, antes de exportar, permitir editar o resultado inline:
- Textos (input por elemento)
- Cores (color picker)
- Fontes (dropdown Google Fonts)
- Padding por seção

**Componente a criar:** `src/components/VisionEditor/index.tsx`

---

## Sprint 4 — Iterative Refinement

### 4A. Loop de refinamento visual automático (UI2Code^N)
**Impacto:** Alto
**Esforço:** Alto (1 semana)
**Dependência:** `html2canvas` (npm install html2canvas)

```
HTML/CSS gerado
   → renderizar em <iframe> escondido
   → tirar screenshot com html2canvas
   → comparar com imagem original (diferença de pixels)
   → se similaridade < 85%: corrigir com IA ("correct these differences")
   → repetir até 3 iterações
```

---

## Sprint 5 — Recursos Avançados

### 5A. Smart Export Manager (SPEC-001)
Seleção parcial de seções, histórico de exports, badge "modificada".
**Pré-requisito:** SPEC-001 aprovada em `22_SPECIFICATIONS.md`

### 5B. Export para WPBakery
Formato de saída adicional: WPBakery JSON.

### 5C. Export para Divi
Formato de saída adicional: Divi JSON.

### 5D. Export para Bricks Builder
Formato de saída adicional: Bricks Builder JSON.

---

## Versões do Produto (Longo Prazo)

| Versão | Foco | Status |
|---|---|---|
| V1 — Conversor | Converter HTML → Elementor | ✅ Concluído |
| V2 — Biblioteca | Templates prontos, blocos reutilizáveis, biblioteca pessoal | Planejado |
| V3 — IA Generativa | Geração por linguagem natural, API pública | Planejado |
| V4 — WordPress Direto | Publicação via REST API WordPress sem download | Planejado |
| V5 — Marketplace | Designers publicam e vendem templates | Planejado |
| V_FINAL — Cloud | WebKeeper Cloud — hospedagem própria | Visão longo prazo |

---

## Referências de Pesquisa

| Paper | Relevância |
|---|---|
| DCGen (arxiv:2406.16386) | Multi-pass: +15% similaridade visual — base do Sprint 2A |
| ScreenCoder (arxiv:2507.22827) | Pipeline multi-agent modular |
| UI2Code^N (arxiv:2511.08195) | Iterative visual refinement — base do Sprint 4A |
| LaTCoder | Layout-as-Thought: Chain-of-Thought para preservação de layout |
