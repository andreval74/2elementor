# Plano: Fidelidade Máxima na Conversão para Elementor

> **Status:** Aguardando aprovação do usuário
> **Data:** 2026-06-18
> **Autor:** Assistant

---

## 1. Resumo do Problema

Atualmente o sistema consegue converter HTML para Elementor JSON, mas a fidelidade é baixa. Detalhes que estão sendo perdidos:
- Gradientes, sombras, glows, opacidade
- Responsividade (breakpoints mobile/tablet/desktop)
- Animações e transições CSS
- Configurações específicas de widgets Elementor
- Imagens referenciadas no background-image CSS
- Bordas complexas
- Espaçamentos precisos
- Tipografia detalhada (line-height, letter-spacing, etc.)

---

## 2. Análise das Opções (Antes de Decidir)

| Opção | Vantagens | Desvantagens |
|-------|-----------|--------------|
| **1. Apenas Widgets Nativos** | Tudo editável | Muitos CSS não tem equivalente; fidelidade baixa |
| **2. Apenas Widget HTML** | 100% de fidelidade | Nada é editável visualmente; UX ruim |
| **3. Estratégia Híbrida Inteligente** | Balança editabilidade e fidelidade | Requer IA; mais complexo |

---

## 3. Plano de Implementação (Etapas)

### Etapa 1: Análise do Código Existente (1–2 horas)
- [ ] Revisar `html-parser.ts` para ver o que já está sendo extraído
- [ ] Revisar `elementor-mapper.ts` para ver o que já está mapeado
- [ ] Revisar `elementor.types.ts` para ver o que pode ser expandido
- [ ] Criar uma página de referência Elementor com todos os widgets e exportar JSON para análise

### Etapa 2: Melhorar o HTML Parser (2–3 horas)
- [ ] Extrair todas as classes CSS dos elementos (não só algumas Tailwind)
- [ ] Extrair todos os estilos inline
- [ ] Extrair media queries do `<style>` e CSS externo
- [ ] Extrair background-image URLs do CSS inline e classes
- [ ] Extrair gradientes do CSS

### Etapa 3: Expandir o Elementor Mapper (4–6 horas)
- [ ] Mapear mais cores: `text-[#xxx]`, `bg-[#xxx]`, `text-opacity-x`, `bg-opacity-x`
- [ ] Mapear espaçamentos precisos: `m-*`, `p-*`, `gap-*`, etc.
- [ ] Mapear bordas completas: espessura, cor, estilo, raio por canto
- [ ] Mapear sombras: `shadow-*`, `drop-shadow-*`
- [ ] Mapear tipografia completa: `font-size`, `font-weight`, `line-height`, `letter-spacing`, `font-family`
- [ ] Mapear gradientes de fundo
- [ ] Mapear background-image (URLs)
- [ ] Mapear responsividade (breakpoints Elementor)
- [ ] Mapear animações para Elementor Motion Effects

### Etapa 4: Criar o Decision Engine (2–3 horas)
- [ ] Usar IA Vision para decidir por seção:
  - "Modo Nativo": Layouts simples, sem CSS complexo
  - "Modo Preservação Total": Layouts complexos com gradientes/glows/animações
- [ ] Implementar smart fallback: se score de fidelidade < 80%, volta para widget html

### Etapa 5: Melhorar o Validador Visual (2–3 horas)
- [ ] Comparar screenshot original com preview do Elementor
- [ ] Calcular score de fidelidade por pixel
- [ ] Detectar divergências em cores, layout, imagens

### Etapa 6: Atualizar a UI (1–2 horas)
- [ ] Mostrar o score de fidelidade na UI
- [ ] Permitir o usuário alternar entre "Modo Nativo" e "Modo Preservação Total" manualmente
- [ ] Mostrar o que está sendo preservado

### Etapa 7: Testes e Validação (2–3 horas)
- [ ] Criar casos de teste para o novo parser
- [ ] Criar casos de teste para o novo mapper
- [ ] Testar com 5–10 HTMLs diferentes
- [ ] Verificar importação no Elementor real

### Etapa 8: Atualizar Documentação (1 hora)
- [ ] Atualizar `20_CHANGELOG.md`
- [ ] Atualizar `governance/CURRENT_STATE.md`
- [ ] Atualizar `05_ARCHITECTURE.md`
- [ ] Atualizar `PROMPT.md`

---

## 4. Arquivos que Serão Alterados/Criados

### Arquivos a Alterar
1. `src/services/html-parser.ts`
2. `src/services/elementor-mapper.ts`
3. `src/types/elementor.types.ts`
4. `src/utils/constants.ts`
5. `src/components/OutputPanel/index.tsx`
6. `docs/wkos/21_ADR.md` (já feito)
7. `docs/wkos/05_ARCHITECTURE.md`
8. `docs/wkos/governance/CURRENT_STATE.md`
9. `CHANGELOG.md`

### Arquivos a Criar
1. `src/services/fidelity-decision-engine.ts` (Decision Engine IA)
2. `src/test/html-parser-expanded.test.ts`
3. `src/test/elementor-mapper-expanded.test.ts`
4. `src/services/css-extractor.ts` (extrair CSS das classes)

---

## 5. Impacto na Arquitetura

- **Nenhuma quebra de compatibilidade:** Evolui incrementalmente, mantendo o que já funciona
- **Adiciona uma nova camada:** `fidelity-decision-engine.ts` (sem alterar o resto)
- **Melhora a qualidade:** Adiciona mais validação e mais mapeamento

---

## 6. Ordem de Execução

1. **Etapa 1** (Análise): Agora — sem alterar código
2. **Etapa 2** (Parser): Primeiro código a alterar
3. **Etapa 3** (Mapper): Depois do parser
4. **Etapa 4** (Decision Engine): Depois do mapper
5. **Etapa 5** (Validador): Depois do Decision Engine
6. **Etapa 6** (UI): Depois dos serviços
7. **Etapa 7** (Testes): Finalizar com testes
8. **Etapa 8** (Docs): Atualizar documentação

---

## 7. Next Steps

### Primeira Ação do Usuário

**Aprovar este plano!**

Depois que o usuário aprovar, vou começar a executar a **Etapa 1** (Análise do Código Existente) em seguida.

---

## 8. Observações Importantes

- **Não quebrar o que já funciona:** Toda alteração é incremental
- **Seguir as regras do WKOS:** Sempre consultar `05_ARCHITECTURE.md` e `03_CTO_GUIDE.md`
- **Sem reescrita total:** Usar spread e patching
- **Testes obrigatórios:** Todo código novo tem teste
- **Commit pequenos:** 1 feature por commit, com mensagens claras
