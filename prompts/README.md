# WebKeeper Elementor Exporter

> Converta HTML, ZIP e imagens em templates JSON prontos para importar no Elementor/WordPress.

![Version](https://img.shields.io/badge/version-1.0.0-purple)
![License](https://img.shields.io/badge/license-MIT-green)
![Elementor](https://img.shields.io/badge/Elementor-JSON%200.4-red)
![WordPress](https://img.shields.io/badge/WordPress-6%2B-blue)

---

## O que é

Ferramenta web que detecta automaticamente seções de um layout HTML (header, hero, serviços, FAQ, footer) e gera arquivos `.json` compatíveis com a importação nativa do Elementor Free e Pro.

---

## Funcionalidades

- Importar HTML (texto, arquivo ou drag-drop)
- Importar ZIP (com múltiplos HTMLs e imagens)
- Detectar seções automaticamente
- Configurar tokens dinâmicos (WhatsApp, e-mail, redes sociais)
- Exportar página completa (`page.json`)
- Exportar seções individuais (`header.json`, `hero.json`, `faq.json`...)
- Preview visual do HTML original
- Validação do JSON antes de exportar

---

## Instalação local

```bash
git clone https://github.com/seu-usuario/wk-elementor-exporter.git
cd wk-elementor-exporter
npm install
npm run dev
# Acesse: http://localhost:5173
```

---

## Build para produção

```bash
npm run build
# Saída em: dist/
```

---

## Deploy na Hostinger

### Automático (GitHub Actions)
1. Configure os secrets no GitHub (Settings → Secrets and variables → Actions):
   - `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_PORT`, `FTP_REMOTE_DIR`
2. Faça push para a branch `main`
3. O build e deploy ocorrem automaticamente
4. Acesse: `https://seudominio.com.br/elementor-exporter/`

### Manual (FTP)
1. Rode `npm run build`
2. Envie o conteúdo de `dist/` para `/public_html/elementor-exporter/` via FileZilla ou hPanel

---

## Como importar o JSON no Elementor

### Método 1 — Via Template Library
1. WordPress → Elementor → Templates → Saved Templates
2. Clique em "Import Templates"
3. Selecione o `.json` gerado
4. Clique em "Import Now"
5. Use o template via ícone de pasta no editor

### Método 2 — Via Editor
1. Abra o editor Elementor em qualquer página
2. Ícone de pasta → My Templates → Import
3. Selecione o `.json`

### Importando múltiplos templates (ZIP)
1. Elementor → Tools → Import / Export Kit
2. Selecione o `.zip` gerado
3. Escolha quais templates importar

---

## Compatibilidade

- WordPress 6+
- Elementor Free 3.0+
- Elementor Pro (para widgets Pro: Form, Slider, etc.)
- Todos os temas compatíveis com Elementor

---

## Estrutura do projeto

```
wk-elementor-exporter/
├── .github/workflows/deploy.yml   ← CI/CD GitHub → Hostinger
├── src/
│   ├── components/                ← UI React
│   ├── services/                  ← lógica de conversão
│   ├── hooks/                     ← hooks reutilizáveis
│   ├── utils/                     ← funções puras
│   └── types/                     ← interfaces TypeScript
├── .env.example
├── .gitignore
├── CHANGELOG.md
├── ARCHITECTURE.md                ← fluxo técnico detalhado
├── DEVELOPMENT_RULES.md           ← padrões de código
├── PROMPT.md                      ← instruções para IA
├── VISION.md                      ← roadmap estratégico
└── README.md
```

> Consulte ARCHITECTURE.md para entender o fluxo interno de conversão.
> Consulte DEVELOPMENT_RULES.md antes de qualquer alteração de código.

---

## Licença

MIT © WebKeeper
