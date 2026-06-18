# 10_EXPORT_MANAGER.md — Export Manager
> Fonte: `elementor-exporter.ts`, `zip-handler.ts`, `elementor-mapper.ts` | Status: **Estável**

---

## O que é Exportado

Cada conversão bem-sucedida produz:

| Artefato | Conteúdo | Gerado por |
|---|---|---|
| `page.json` | Página completa (todas as seções em `content[]`) | `elementor-exporter.ts` |
| `header.json` | Apenas o header/nav | `elementor-exporter.ts` |
| `hero.json` | Apenas o hero | `elementor-exporter.ts` |
| `services.json` | Apenas os serviços | `elementor-exporter.ts` |
| `cases.json` | Apenas cases/portfolio | `elementor-exporter.ts` |
| `faq.json` | Apenas o FAQ | `elementor-exporter.ts` |
| `cta.json` | Apenas o CTA | `elementor-exporter.ts` |
| `footer.json` | Apenas o footer | `elementor-exporter.ts` |
| `about.json` | Apenas o about | `elementor-exporter.ts` |
| `paginas.zip` | Todos os JSONs + assets de imagem | `zip-handler.ts` |

### Seções Duplicadas
Quando o mesmo tipo de seção aparece mais de uma vez:
- Primeira ocorrência: `header.json`
- Segunda: `header-2.json`
- Terceira: `header-3.json`

---

## Formato do JSON Elementor v0.4

```json
{
  "title": "Minha Página",
  "type": "page",
  "version": "0.4",
  "page_settings": {
    "hide_title": "yes",
    "page_layout": "elementor_canvas",
    "custom_css": ""
  },
  "content": [
    {
      "id": "a1b2c3d4",
      "elType": "container",
      "isInner": false,
      "settings": {
        "background_color": "#0A0A0A",
        "padding": { "top": "80", "bottom": "80" }
      },
      "elements": [
        {
          "id": "e5f6a7b8",
          "elType": "widget",
          "widgetType": "heading",
          "isInner": false,
          "settings": {
            "title": "Título Principal",
            "header_size": "h1",
            "align": "center"
          },
          "elements": []
        }
      ]
    }
  ]
}
```

---

## `page_settings` Obrigatórios

| Campo | Valor | Motivo |
|---|---|---|
| `hide_title` | `"yes"` | Oculta o título padrão do WordPress |
| `page_layout` | `"elementor_canvas"` | Canvas limpo sem header/footer do tema |
| `custom_css` | `""` | Campo obrigatório pelo Elementor (pode ser preenchido) |

---

## Estrutura do ZIP

```
paginas.zip
  ├── sections/
  │     ├── page.json
  │     ├── header.json
  │     ├── hero.json
  │     ├── services.json
  │     └── footer.json
  ├── assets/
  │     └── images/
  │           └── imagem-extraida.png (base64 decodificado)
  └── LEIA-ME.txt
```

---

## Como Importar no Elementor

1. Abrir a página no WordPress → editar com Elementor
2. Clicar em `Pasta` (ícone de Template) → `Importar`
3. Selecionar `page.json` ou o JSON da seção específica
4. Aguardar importação → seção aparece no canvas

---

## Geração de JSON (elementor-exporter.ts)

```typescript
exportElementorTemplate(
  elements: ElementorElement[],
  title: string,
  type: ElementorTemplateType
): string
```

- Envolve `elements` em `{ title, type, version: '0.4', page_settings, content: elements }`
- Retorna `JSON.stringify(template, null, 2)` (formatado para legibilidade)
- Não chama `validateTemplate` — validação é responsabilidade de `useConversion.ts`

---

## Geração de ZIP (zip-handler.ts)

```typescript
generateZip(exports: SectionExport[], pageJson: string): Promise<Blob>
```

- Usa JSZip para criar arquivo em memória
- Adiciona `sections/page.json` + cada `sections/${section.outputFile}`
- Converte imagens base64 de `extractedImages` para `assets/images/`
- Retorna `Blob` para download direto

---

## Download (downloadFile.ts)

```typescript
downloadJson(content: string, filename: string): void
downloadZip(blob: Blob, filename: string): void
```

- Cria `<a>` temporário, `click()`, remove
- `filename` = `section.outputFile` (ex: `hero.json`)

---

## Limitações Atuais

| Limitação | Impacto | Roadmap |
|---|---|---|
| Sem histórico de exports | Usuário não pode baixar versão anterior | SPEC-001 Smart Export Manager |
| Sem seleção parcial de seções | Só exporta tudo ou uma seção por vez | SPEC-001 |
| Sem indicador "modificado" | Usuário não sabe o que mudou desde último export | SPEC-001 |
| Sem formatos alternativos | Só Elementor JSON — sem WPBakery, Divi, Gutenberg | Sprint 5 |
| Sem export server-side | ZIP gerado no browser — limitado por memória disponível | V3 API |
