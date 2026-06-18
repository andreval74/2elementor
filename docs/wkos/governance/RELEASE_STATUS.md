# governance/RELEASE_STATUS.md — Status da Release Atual
> Atualizar a cada release
> **Última atualização:** 2026-06-17

---

## Release Atual: v1.5.0

**Data de deploy:** 2026-06-17
**Canal:** Produção (Hostinger → web3cafe.com.br/2elementor)
**Build:** ✅ 0 erros TypeScript
**Testes:** ✅ 70/70 passando

---

## Novidades desta Release

- WKOS: 26 docs de referência + 6 governance files em `/docs/wkos/`
- Score técnico documentado por dimensão (75/100 geral)
- Backlog executivo completo (CRITICAL/HIGH/MEDIUM/LOW)
- SPEC-001: Smart Export Manager (especificação aprovada)
- 20_CHANGELOG.md com histórico retroativo de v1.0.0 a v1.5.0

---

## Histórico de Releases

| Versão | Data | Principais Features |
|---|---|---|
| v1.5.0 | Jun 2026 | WKOS + governança |
| v1.4.0 | Jun 2026 | SectionPreview, refine por seção, deduplicação de seções |
| v1.3.0 | Jun 2026 | refineSection, sectionRefining, badge ×N |
| v1.2.0 | Jun 2026 | Quality Gate, Visual Validator |
| v1.1.0 | Jun 2026 | EDIT MODE, Snapshot Engine, Structural Validator |
| v1.0.0 | Jun 2026 | MVP inicial |

---

## Deploy Pipeline

```
git push origin main
  ↓
GitHub Actions (.github/workflows/deploy.yml)
  ↓
npm ci && npm run build
  ↓
FTP Upload dist/ → Hostinger public_html/2elementor/
  ↓
Cloudflare Worker (deploy separado via wrangler)
```

---

## Monitoramento

| Serviço | URL | Status |
|---|---|---|
| App Frontend | web3cafe.com.br/2elementor | ✅ Online |
| Cloudflare Worker | 2elementor.web3cafe.workers.dev | ✅ Online |
| GitHub Actions | github.com/AndreVal74/... | ✅ Configurado |

---

## Próxima Release Planejada: v1.6.0

**Previsão:** Sprint 2 (Sprint 2A + fixes prioritários)
**Conteúdo planejado:**
- [ ] Score de qualidade visível na UI
- [ ] Correção do CHANGELOG raiz
- [ ] Multi-pass por seção (DCGen) — Sprint 2A
- [ ] Testes para Visual Validator e Quality Gate
