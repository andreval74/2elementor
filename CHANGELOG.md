# Changelog — WebKeeper Elementor Exporter

## [1.0.0] - 2026-06-11

### Added
- MVP completo: conversor HTML/ZIP/Imagem → JSON Elementor v0.4
- Interface dark mode premium 3 colunas (Upload | Análise | Output)
- Pipeline de 8 etapas: parse → detect → tokens → map → export → validate
- Detecção automática de seções: header, hero, services, cases, faq, cta, footer
- Tokens dinâmicos: WhatsApp, e-mail, redes sociais, empresa
- Syntax highlight do JSON (roxo/verde/laranja/azul)
- Download individual por seção e ZIP com todas as seções
- Preview visual com iframe sandboxado
- Histórico das últimas 5 conversões (localStorage)
- Atalhos de teclado: Ctrl+Enter, Ctrl+S, Ctrl+Z
- Dashboard de configuração de tokens em modal
- Deploy automático via GitHub Actions → FTP Hostinger
