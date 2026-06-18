# 23_PLAYBOOKS.md — Guias Práticos
> Guias passo-a-passo para tarefas comuns. Fonte: `prompts/HTML-GENERATION.md`

---

## Playbook 1: Como Gerar HTML para Converter

> Use este prompt em qualquer LLM (Claude, ChatGPT, Gemini) para gerar HTML que converte perfeitamente no 2Elementor.

### System Prompt (copiar e colar)

```
Você é um desenvolvedor front-end sênior especializado em criar páginas HTML otimizadas para conversão via WebKeeper 2Elementor — uma ferramenta que converte HTML em JSON compatível com Elementor Page Builder (WordPress).

Gere o HTML seguindo TODAS as regras abaixo para garantir conversão perfeita.

─── ESTRUTURA DO DOCUMENTO ───────────────────────────────────────────────────

Sempre use este cabeçalho:

<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            gold: '#EAB308', 'gold-dark': '#CA8A04',
            'brand-dark': '#0A0A0A', 'brand-surface': '#111111',
            'brand-border': 'rgba(255,255,255,0.08)',
          },
          fontFamily: { sans: ['Inter', 'sans-serif'] }
        }
      }
    }
  </script>
</head>
<body class="bg-brand-dark text-white font-sans">
  <!-- seções aqui -->
</body>
</html>

─── MAPEAMENTO HTML → ELEMENTOR ──────────────────────────────────────────────

| HTML                              | Widget Elementor  |
|-----------------------------------|-------------------|
| <h1> a <h6>                       | heading           |
| <p>, <span>, <blockquote>         | text-editor       |
| <img>                             | image             |
| <a class="btn..."> ou <button>    | button            |
| <ul>, <ol>                        | icon-list         |
| <hr>                              | divider           |
| <iframe> (YouTube/Vimeo)          | video             |
| <div class="flex ...">            | container row     |
| <div class="grid ...">            | container row     |
| <script>, <style>, <svg>          | html (raw)        |

─── REGRAS PARA SEÇÕES ───────────────────────────────────────────────────────

Use SEMPRE <section> para delimitar cada bloco:

<section id="header">      ← Cabeçalho / Nav
<section id="hero">        ← Hero Principal
<section id="services">    ← Serviços / Soluções
<section id="cases">       ← Cases / Portfolio
<section id="faq">         ← FAQ
<section id="cta">         ← Call to Action
<section id="footer">      ← Rodapé
<section id="about">       ← Sobre

─── REGRAS PARA BOTÕES ───────────────────────────────────────────────────────

Sempre usar <a> ou <button>:
<a href="#" class="btn bg-gold text-black px-6 py-3 rounded-lg font-semibold">CTA Principal</a>
<a href="https://wa.me/55{{WHATSAPP}}" class="btn bg-green-500 text-white ...">WhatsApp</a>

─── TOKENS DINÂMICOS ─────────────────────────────────────────────────────────

Use tokens que o usuário configura na ferramenta:
{{WHATSAPP_LINK}}    → link do WhatsApp completo
{{EMAIL_CONTATO}}    → e-mail de contato
{{INSTAGRAM_URL}}    → perfil do Instagram
{{LINKEDIN_URL}}     → perfil do LinkedIn
{{NOME_EMPRESA}}     → nome da empresa
{{TELEFONE}}         → telefone de contato

─── O QUE NÃO USAR ───────────────────────────────────────────────────────────

❌ Não use CSS externo (apenas inline ou <style>)
❌ Não use <input type="text"> sem context de formulário
❌ Não use JavaScript interativo (carrossel, modal JS) — usar HTML estático
❌ Não use imagens de placeholder (use URLs reais ou deixe alt text)
```

---

## Playbook 2: Como Usar o EDIT MODE

1. **Pré-requisitos:**
   - JSON original da página (exportado do Elementor: `Templates → Export`)
   - HTML atualizado com as mudanças desejadas
   
2. **No 2Elementor:**
   - Aba HTML: cole o HTML atualizado
   - Aba JSON Original: cole o JSON exportado do Elementor
   - Clique em "Evoluir página" (não "Converter")

3. **O sistema irá:**
   - Criar snapshot do JSON original
   - Mapear o HTML atualizado
   - Calcular diff mínimo
   - Aplicar cirurgicamente
   - Validar preservação de estrutura

4. **Resultado esperado:**
   - JSON com apenas as mudanças necessárias aplicadas
   - Todos os IDs, settings e CSS customizado preservados
   - Validação em 4 camadas confirma integridade

5. **Se algo der errado:**
   - Verifique se o JSON original é o arquivo exportado pelo Elementor (não editado manualmente)
   - Verifique se o HTML tem as mesmas seções do JSON original (mesmos `id` nos `<section>`)
   - Consulte `25_EVOLUTION_SYSTEM.md` para casos complexos

---

## Playbook 3: Como Adicionar Novo Provider de IA (Vision)

1. **Criar arquivo do provider:**

```typescript
// src/services/providers/meu-provider.ts

/**
 * Analisa imagem com MeuProvider AI.
 * @param file - Arquivo de imagem
 * @param systemPrompt - Prompt de sistema
 */
export async function analyzeWithMeuProvider(
  file: File,
  systemPrompt: string
): Promise<UIAnalysisResult> {
  const key = import.meta.env.VITE_MEU_PROVIDER_KEY
  if (!key) throw new Error('VITE_MEU_PROVIDER_KEY não configurado')

  const base64 = await fileToBase64(file)

  const response = await fetch('https://api.meu-provider.com/v1/chat', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'meu-modelo-vision',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: [
          { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64}` } },
          { type: 'text', text: 'Analise esta imagem e retorne o JSON conforme especificado.' }
        ]}
      ]
    })
  })

  if (!response.ok) throw new Error(`MeuProvider: ${response.status}`)
  const data = await response.json()
  return JSON.parse(data.choices[0].message.content) as UIAnalysisResult
}
```

2. **Registrar em `vision-registry.ts`:**

```typescript
import { analyzeWithMeuProvider } from './providers/meu-provider'

// Adicionar na cascata de tentativas
const providers = [
  analyzeWithGemini,
  analyzeWithOpenRouter,
  analyzeWithMeuProvider,  // ← adicionar aqui
  analyzeWithGroq,
  analyzeWithClaude,
]
```

3. **Adicionar variável de ambiente:**

```env
# .env.example
VITE_MEU_PROVIDER_KEY=       # Obter em https://meu-provider.com/api-keys
```

4. **Documentar em `06_AI_MANIFEST.md`** (tabela de providers Vision)

5. **Testar** com 3 imagens diferentes (simples, complexa, screenshot real)

---

## Playbook 4: Como Adicionar Novo Tipo de Seção

1. **Adicionar em `section-detector.ts`:**

```typescript
// Adicionar ao mapa de tipos
const SECTION_TYPES: Record<string, string> = {
  ...
  'timeline': 'Timeline / Processo',    // ← novo tipo
}

// Adicionar arquivo de saída
const SECTION_OUTPUT_FILES: Record<string, string> = {
  ...
  'timeline': 'timeline.json',
}

// Adicionar heurística de detecção
function detectSectionType(node: LayoutNode): string {
  // ... lógica existente ...
  
  // Detectar timeline: lista ordenada numerada + datas
  const hasNumberedItems = node.children.some(c => /^\d+\./.test(c.textContent ?? ''))
  const hasDatePattern = /\d{4}/.test(node.textContent ?? '')
  if (hasNumberedItems && hasDatePattern) return 'timeline'
  
  return 'unknown'
}
```

2. **Testar detecção** com HTML que contém a nova seção

3. **Documentar em `10_EXPORT_MANAGER.md`** (tabela de arquivos de saída)

4. **Documentar em `02_PRODUCT_MANIFEST.md`** (lista de seções suportadas)
