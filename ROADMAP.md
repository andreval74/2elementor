# Roadmap — Próximas Melhorias (Priorizadas por ROI)

## Status Atual (implementado)
- Cascata automática: Gemini → OpenRouter Gemma 4 → Groq Llama 4 → Grok 4.3
- Color extraction via Canvas API antes de enviar para IA
- Prompt em inglês + Chain-of-Thought + instrução de completeness
- Worker autônomo — usuário não configura nada

---

## Sprint 2 — Qualidade de Análise

### 2A. Multi-pass por seção (DCGen) — +15% fidelidade visual
**Impacto:** Alto | **Esforço:** Médio (2-3 dias) | **Custo API:** ~4x mais chamadas

Dividir a imagem em seções antes de analisar. Pesquisa DCGen (FSE 2025) prova +15% de similaridade visual.

**Fluxo:**
```
Imagem original
   ↓ image-analyzer.ts (já existe — detecta seções por variância de pixel)
   ↓ Cortar cada fatia com Canvas API
   ↓ Enviar cada fatia à IA separadamente (1 chamada por seção)
   ↓ Combinar todos os results[] em um único UIAnalysisResult
```

**Arquivo a criar:** `src/utils/image-slicer.ts`
```typescript
// Usa Canvas API para recortar a imagem nas coordenadas de cada seção detectada
export async function sliceImageBySections(
  file: File,
  sections: ImageSection[]  // saída do image-analyzer.ts existente
): Promise<File[]>
```

**Arquivo a modificar:** `src/services/providers/proxy.ts`
- Opção "Análise Detalhada" que chama o Worker N vezes (uma por seção)
- Combina os resultados localmente

**UI:** Botão "Análise Rápida" (atual) vs "Análise Detalhada" no UploadPanel

---

### 2B. Input por URL de site ao vivo
**Impacto:** Médio-Alto | **Esforço:** Pequeno (1 dia)

Nova aba "URL" no UploadPanel. Captura screenshot via API gratuita.

```typescript
// src/services/url-screenshot.ts
const SCREENSHOT_API = `https://api.screenshotone.com/take?url=${url}&...`
// Alternativa gratuita: https://image.thum.io/get/width/1280/${url}
// Alternativa gratuita: https://shot.screenshotapi.net/screenshot?url=${url}&output=image
```

**Arquivo a modificar:** `src/components/UploadPanel/index.tsx`
- 4ª aba "URL" com campo de input
- Ao colar URL → captura screenshot → passa para o mesmo fluxo de análise de imagem

---

## Sprint 3 — Editor Visual Pré-Export (Principal diferencial do web2elementor.com)

### 3A. Editor inline de seções
**Impacto:** Muito Alto | **Esforço:** Alto (1 semana)

Após análise, antes de exportar o JSON Elementor, permitir editar o resultado:

**Componente a criar:** `src/components/VisionEditor/index.tsx`
- Lista as seções detectadas (resultado do UIAnalysisResult)
- Cada seção expansível com campos editáveis:
  - Textos (input para cada `element.content`)
  - Cores (color picker para `designSystem.colors.*`)
  - Fontes (dropdown com Google Fonts)
  - Padding por seção
- Preview em tempo real do HTML gerado
- Botão "Aplicar e Exportar" → gera Elementor JSON com valores editados

**Integração:** Aparece no OutputPanel quando `uiAnalysis` existe

---

## Sprint 4 — Iterative Refinement (pesquisa UI2Code^N)

### 4A. Loop de refinamento automático
**Impacto:** Alto | **Esforço:** Alto (1 semana)

Gera código → renderiza invisível via iframe → compara pixel-a-pixel com original → pede à IA que corrija diferenças.

```
Análise inicial → HTML/CSS
   ↓ renderizar em <iframe> escondido
   ↓ tirar screenshot do iframe via html2canvas
   ↓ comparar com imagem original (diferença de pixels)
   ↓ se similaridade < 85%: enviar diff para IA ("correct these differences: ...")
   ↓ atualizar HTML/CSS → repetir até 3 iterações
```

**Dependência:** `html2canvas` (npm install html2canvas)

---

## Sprint 5 — Recursos Avançados

### 5A. Histórico de análises (localStorage)
Salvar últimas 10 análises. Aba "Histórico" no UploadPanel.

### 5B. Comparação A/B entre providers
Opção "Analisar com todos os providers" → mostrar 4 resultados lado a lado.

### 5C. Export para outros formatos
- WPBakery JSON
- Divi JSON
- Bricks Builder JSON

---

## Referências da Pesquisa

- **DCGen (Divide and Conquer):** arxiv.org/abs/2406.16386 — +15% similaridade visual com multi-pass
- **ScreenCoder:** arxiv.org/abs/2507.22827 — pipeline multi-agent modular
- **UI2Code^N:** arxiv.org/abs/2511.08195 — iterative visual refinement
- **LaTCoder:** Layout-as-Thought — Chain-of-Thought para preservação de layout
- **web2elementor.com:** editor visual embutido como diferencial principal