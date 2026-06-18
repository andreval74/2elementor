# PAGE_EVOLUTION.md — Evolução e Atualização de Páginas Existentes
# WebKeeper Elementor Exporter
# Consultar sempre que uma página já existir no Elementor e precisar de atualização

---

## CONTEXTO — QUANDO USAR ESTE DOCUMENTO

Este documento se aplica exclusivamente quando uma página **já existe no Elementor** — foi importada, configurada e está publicada ou salva como template. Nesse cenário, o JSON original da página é um artefato vivo: representa horas de trabalho humano em configurações de widgets, CSS customizado, animações, links e identidade visual deliberadamente construída.

Qualquer geração que ignore esse contexto e produza um JSON novo do zero não está evoluindo a página — está destruindo-a. Este documento define as regras, o pipeline e os checklists que garantem que evoluções sejam seguras, cirúrgicas e reversíveis.

> Antes de qualquer ação sobre uma página existente: leia este documento integralmente.

---

## DIFERENÇA ENTRE CREATE MODE E EDIT MODE

| Dimensão | CREATE MODE | EDIT MODE |
|---|---|---|
| **Quando usar** | Página não existe no Elementor — nenhum JSON prévio disponível | Página já existe — tem JSON original ou está publicada |
| **Entradas** | HTML / ZIP / Imagem | HTML atualizado + JSON original + Imagem de referência |
| **Objetivo principal** | Converter o máximo de layout em JSON válido | Preservar o máximo do JSON existente, alterar só o necessário |
| **Tratamento de elementos existentes** | Não existem — criar todos | Devem ser mantidos salvo instrução explícita de remoção |
| **Estratégia de JSON** | Geração completa do zero | Diff mínimo — editar, nunca recriar |
| **Destruição permitida** | Total (é criação, não há o que perder) | Zero por padrão; cirúrgica apenas quando autorizada |
| **Tamanho do output** | Máximo necessário para representar o layout | Mínimo possível — proporcional ao escopo da mudança |
| **Perfil de risco** | Baixo (página inexistente) | Alto (perda de widgets é irreversível sem backup) |

**Regra de ativação:**

```
Há um JSON original da página?
  ├── NÃO → CREATE MODE — pipeline padrão (PROMPT.md)
  └── SIM → EDIT MODE — este documento define todas as regras
```

Na ausência do JSON original, o EDIT MODE **não pode ser executado**. Solicitar o JSON antes de prosseguir.

---

## FILOSOFIA DE MANUTENÇÃO INCREMENTAL

Cada widget em uma página Elementor publicada representa decisões deliberadas: um heading tem um tamanho tipográfico escolhido, uma cor selecionada, um alinhamento definido. Um container tem padding calibrado, uma cor de fundo escolhida. Um widget HTML contém CSS escrito à mão que pode não existir em nenhum outro lugar.

Uma ferramenta que substitui essa página por uma versão gerada do zero não está evoluindo — está apagando. O trabalho acumulado, as iterações de design, os ajustes de responsividade: tudo perdido em uma única geração descuidada.

O modelo mental correto é o do cirurgião: ele não refaz o corpo inteiro para operar um órgão. Opera apenas o que precisa, com o menor corte possível, e fecha tudo exatamente como estava.

**O princípio que governa todo EDIT MODE:**

> **Menos é mais. Alterar menos garante mais estabilidade. Preservar é o ato principal — modificar é a exceção.**

---

## REGRA NÚMERO 1 — PRESERVAÇÃO MÁXIMA

> **PROIBIDO**: Gerar JSON do zero quando já existe JSON de origem.
> **PROIBIDO**: Substituir o JSON completo para realizar uma mudança parcial.
> **PROIBIDO**: Recriar sections, containers ou widgets que não precisam de alteração.
> **PROIBIDO**: Regenerar IDs hex de elementos existentes.
> **PROIBIDO**: Zerar configurações de `settings` em elementos fora do escopo.

O que "preservação máxima" significa operacionalmente:

- Nenhuma `section` é removida sem instrução explícita do usuário
- Nenhum `container` é removido sem instrução explícita do usuário
- Nenhum `widget` é removido sem instrução explícita do usuário
- Nenhum ID hex é regenerado para elementos que já existiam
- Nenhuma configuração de `settings` é zerada ou sobrescrita fora do escopo
- A ordem dos elementos em `content[]` é preservada salvo instrução de reordenação
- `page_settings` (incluindo `custom_css`) é preservado integralmente

---

## POLÍTICA "EDITAR AO INVÉS DE RECRIAR"

A regra é cirúrgica: identificar exatamente o que mudou e operar apenas naquele ponto.

| Situação | Ação CORRETA | Ação PROIBIDA |
|---|---|---|
| Texto de um heading mudou | Editar `settings.title` no widget existente | Recriar o widget `heading` |
| Cor de fundo de uma section mudou | Editar `settings.background_color` | Recriar a section |
| Um botão foi adicionado a um container | Inserir novo widget `button` no container correto | Recriar o container |
| Uma seção inteira foi removida do HTML | Remover apenas essa section do JSON | Regenerar o JSON completo |
| Um novo bloco de serviços foi adicionado | Inserir nova section no ponto correto do `content[]` | Recriar todas as sections de serviços |
| Uma imagem foi substituída | Atualizar `settings.image.url` no widget existente | Recriar o widget `image` |

---

## ARTEFATOS OBRIGATÓRIOS NO EDIT MODE

Antes de iniciar qualquer EDIT MODE, os seguintes artefatos devem estar disponíveis:

1. **HTML atualizado** — a nova versão do HTML que reflete o estado desejado da página após a evolução
2. **JSON original** — o JSON Elementor atual da página, exportado do Elementor antes de qualquer alteração (`Elementor → Templates → Export`)
3. **Imagem de referência** — screenshot do estado atual da página publicada, para validação visual do que deve ser preservado
4. **Imagem do estado desejado** *(opcional, mas recomendado)* — mockup ou screenshot do resultado esperado após a evolução

> Se o JSON original não for fornecido, o EDIT MODE não pode ser executado com segurança.
> Solicitar o JSON ao usuário antes de qualquer geração.

---

## COMPARAÇÃO OBRIGATÓRIA — OS 4 ARTEFATOS

Antes de gerar qualquer JSON em EDIT MODE, executar obrigatoriamente o ritual de comparação:

```
[1] HTML novo vs. HTML original
    → Identificar: o que foi adicionado? O que foi removido? O que foi modificado?
    → Produzir: lista de mudanças com localização no documento

[2] HTML novo vs. JSON original
    → Mapear: quais elementos do JSON correspondem a cada mudança do HTML?
    → Produzir: tabela de correspondência (mudança HTML → elemento JSON)

[3] JSON original vs. imagem de referência
    → Validar: o JSON original reflete fielmente a página atual?
    → Se houver divergência: corrigir ANTES de iniciar o diff de evolução

[4] JSON final vs. imagem do estado desejado (após geração)
    → Confirmar: o resultado visual corresponde ao esperado?
    → Qualquer divergência não esperada é uma regressão
```

A exportação **não ocorre** antes de completar as 4 etapas.

---

## GERAÇÃO DE JSON MÍNIMO

O JSON final de um EDIT MODE é sempre uma extensão do JSON original — nunca uma recriação.

```typescript
// EDIT MODE — geração mínima
// Princípio: JSON final = JSON original + delta mínimo de mudanças

// CORRETO: modificar apenas o campo que mudou, preservando todos os outros
const updatedWidget = {
  ...originalWidget,                     // ← preserva id, elType, isInner, elements
  settings: {
    ...originalWidget.settings,          // ← preserva todos os settings não alterados
    title: novoTexto                     // ← aplica apenas o campo modificado
  }
}

// PROIBIDO: recriar o widget do zero
const recreatedWidget = buildWidget(novoTexto) // ← perde custom CSS, animações, links,
                                               //   configurações tipográficas, padding,
                                               //   qualquer setting configurado manualmente
```

Qualquer campo não presente no delta permanece exatamente como estava no JSON original. A abordagem spread garante que settings invisíveis no HTML (animações, custom CSS, configurações Pro) não sejam perdidos.

---

## OTIMIZAÇÃO PARA IMPORTAÇÃO ELEMENTOR

Regras técnicas específicas do formato Elementor que são especialmente críticas no EDIT MODE:

| Regra | Motivo |
|---|---|
| Preservar todos os IDs hex existentes | IDs são referências internas — o Elementor não sobrescreve o elemento antigo se o ID mudar; cria um novo |
| Nunca usar `generateId()` para elementos existentes | Resulta em duplicação, não atualização |
| Manter `version: "0.4"` inalterado | Imutável — qualquer alteração invalida o arquivo |
| Preservar `page_settings` integralmente | Contém `custom_css` global que pode não estar visível no diff do HTML |
| Manter ordem dos elementos em `content[]` | Elementor renderiza na ordem do array — reordenar quebra o layout visual |
| Não alterar `elements: []` em widgets existentes | Pode conter configurações extras em versões Pro não visíveis no JSON básico |

---

## CHECKLIST OBRIGATÓRIO ANTES DA GERAÇÃO (EDIT MODE)

### Entrada
- [ ] JSON original foi fornecido e está válido (`version: "0.4"`, `content` é array)
- [ ] HTML atualizado foi fornecido
- [ ] Imagem de referência foi fornecida (ou ausência foi documentada com justificativa)
- [ ] Os 4 artefatos foram comparados conforme seção "Comparação Obrigatória"

### Análise de diff
- [ ] Lista de mudanças foi produzida (adições, remoções, modificações com localização)
- [ ] Cada mudança foi mapeada a um elemento específico do JSON original
- [ ] Nenhuma mudança além do escopo declarado foi incluída no plano

### Preservação
- [ ] Todos os IDs hex originais foram preservados nos elementos não alterados
- [ ] Nenhuma section foi removida sem instrução explícita
- [ ] Nenhum container foi removido sem instrução explícita
- [ ] Nenhum widget foi removido sem instrução explícita
- [ ] `page_settings` foi preservado integralmente
- [ ] CSS global em `page_settings.custom_css` não foi alterado

### Saída
- [ ] O JSON final foi produzido como extensão do JSON original (não recriado)
- [ ] O tamanho do diff é proporcional ao escopo da mudança solicitada
- [ ] Validação estrutural passou (`version`, IDs únicos, profundidade ≤ 10)
- [ ] Validação visual foi executada (seção "Validação Visual Antes da Entrega")

---

## REGRAS PARA EVITAR REGRESSÕES

**Definição de regressão:** qualquer mudança no JSON final que altera o comportamento ou aparência de elementos que **não faziam parte do escopo** da alteração solicitada.

**Tipos de regressão:**

| Tipo | Exemplo |
|---|---|
| **Estrutural** | Section, container ou widget removido fora do escopo |
| **Visual** | Cor, tipografia ou espaçamento alterado em elemento não solicitado |
| **Funcional** | Link, token ou número de WhatsApp modificado em widget não em escopo |

> **Toda regressão é um erro crítico — impede a exportação.**

**Como detectar:** comparar JSON original vs. JSON final elemento por elemento. Qualquer diferença fora do escopo declarado é uma regressão e deve ser corrigida antes da entrega.

**Como prevenir:** aplicar o delta apenas nos elementos mapeados na etapa de análise de diff. Nunca "melhorar" elementos fora do escopo, mesmo que pareça uma oportunidade de melhoria.

---

## REGRAS DE PROTEÇÃO DE ESTRUTURA

### Proteção de Widgets

- Um widget só pode ser modificado se seu conteúdo correspondente no HTML mudou
- Um widget só pode ser removido se sua section equivalente foi explicitamente removida do HTML
- Widgets com `widgetType: "html"` têm **proteção máxima** — contêm CSS e JS customizado que pode não existir em nenhum outro lugar do projeto e é irrecuperável após perda
- Nunca recriar um widget `html` quando apenas seu conteúdo de texto mudou — editar o campo `settings.html` preservando todo o CSS inline

### Proteção de Containers

- Containers são a estrutura de layout — sua remoção ou recriação destrói o espaçamento, alinhamento e hierarquia visual de todos os elementos filho
- Um container só pode ser removido se todos os seus filhos também foram explicitamente removidos do HTML
- Nunca recriar um container apenas para ajustar `flex_direction` — editar apenas esse campo nos `settings` do container existente
- Alterações de `padding`, `gap` e `background_color` do container devem ser cirúrgicas

### Proteção de Sections

- Sections são as unidades visuais maiores da página — sua remoção é perceptível imediatamente e geralmente irreversível sem backup
- Uma section só pode ser removida com **confirmação explícita do usuário** (não inferir remoção de section a partir de ausência no HTML)
- A ordem das sections reflete a ordem visual da página — nunca reordenar sections sem instrução explícita
- Sections com `settings.background_image` ou `settings.background_video` têm proteção especial — esses assets podem não estar mais disponíveis para reconfiguração

---

## ESTRATÉGIA PARA MANTER IDENTIDADE VISUAL

A identidade visual de uma página é o conjunto de sinais que a torna reconhecível: paleta de cores, escala tipográfica, ritmo de espaçamento, fundos das sections, estilo dos botões. Esses sinais vivem primariamente nos campos `settings` dos elementos existentes.

**Hierarquia de confiança em conflitos:**

> Quando houver conflito entre o HTML atualizado e o JSON original sobre cores, tipografia ou espaçamentos:
> **o JSON original tem prioridade** — ele reflete decisões visuais já aprovadas e publicadas.

**Regras específicas:**

| Elemento | Regra |
|---|---|
| `settings.background_color` de sections | Nunca alterar sem instrução explícita — mesmo que o HTML novo use outra cor |
| `settings.title_color` e `settings.text_color` | Preservar — a paleta foi definida deliberadamente |
| `settings.padding` e `settings.margin` de containers | Preservar — o ritmo de espaçamento é parte da identidade |
| `settings.typography_*` em widgets de texto | Preservar família, tamanho e peso — nunca sobrescrever com padrões genéricos |
| `settings.button_background_color` | Preservar — o estilo dos botões define a linguagem de ação da página |

**Extração de identidade visual do JSON original:**

Antes de adicionar qualquer elemento novo, extrair do JSON original:
1. Paleta de cores dominante (background_color das sections, title_color dos headings)
2. Família tipográfica principal (typography_font_family dos widgets de texto)
3. Padrão de padding (unidade e valores mais frequentes nos containers)
4. Estilo de botão recorrente (cor, border-radius, text do button widget)

Todo elemento novo adicionado em EDIT MODE deve seguir essa identidade extraída.

---

## VALIDAÇÃO VISUAL ANTES DA ENTREGA

A exportação só é autorizada após validação visual completa. As etapas abaixo combinam verificação automatizada (integrada no pipeline) com checklist manual.

### Passo 1 — Comparação visual automatizada

`src/services/visual-validator.ts` executa automaticamente como parte do pipeline EDIT MODE (`evolve()`), comparando original vs. evoluído em 4 dimensões e produzindo `VisualValidationResult` em `ConversionResult.visualValidation`:

| Dimensão | O que verifica | Peso no score |
|---|---|---|
| `colorScore` | Sobreposição de cores de fundo das sections | 25% |
| `typographyScore` | Sobreposição de famílias tipográficas | 25% |
| `layoutScore` | Razão de sections e widgets em relação ao original | 35% |
| `mediaScore` | Sobreposição de URLs de imagem | 15% |

Para inspeção manual do HTML renderizado: usar `src/utils/elementor-renderer.ts` para renderizar JSON original e JSON final lado a lado e confirmar visualmente que apenas as áreas do escopo declarado apresentam diferença.

### Passo 2 — Checklist visual

- [ ] Paleta de cores mantida nas sections fora do escopo
- [ ] Tipografia mantida (família, tamanho, peso) nos textos não modificados
- [ ] Espaçamentos preservados (padding/margin de containers não alterados)
- [ ] Imagens preservadas (URLs não alteradas em widgets image fora do escopo)
- [ ] Botões preservados (texto, cor, link) nos widgets button fora do escopo
- [ ] Layout geral (número de sections, ordem visual) compatível com imagem de referência

### Passo 3 — Score de qualidade (Quality Gate)

A validação anti-regressão estrutural é executada automaticamente por `validateNoRegression()` e `validateStructuralIntegrity()`. O Quality Gate (`quality-gate.ts`) consolida todos os scores em `ConversionResult.qualityGateResult`.

**Thresholds mínimos em EDIT MODE:**

| Dimensão | Score mínimo | Implementado em |
|---|---|---|
| Estrutural (básica + integridade profunda) | 85/100 | `validator.ts` + `structural-validator.ts` |
| Visual (cores, tipografia, layout, media) | 70/100 | `visual-validator.ts` |
| Confiança de detecção de seções | 40/100 | `quality-gate.ts` |
| Score geral (structural 50% + visual 30% + confidence 20%) | 75/100 | `quality-gate.ts` |

Score abaixo do threshold → warning não bloqueante. Erros estruturais (`severity: 'error'`) → bloqueiam exportação.

---

## FLUXO DE EVOLUÇÃO (EDIT MODE PIPELINE)

```
Artefatos de entrada
  │
  ├── HTML atualizado
  ├── JSON original
  ├── Imagem de referência atual
  └── Imagem do estado desejado (opcional)
         │
         ▼
  [1] VALIDAÇÃO DE ENTRADA
      Verificar: JSON original válido, HTML fornecido
      Executar: checklist pré-geração (seção "Checklist Obrigatório")
         │
         ▼
  [2] ANÁLISE DE DIFF
      Comparar HTML novo vs. HTML original → lista de mudanças
      Mapear mudanças → elementos do JSON original
      Produzir: tabela de correspondência (mudança → elemento)
         │
         ▼
  [3] PLANO DE MODIFICAÇÕES
      Para cada mudança: identificar operação mínima (edit / add / remove)
      Validar: nenhuma operação além do escopo declarado
      Confirmar com usuário se houver remoção de section ou container
         │
         ▼
  [4] APLICAÇÃO CIRÚRGICA
      Aplicar delta mínimo no JSON original (spread-based)
      Preservar todos os IDs, settings e elementos não em escopo
         │
         ▼
  [5] VALIDAÇÃO ESTRUTURAL
      Mesmas verificações do CREATE MODE via validator.ts
      (version, IDs únicos, hierarquia, profundidade ≤ 10)
         │
         ▼
  [6] VALIDAÇÃO ANTI-REGRESSÃO
      Comparar JSON original vs. JSON final fora do escopo
      Zero diferenças permitidas além do escopo declarado
         │
         ▼
  [7] VALIDAÇÃO VISUAL + QUALITY GATE
      Comparação visual automatizada (cores, tipografia, layout, media) → VisualValidationResult
      Score de qualidade geral → QualityGateResult (blockers bloqueiam; warnings são logados)
      Checklist visual manual: ver seção "Validação Visual Antes da Entrega"
         │
         ▼
  [8] EXPORTAÇÃO
      JSON final pronto para reimportação no Elementor
      (Elementor → Templates → Import)
```

---

## REGRAS DE COMMITS E DOCUMENTAÇÃO EM EDIT MODE

Toda evolução deve ser documentada para rastreabilidade:

**Prefixo de commit:**
```bash
git commit -m "feat(evolution): adiciona nova section de cases na página de serviços"
git commit -m "fix(evolution): corrige texto do hero e preserva identidade visual"
```

**Entrada no CHANGELOG.md:**
```markdown
## [1.2.1] - 2024-06-17
### Changed (Evolution — EDIT MODE)
- Hero section: texto do headline atualizado
- Preservados: todas as demais 12 sections, configurações visuais, CSS customizado
- Escopo declarado: apenas settings.title do widget heading no hero
```

A declaração de escopo no CHANGELOG é obrigatória — ela permite auditar futuramente se uma regressão foi intencional ou acidental.

---

## REFERÊNCIAS CRUZADAS

```
Para entender o pipeline de criação do zero    → PROMPT.md (seção PRINCÍPIOS FUNDAMENTAIS)
Para entender a estrutura técnica dos módulos  → ARCHITECTURE.md
Para entender o formato JSON Elementor         → PROMPT.md (seção ESPECIFICAÇÃO TÉCNICA)
Para regras de código durante qualquer evolução → DEVELOPMENT_RULES.md
Para o roadmap de funcionalidades de EDIT MODE → VISION.md (V3 — Inteligência Artificial)
```
