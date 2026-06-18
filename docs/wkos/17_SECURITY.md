# 17_SECURITY.md — Segurança
> Status: **Estável** | Audiência: Dev + Infra

---

## Variáveis de Ambiente

### Frontend (`.env` / `.env.local`)

```env
# Chaves de API para Vision AI (frontend)
VITE_GEMINI_KEY=                  # Google AI Studio — não expor no código
VITE_OPENROUTER_KEY=              # openrouter.ai
VITE_GROQ_KEY=                    # console.groq.com

# URL do Cloudflare Worker (proxy)
VITE_PROXY_URL=https://2elementor.web3cafe.workers.dev
```

**Importante:** Variáveis `VITE_*` ficam no bundle JavaScript e são visíveis no browser. Não usar para segredos de alta sensibilidade.

### Worker (Cloudflare — variáveis de ambiente do Worker)

```env
GEMINI_KEY=                       # Nunca exposto ao frontend
GROQ_KEY=
OPENROUTER_KEY=
ALLOWED_ORIGIN=https://seudominio.com.br
```

**Proteção:** As chaves do Worker ficam no servidor Cloudflare — nunca expostas ao cliente.

---

## CORS no Worker

```javascript
// cloudflare-worker/index.js
const ALLOWED_ORIGIN = env.ALLOWED_ORIGIN

if (origin !== ALLOWED_ORIGIN) {
  return new Response('Forbidden', { status: 403 })
}
```

- Apenas o domínio configurado em `ALLOWED_ORIGIN` pode chamar o Worker
- Em desenvolvimento: configurar `ALLOWED_ORIGIN=http://localhost:5173`
- Em produção: configurar para o domínio da Hostinger

---

## Sandbox do iframe (SectionPreview)

```html
<iframe sandbox="allow-same-origin allow-scripts" srcdoc="...">
```

**Permissões concedidas:**
- `allow-scripts` — obrigatório para Tailwind CDN executar e injetar estilos
- `allow-same-origin` — obrigatório para scripts dentro do iframe acessar o DOM do srcdoc

**Permissões negadas** (por não estarem na lista):
- `allow-forms` — formulários no preview não podem ser enviados ✅
- `allow-popups` — links no preview não abrem novas janelas ✅
- `allow-top-navigation` — preview não pode redirecionar a página principal ✅
- `allow-downloads` — preview não pode iniciar downloads ✅

**Risco documentado:** O `allow-scripts` permite que scripts dentro do iframe executem. O HTML renderizado vem do próprio processamento do sistema (HTML do usuário → transformação → srcdoc). Se o HTML original do usuário contiver código malicioso e passar pelo parser sem sanitização, ele executará no contexto do iframe.

**Mitigação atual:** O `html-parser.ts` usa `DOMParser` que não executa scripts durante parse. O HTML do `srcdoc` é construído a partir de `section.nodes.map(n => n.rawHtml)` — o rawHtml é extraído do DOM parseado (sem scripts).

**Mitigação ideal (futura):** Sanitizar `rawHtml` com DOMPurify antes de injetar no srcdoc.

---

## Validação de Entrada de Usuário

| Input | Validação | Onde |
|---|---|---|
| Tamanho de arquivo | ≤ 10 MB (MAX_FILE_SIZE_MB) | UploadPanel |
| Extensão de arquivo | lista de permitidos (.html, .htm, .zip, .png, .jpg, .webp, .gif) | UploadPanel |
| HTML | DOMParser (não executa JS) | html-parser.ts |
| JSON (re-import) | `JSON.parse` em try/catch | useConversion.ts |

---

## Dados Sensíveis em Tokens

O sistema suporta tokens dinâmicos que contêm dados do usuário:
- `{{WHATSAPP_LINK}}` — número de telefone
- `{{EMAIL_CONTATO}}` — endereço de e-mail
- `{{INSTAGRAM_URL}}` / `{{LINKEDIN_URL}}` / `{{FACEBOOK_URL}}` — perfis sociais

**Regra:** Esses dados são usados **apenas** para substituição no HTML/JSON local. Nunca são enviados ao Worker ou a qualquer API externa.

**Exceção:** O HTML enviado ao Worker `/refine` pode conter os tokens **já substituídos** (após `resolveTokens()`). Isso é intencional — o Worker refina o JSON com os valores reais.

---

## Deploy e Repositório

```gitignore
# .gitignore obrigatório
.env
.env.local
.env.*.local
```

- Nunca commitar `.env` — verificar com `git status` antes de qualquer commit
- `.env.example` deve estar no repositório com todas as variáveis mas **sem valores**
- GitHub Secrets para CI/CD: nunca expor em logs ou outputs

---

## Auditoria de Dependências

```bash
npm audit                 # verificar vulnerabilidades
npm audit fix             # corrigir automaticamente
```

Rodar `npm audit` antes de qualquer release. Dependências críticas:
- `jszip` — processamento de arquivos ZIP do usuário
- `react` — renderização de HTML arbitrário (via dangerouslySetInnerHTML: evitar)
