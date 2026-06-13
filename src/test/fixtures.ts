// ─── TEST FIXTURES ────────────────────────────────────────────────────────────
// 10 amostras HTML cobrindo todos os tipos de seção + edge cases

export const FX_HEADER = `
<header class="navbar bg-brand-dark border-b border-white/10">
  <nav class="max-container flex items-center justify-between px-6 py-4">
    <a href="#" class="text-gold font-bold text-xl">WebKeeper</a>
    <svg width="32" height="32" viewBox="0 0 32 32" class="text-gold">
      <path d="M16 2L2 28h28L16 2z" fill="currentColor"/>
    </svg>
    <ul class="flex gap-6">
      <li><a href="#servicos" class="text-white hover:text-gold transition">Serviços</a></li>
      <li><a href="#cases" class="text-white hover:text-gold transition">Cases</a></li>
      <li><a href="#contato" class="text-white hover:text-gold transition">Contato</a></li>
    </ul>
    <a href="#cta" class="btn-gold px-4 py-2 rounded-lg">Fale Conosco</a>
  </nav>
</header>`

export const FX_HERO = `
<section class="hero bg-black min-h-screen flex items-center">
  <div class="max-container px-6">
    <h1 class="text-5xl font-bold text-white">TECNOLOGIA SOB MEDIDA.<br/><span class="text-gold">RESULTADOS REAIS.</span></h1>
    <p class="text-gray-400 text-xl mt-6">Transformamos sua presença digital com estratégia e precisão.</p>
    <div class="flex gap-4 mt-8">
      <a href="{{WHATSAPP_LINK}}" class="btn-gold px-8 py-4 rounded-xl text-lg font-bold">Agendar Diagnóstico</a>
      <a href="#cases" class="border border-white/20 text-white px-8 py-4 rounded-xl text-lg">Ver Cases</a>
    </div>
  </div>
</section>`

export const FX_SERVICES = `
<section class="services bg-brand-dark py-24">
  <div class="max-container px-6">
    <h2 class="text-3xl font-bold text-white mb-12">Nossas <span class="text-gold">Soluções</span></h2>
    <div class="grid grid-cols-3 gap-6">
      <div class="bg-brand-card border border-white/10 rounded-xl p-6 hover:border-gold transition glow-gold">
        <svg width="40" height="40" class="text-gold mb-4"><circle cx="20" cy="20" r="18" stroke="currentColor" fill="none"/></svg>
        <h3 class="text-white font-bold text-xl">Landing Pages</h3>
        <p class="text-gray-400 mt-2">Páginas de alta conversão com design premium.</p>
      </div>
      <div class="bg-brand-card border border-white/10 rounded-xl p-6 hover:border-gold transition">
        <h3 class="text-white font-bold text-xl">E-commerce</h3>
        <p class="text-gray-400 mt-2">Lojas virtuais que vendem enquanto você dorme.</p>
      </div>
      <div class="bg-brand-card border border-white/10 rounded-xl p-6 hover:border-gold transition">
        <h3 class="text-white font-bold text-xl">Automação</h3>
        <p class="text-gray-400 mt-2">Sistemas que economizam horas do seu time.</p>
      </div>
    </div>
  </div>
</section>`

export const FX_CASES = `
<section class="cases portfolio bg-black py-24">
  <div class="max-container px-6">
    <h2 class="text-3xl font-bold text-white mb-12">Cases de <span class="text-gold">Sucesso</span></h2>
    <div class="grid grid-cols-2 gap-8">
      <div class="rounded-xl overflow-hidden border border-white/10">
        <img src="/case-1.jpg" alt="Case TechCorp" class="w-full h-48 object-cover"/>
        <div class="p-6 bg-brand-card">
          <h3 class="text-white font-bold">TechCorp — +240% em Leads</h3>
          <a href="#" class="text-gold text-sm mt-2 inline-block">Ver projeto →</a>
        </div>
      </div>
      <div class="rounded-xl overflow-hidden border border-white/10">
        <img src="/case-2.jpg" alt="Case StartupXYZ" class="w-full h-48 object-cover"/>
        <div class="p-6 bg-brand-card">
          <h3 class="text-white font-bold">StartupXYZ — R$1M em 6 meses</h3>
          <a href="#" class="text-gold text-sm mt-2 inline-block">Ver projeto →</a>
        </div>
      </div>
    </div>
  </div>
</section>`

export const FX_FAQ = `
<section class="faq bg-brand-dark py-24">
  <div class="max-container px-6">
    <h2 class="text-3xl font-bold text-white mb-12">Perguntas <span class="text-gold">Frequentes</span></h2>
    <div class="space-y-4">
      <details class="bg-brand-card border border-white/10 rounded-xl p-6">
        <summary class="text-white font-semibold cursor-pointer">Qual o prazo de entrega?</summary>
        <p class="text-gray-400 mt-4">Projetos padrão são entregues em 7 a 14 dias úteis.</p>
      </details>
      <details class="bg-brand-card border border-white/10 rounded-xl p-6">
        <summary class="text-white font-semibold cursor-pointer">Vocês fazem manutenção?</summary>
        <p class="text-gray-400 mt-4">Sim, oferecemos planos mensais de manutenção e suporte.</p>
      </details>
    </div>
  </div>
</section>`

export const FX_CTA = `
<section class="cta contact bg-brand-dark border-t border-gold/20 py-24">
  <div class="max-container px-6 text-center">
    <h2 class="text-4xl font-bold text-white">Pronto para <span class="text-gold">Transformar</span> seu negócio?</h2>
    <p class="text-gray-400 text-xl mt-4">Entre em contato agora e agende seu diagnóstico gratuito.</p>
    <div class="flex justify-center gap-4 mt-10">
      <a href="{{WHATSAPP_LINK}}" class="btn-gold px-10 py-5 rounded-xl text-xl font-bold glow-gold">
        Fale no WhatsApp
      </a>
      <a href="mailto:{{EMAIL_CONTATO}}" class="border border-white/20 text-white px-10 py-5 rounded-xl text-xl">
        {{EMAIL_CONTATO}}
      </a>
    </div>
  </div>
</section>`

export const FX_ABOUT = `
<section class="about sobre bg-black py-24">
  <div class="max-container px-6 flex gap-12 items-center">
    <img src="/andre.jpg" alt="André Val" class="w-64 h-64 rounded-full object-cover border-4 border-gold"/>
    <div>
      <h2 class="text-3xl font-bold text-white">Quem Somos</h2>
      <p class="text-gray-400 text-lg mt-4">
        {{NOME_EMPRESA}} é uma agência especializada em desenvolvimento web premium para empresas que querem resultados reais.
      </p>
      <p class="text-gray-400 mt-2">Nossa história começou em 2018 com um único objetivo: entregar mais do que era esperado.</p>
    </div>
  </div>
</section>`

export const FX_FOOTER = `
<footer class="rodapé footer bg-brand-dark border-t border-white/10 py-12">
  <div class="max-container px-6 flex justify-between items-center">
    <span class="text-gold font-bold text-xl">{{NOME_EMPRESA}}</span>
    <nav class="flex gap-6">
      <a href="{{INSTAGRAM_URL}}" class="text-gray-400 hover:text-gold">Instagram</a>
      <a href="{{LINKEDIN_URL}}" class="text-gray-400 hover:text-gold">LinkedIn</a>
    </nav>
    <p class="text-gray-500 text-sm">© 2025 {{NOME_EMPRESA}}. Todos os direitos reservados.</p>
  </div>
</footer>`

// Edge case: atributo com aspas duplas dentro do valor
export const FX_EDGE_QUOTES = `
<div class="card" data-label="Ele disse &quot;olá&quot;" data-value="A &amp; B" title="100%">
  <h3 class="title">Card com atributos especiais</h3>
  <p data-complex="url(&#39;img.png&#39;)">Conteúdo</p>
</div>`

// Edge case: script + style + SVG inline + canvas (efeitos que não convertem para widgets nativos)
export const FX_EDGE_EFFECTS = `
<section class="hero-animated bg-black min-h-screen relative overflow-hidden">
  <style>
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(40px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .animate-fade { animation: fadeInUp 0.8s ease forwards; }
    .shimmer { background: linear-gradient(90deg, transparent, rgba(234,179,8,.3), transparent); }
  </style>
  <svg class="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#EAB308" stroke-width="0.5"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)"/>
  </svg>
  <canvas id="particles" class="absolute inset-0 w-full h-full"></canvas>
  <div class="relative z-10 max-container px-6 py-24 animate-fade">
    <h1 class="text-6xl font-bold text-white">Efeitos Preservados</h1>
  </div>
  <script>
    (function() {
      var canvas = document.getElementById('particles');
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.fillStyle = 'rgba(234,179,8,0.5)';
      ctx.fillRect(10, 10, 5, 5);
    })();
  </script>
</section>`

// Página completa (hero + services + cta simplificado) para testes end-to-end
export const FX_FULL_PAGE = `
<header class="navbar bg-brand-dark">
  <nav class="flex justify-between px-6 py-4">
    <span class="text-gold font-bold">WebKeeper</span>
    <ul class="flex gap-4">
      <li><a href="#" class="text-white">Início</a></li>
    </ul>
  </nav>
</header>
<section class="hero bg-black py-24">
  <h1 class="text-white text-5xl font-bold">TECNOLOGIA SOB MEDIDA.<br/><span class="text-gold">RESULTADOS.</span></h1>
  <a href="{{WHATSAPP_LINK}}" class="btn-gold mt-8 px-8 py-4 rounded-xl">Agendar</a>
</section>
<section class="services bg-brand-dark py-16">
  <h2 class="text-white text-3xl font-bold mb-8">Nossas Soluções</h2>
  <div class="grid grid-cols-3 gap-4">
    <div class="bg-brand-card p-4 rounded-xl"><h3 class="text-white">Serviço 1</h3></div>
    <div class="bg-brand-card p-4 rounded-xl"><h3 class="text-white">Serviço 2</h3></div>
    <div class="bg-brand-card p-4 rounded-xl"><h3 class="text-white">Serviço 3</h3></div>
  </div>
</section>
<footer class="footer bg-brand-dark border-t border-white/10 py-8">
  <div class="flex justify-between px-6">
    <span class="text-gold">{{NOME_EMPRESA}}</span>
    <p class="text-gray-500">© 2025 todos os direitos reservados.</p>
  </div>
</footer>`
