# 25_EVOLUTION_SYSTEM.md — Sistema de Evolução de Páginas (EDIT MODE)
> Fonte: `prompts/PAGE_EVOLUTION.md` | Status: **Estável**
> **LEIA ESTE ARQUIVO INTEGRALMENTE antes de qualquer operação EDIT MODE**

---

## Quando Aplicar Este Documento

Este documento se aplica exclusivamente quando uma página **já existe no Elementor** — foi importada, configurada e está publicada ou salva como template. O JSON original da página é um artefato vivo: representa horas de trabalho humano em configurações de widgets, CSS customizado, animações, links e identidade visual deliberadamente construída.

```
Há um JSON original da página?
  ├── NÃO → CREATE MODE (pipeline padrão em 07_PIPELINE.md)
  └── SIM → EDIT MODE — este documento define TODAS as regras
```

---

## Filosofia: O Cirurgião

O modelo mental correto é o do cirurgião: ele não refaz o corpo inteiro para operar um órgão. Opera apenas o que precisa, com o menor corte possível, e fecha tudo exatamente como estava.

> **O princípio que governa todo EDIT MODE:**
> **Menos é mais. Alterar menos garante mais estabilidade. Preservar é o ato principal — modificar é a exceção.**

---

## Regra Número 1 — Preservação Máxima

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

## Política "Editar ao Invés de Recriar"

| Situação | Ação CORRETA | Ação PROIBIDA |
|---|---|---|
| Texto de um heading mudou | Editar `settings.title` no widget existente | Recriar o widget `heading` |
| Cor de fundo de uma section mudou | Editar `settings.background_color` | Recriar a section |
| Um botão foi adicionado a um container | Inserir novo widget `button` no container correto | Recriar o container |
| Uma seção inteira foi removida do HTML | Remover apenas essa section do JSON | Regenerar o JSON completo |
| Um novo bloco foi adicionado | Inserir nova section no ponto correto do `content[]` | Recriar todas as sections |
| Uma imagem foi substituída | Atualizar `settings.image.url` no widget existente | Recriar o widget `image` |

---

## Diferença: CREATE MODE vs EDIT MODE

| Dimensão | CREATE MODE | EDIT MODE |
|---|---|---|
| Quando usar | Página não existe | Página já existe no Elementor |
| Entradas | HTML / ZIP / Imagem | HTML atualizado + JSON original + Imagem ref. |
| Objetivo | Converter máximo de layout | Preservar máximo do JSON existente |
| Elementos existentes | Não existem — criar todos | Devem ser mantidos |
| Estratégia JSON | Geração completa do zero | Diff mínimo — editar, nunca recriar |
| Destruição | Total (é criação) | Zero por padrão |
| Tamanho do output | Máximo necessário | Mínimo possível |
| Perfil de risco | Baixo | Alto (perda irreversível sem backup) |

---

## Artefatos Obrigatórios no EDIT MODE

1. **HTML atualizado** — nova versão refletindo o estado desejado
2. **JSON original** — exportado do Elementor (`Templates → Export`)
3. **Imagem de referência** *(recomendado)* — screenshot do estado atual

> Se o JSON original não for fornecido, o EDIT MODE não pode ser executado com segurança.

---

## Pipeline EDIT MODE (implementado em `useConversion.evolve()`)

Ver `07_PIPELINE.md` para pipeline completo. Resumo:

```
[1] Parsing do HTML atualizado
[2] Snapshotting: snapshot do JSON original + snapshot do HTML novo
[3] Diffing: computeDiff(originalSnapshot, newSnapshot) → PageDiff
[4] Patching: applyDiff(originalTemplate, diff) → patchedTemplate (spread-based)
[5] Validating: validateTemplate + validateNoRegression
[6] Correcting: validateStructuralIntegrity → applyStructuralCorrections (até 3x)
[7] Quality Gate: validateVisual + runQualityGate
[8] Resultado com diff, snapshot, structuralReport incluídos
```

---

## Checklist EDIT MODE

### Antes de executar
- [ ] JSON original está disponível e é o arquivo exportado pelo Elementor
- [ ] HTML atualizado tem as mesmas seções (IDs nos `<section>` correspondem)
- [ ] Backup do JSON original feito (salvo localmente antes de qualquer mudança)
- [ ] O escopo da mudança está claro (o que muda, o que NÃO muda)

### Durante
- [ ] Usar `evolve()`, não `convert()`
- [ ] Não regenerar IDs fora do escopo
- [ ] Não substituir `page_settings`

### Após
- [ ] Validar que o número de sections é o mesmo (salvo remoção intencional)
- [ ] Verificar que widgets fora do escopo não foram alterados
- [ ] Verificar que IDs hex dos elementos preservados continuam iguais
- [ ] Testar importação no Elementor antes de publicar
- [ ] Se detectado regressão: usar o backup do JSON original

---

## Regras para `refineSection()` em EDIT MODE

O `refineSection()` pode ser usado sobre um JSON que foi evoluído via EDIT MODE. Nesse caso:
- Apenas a seção especificada é reenviada ao Worker
- O HTML da seção vem de `section.nodes.map(n => n.rawHtml)` (HTML pós-parsing)
- O JSON da seção vem do `template` atual daquela seção (já evoluído)
- As outras seções não são afetadas
- O `status` global não muda — spinner apenas no card da seção

**Limitação:** Se a seção foi evoluída via EDIT MODE (spread-based), o `rawHtml` pode não refletir exatamente o HTML original (foi transformado pelo parser). O refinamento ainda funciona, mas com menos contexto visual.

---

## Casos Especiais

### Seção não existe no HTML mas existe no JSON
→ Preservar a seção no JSON. EDIT MODE não remove o que não está no HTML atualizado.

### Nova seção existe no HTML mas não existe no JSON
→ Inserir como nova section no ponto correto (baseado na posição relativa no HTML).

### Widget alterado profundamente (novo layout)
→ Atualizar os `settings` do widget existente. Se impossível preservar o ID, documentar no PR.

### `page_settings.custom_css` existe no JSON original
→ SEMPRE preservar. Nunca sobrescrever com string vazia.
