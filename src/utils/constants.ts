// ─── CONSTANTES GLOBAIS ───────────────────────────────────────────────────────
// [REUSE]: importar daqui em todos os módulos que precisem dessas constantes

export const ELEMENTOR_VERSION = '0.4' as const

export const MAX_HISTORY = 5

export const MAX_FILE_SIZE_MB = 10

export const SECTION_LABELS: Record<string, string> = {
  header: 'Cabeçalho / Nav',
  hero: 'Hero Section',
  about: 'Sobre / Bio',
  services: 'Serviços / Soluções',
  cases: 'Cases / Portfólio',
  faq: 'FAQ / Perguntas',
  cta: 'Call to Action',
  footer: 'Rodapé',
}

export const SECTION_OUTPUT_FILES: Record<string, string> = {
  header: 'header.json',
  hero: 'hero.json',
  about: 'about.json',
  services: 'services.json',
  cases: 'cases.json',
  faq: 'faq.json',
  cta: 'cta.json',
  footer: 'footer.json',
}

// CSS global injetado via page_settings.custom_css — carregado no <head> do WordPress
// SEM @import: Elementor injeta custom_css dentro de <style> no body onde @import não funciona
// A fonte Inter já é carregada via <link> no WEBKEEPER_FIRST_WIDGET_SETUP
export const ELEMENTOR_PAGE_CSS = `*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:'Inter',sans-serif!important;background-color:#000000;color:#ffffff}
/* ── Brand colors (fallback quando Tailwind não carrega) ── */
.bg-brand-gold,.bg-brand-gold *{background-color:#EAB308}
.bg-brand-card{background-color:#121212}
.bg-brand-dark{background-color:#0A0A0A}
.text-brand-gold{color:#EAB308}
.border-brand-gold{border-color:#EAB308}
/* ── WebKeeper helpers ── */
.glow-gold{box-shadow:0 0 20px rgba(234,179,8,.4),0 0 40px rgba(234,179,8,.2)}
.text-gold{color:#EAB308}
.bg-gold{background-color:#EAB308}
.btn-gold{background:linear-gradient(135deg,#EAB308,#CA8A04);color:#000;font-weight:600;transition:all .3s}
.btn-gold:hover{background:linear-gradient(135deg,#FCD34D,#EAB308)}
/* ── Tailwind opacity helpers usados no design ── */
.bg-black\/80{background-color:rgba(0,0,0,.8)}
.bg-white\/5{background-color:rgba(255,255,255,.05)}
.bg-white\/10{background-color:rgba(255,255,255,.10)}
.border-white\/5{border-color:rgba(255,255,255,.05)}
.border-white\/10{border-color:rgba(255,255,255,.10)}
.border-white\/20{border-color:rgba(255,255,255,.20)}
.bg-brand-gold\/10{background-color:rgba(234,179,8,.10)}
.bg-brand-gold\/20{background-color:rgba(234,179,8,.20)}
.border-brand-gold\/20{border-color:rgba(234,179,8,.20)}
.border-brand-gold\/30{border-color:rgba(234,179,8,.30)}
.text-gray-400{color:#9CA3AF}
.text-gray-500{color:#6B7280}
.max-container{max-width:80rem;margin-left:auto;margin-right:auto}
`

// Bloco injetado APENAS no primeiro widget — carrega Tailwind CDN + config completo
// Tailwind Play CDN usa MutationObserver: processa classes de TODOS os widgets da página
export const WEBKEEPER_FIRST_WIDGET_SETUP = `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script>
(function(){
  var t=setInterval(function(){
    if(typeof tailwind!=='undefined'){
      tailwind.config={
        theme:{extend:{colors:{brand:{gold:'#EAB308',dark:'#0A0A0A',card:'#121212'}}}}
      };
      clearInterval(t);
    }
  },50);
})();
</script>
<style>
  .glow-gold{box-shadow:0 0 20px rgba(234,179,8,.4),0 0 40px rgba(234,179,8,.2)}
  .text-gold{color:#EAB308}
  .bg-gold{background-color:#EAB308}
  .btn-gold{background:linear-gradient(135deg,#EAB308,#CA8A04);color:#000;font-weight:600;transition:all .3s}
  .btn-gold:hover{background:linear-gradient(135deg,#FCD34D,#EAB308)}
  .max-container{max-width:80rem}
</style>`

// Bloco injetado nos widgets subsequentes — Tailwind já está na página
export const WEBKEEPER_STYLES = `<style>
  .glow-gold{box-shadow:0 0 20px rgba(234,179,8,.4),0 0 40px rgba(234,179,8,.2)}
  .text-gold{color:#EAB308}
  .bg-gold{background-color:#EAB308}
  .btn-gold{background:linear-gradient(135deg,#EAB308,#CA8A04);color:#000;font-weight:600;transition:all .3s}
  .btn-gold:hover{background:linear-gradient(135deg,#FCD34D,#EAB308)}
  .max-container{max-width:80rem}
</style>`
