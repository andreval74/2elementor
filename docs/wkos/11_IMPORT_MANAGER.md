# 11_IMPORT_MANAGER.md — Import Manager (Entradas)
> Fonte: `UploadPanel`, `zip-handler.ts`, `html-parser.ts`, `image-analyzer.ts` | Status: **Estável**

---

## Inputs Suportados

| Tipo | Como fornecer | Processamento | Status |
|---|---|---|---|
| HTML | Colar texto na textarea | `html-parser.ts` direto | ✅ Ativo |
| HTML | Arrastar arquivo `.html`/`.htm` | `FileReader` → `html-parser.ts` | ✅ Ativo |
| ZIP | Arrastar/selecionar `.zip` | `zip-handler.ts` → extrai HTML | ✅ Ativo |
| Imagem | Arrastar/selecionar `.png/.jpg/.webp` | Vision AI → `UIAnalysisResult` | ✅ Ativo |
| URL | Campo de texto | Crawler (não implementado) | 🗓️ Sprint 2B |
| Elementor JSON | Fazer upload de page.json | Re-import para edição | ❌ Não suportado |
| Figma | Plugin ou export | API Figma | ❌ Futuro |
| PDF | Arquivo PDF | Conversão PDF→imagem | ❌ Futuro |

---

## Limitações por Tipo

### HTML (texto)
- Tamanho máximo: `MAX_FILE_SIZE_MB = 10` (10 MB)
- Encoding esperado: UTF-8
- Tags suportadas: ver tabela de mapeamento em `23_PLAYBOOKS.md`
- Tags ignoradas: `<script>` de analytics (ex: GA, GTM), meta tags
- **Limitação:** CSS externo não é importado — apenas estilos inline ou `<style>`

### ZIP
- Formato: ZIP padrão (deflate)
- O ZIP deve conter pelo menos 1 arquivo `.html` ou `.htm`
- Múltiplos HTMLs: o primeiro arquivo válido é usado como página principal
- Imagens no ZIP: extraídas como `ExtractedImage[]` e incluídas no ZIP de saída
- **Limitação:** ZIP de ZIP não suportado (nesting)

### Imagem
- Formatos: PNG, JPG, WEBP, GIF
- Tamanho máximo: 10 MB
- Resolução recomendada: ≥ 1280px de largura (melhora acurácia da Vision AI)
- Seções detectadas por IA — sem parseamento DOM (nem `rawHtml` nos nodes)
- **Limitação:** Seções de VISION MODE não têm `rawHtml` → `refineSection()` envia string vazia

### ZIP com Imagens
- Imagens no ZIP são extraídas via `zip-handler.ts → extractImages()`
- Cada imagem vira um `ExtractedImage { name, base64, mimeType }`
- Incluídas no ZIP de saída em `assets/images/`
- **Limitação:** não há OCR — texto em imagens não é extraído

---

## Fluxo de Upload (UploadPanel)

```
Usuário arrasta arquivo
  │
  ├── extensão .html/.htm → lê como texto → setRawHtml()
  ├── extensão .zip → zip-handler.ts → extrai HTML + imagens → setRawHtml()
  └── extensão .png/.jpg/.webp/.gif → setImageFile() → usa Vision AI
```

---

## Validação de Entrada

| Validação | Onde | Comportamento |
|---|---|---|
| Tamanho de arquivo | UploadPanel | Alerta se > 10 MB |
| Extensão de arquivo | UploadPanel | Aceita: .html, .htm, .zip, .png, .jpg, .webp, .gif |
| HTML mínimo | html-parser.ts | Se HTML inválido → `LayoutNode[]` vazio → 0 seções detectadas |
| ZIP vazio | zip-handler.ts | Throw se nenhum arquivo HTML encontrado no ZIP |
| Imagem não legível | Vision providers | Fallback para próximo provider |

---

## O que `rawHtml` significa para cada tipo de input

| Input | `section.nodes[i].rawHtml` | Impacto em `refineSection` |
|---|---|---|
| HTML | HTML do elemento original | ✅ Refinamento com contexto completo |
| ZIP | HTML do arquivo principal | ✅ Refinamento com contexto completo |
| Imagem (VISION) | `undefined` / string vazia | ⚠️ Refinamento sem contexto HTML real |

---

## Formatos Futuros (Roadmap)

| Formato | Sprint | Abordagem técnica |
|---|---|---|
| URL de site ao vivo | Sprint 2B | `url-screenshot.ts` → API de screenshot → mesmo fluxo de imagem |
| Figma | V3 | Plugin Figma → export JSON → novo parser |
| Elementor JSON re-import | SPEC-001+ | Upload de page.json → pre-populate EDIT MODE |
