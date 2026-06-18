# 02_PRODUCT_MANIFEST.md — Manifesto do Produto
> Fonte: `prompts/PROMPT.md` (seções de produto) | Status: **Estável**

---

## Role do Sistema

O WebKeeper 2Elementor é o **Arquiteto Principal** responsável por construir o mecanismo de conversão mais preciso do mercado entre diferentes fontes de layout e o ecossistema Elementor.

O sucesso **não** é medido pela quantidade de código produzido. É medido pela **taxa de fidelidade** entre o projeto original e o resultado importado no Elementor.

---

## Entradas Suportadas

Todos os formatos utilizam o **mesmo núcleo interno** — nunca criar pipelines independentes:

```
HTML   ─────────────────────────────────→ Parser HTML → Modelo Universal
ZIP    → Extração ──────────────────────→ Parser HTML → Modelo Universal
Imagem → Vision AI ─────────────────────────────────→ Modelo Universal
URL    → Crawler → HTML (roadmap) ──────→ Parser HTML → Modelo Universal
```

| Entrada | Status |
|---|---|
| HTML (paste / arquivo / drag-drop) | ✅ Ativo |
| ZIP (múltiplos HTMLs + imagens) | ✅ Ativo |
| Imagem / Screenshot | ✅ Ativo |
| URL | Roadmap Sprint 2B |
| Figma | Futuro V3 |
| PSD | Futuro |
| PDF | Futuro |

---

## Filosofia de Engenharia

O sistema deve pensar como um arquiteto humano — nunca apenas converter código. Ele deve compreender a **intenção semântica do layout**.

Durante toda conversão, o sistema responde:
- "Este bloco é um Card? Um Hero? Um CTA? Um Grid? Uma Timeline?"
- "Este elemento tem um widget Elementor nativo equivalente?"
- "Esta estrutura é semântica ou apenas visual?"

A conversão deve ser **semântica, nunca apenas sintática**.

Cada melhoria implementada deve beneficiar **todas as conversões futuras** — nunca apenas resolver um caso específico com uma condicional isolada.

---

## Modos de Geração

| Modo | Quando usar | Referência |
|---|---|---|
| **CREATE MODE** | Página não existe no Elementor — nenhum JSON prévio | `07_PIPELINE.md` |
| **EDIT MODE** | Página já existe — JSON original disponível | `25_EVOLUTION_SYSTEM.md` |
| **REFINE MODE** | JSON existe, IA melhora focando em 1 seção ou página toda | `07_PIPELINE.md` |
| **VISION MODE** | Entrada via imagem — bypass do HTML parser | `07_PIPELINE.md` |

```
Há um JSON original da página?
  ├── NÃO → CREATE MODE ou VISION MODE
  └── SIM → EDIT MODE (consultar 25_EVOLUTION_SYSTEM.md ANTES de qualquer ação)
```

---

## Proibições Absolutas

- ❌ Escrever código apenas para "fazer passar"
- ❌ Criar condicionais específicas para um HTML isolado
- ❌ Duplicar funções ou lógicas existentes
- ❌ Gerar JSON do zero quando um JSON original foi fornecido (EDIT MODE obrigatório)
- ❌ Modificar arquivos `.md` sem solicitação explícita
- ❌ Exportar sem validação completa

---

## Métricas de Sucesso do Produto

O projeto será considerado maduro quando:

- Qualquer HTML moderno puder ser convertido com **score > 90%**
- Imagens e screenshots seguirem o **mesmo pipeline** do HTML
- A estrutura Elementor gerada for **limpa, organizada e totalmente editável**
- O sistema gerar **scores de qualidade mensuráveis** por conversão
- Existir **validação automática** antes de toda exportação
- O pipeline for **iterativo**, aprendendo com cada tentativa
- A arquitetura for **modular**, preparada para novos formatos sem reescrever o núcleo

---

## Arquivos de Saída Suportados

| Arquivo | Conteúdo |
|---|---|
| `page.json` | Página completa (todas as seções) |
| `header.json` / `header-2.json` | Header/nav (numerado se duplicado) |
| `hero.json` | Hero section |
| `services.json` | Seções de serviços |
| `faq.json` | FAQ accordion |
| `cta.json` | Call to Action |
| `footer.json` | Footer |
| `paginas.zip` | Todos os arquivos + assets de imagem base64 |

---

## Deploy Atual

```
push → main
  ↓ GitHub Actions
  ↓ npm ci && npm run build
  ↓ FTP Upload dist/ → Hostinger public_html/2elementor/
```

| Secret GitHub | Valor |
|---|---|
| `FTP_SERVER` | ftp.seudominio.com.br |
| `FTP_USERNAME` | usuário FTP |
| `FTP_PASSWORD` | senha FTP |
| `FTP_PORT` | 21 |
| `FTP_REMOTE_DIR` | /public_html/2elementor/ |
| `VITE_PROXY_URL` | https://2elementor.web3cafe.workers.dev |
