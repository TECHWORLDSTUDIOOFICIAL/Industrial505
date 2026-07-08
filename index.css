/* ==========================================================================
   Nexova — Design tokens
   ========================================================================== */
:root{
  --navy-900:#0B1D3A;
  --navy-800:#142A52;
  --blue-600:#2F5FE0;
  --blue-500:#3E74F2;
  --cyan-400:#17C3B2;
  --gray-50:#F6F8FB;
  --gray-100:#EDF1F7;
  --gray-300:#D7DEEA;
  --gray-400:#8593AC;
  --slate-900:#101828;
  --white:#FFFFFF;

  --font-display:'Sora', sans-serif;
  --font-body:'Inter', sans-serif;
  --font-mono:'IBM Plex Mono', monospace;

  --radius-sm:10px;
  --radius-md:16px;
  --radius-lg:24px;
  --shadow-sm:0 2px 8px rgba(16,24,40,.06);
  --shadow-md:0 12px 32px rgba(16,24,40,.08);
  --shadow-lg:0 24px 60px rgba(11,29,58,.16);
  --container:1180px;
  --header-h:76px;
}

*,*::before,*::after{box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{
  margin:0;
  font-family:var(--font-body);
  color:var(--slate-900);
  background:var(--white);
  -webkit-font-smoothing:antialiased;
}
h1,h2,h3{font-family:var(--font-display);color:var(--navy-900);line-height:1.15;margin:0;}
p{color:var(--gray-400);line-height:1.6;margin:0;}
a{text-decoration:none;color:inherit;}
ul{margin:0;padding:0;list-style:none;}
img,svg{display:block;max-width:100%;}
.container{max-width:var(--container);margin:0 auto;padding:0 24px;}

@media (prefers-reduced-motion: reduce){
  *{animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important;}
}

/* ==========================================================================
   Buttons
   ========================================================================== */
.btn{
  display:inline-flex;align-items:center;justify-content:center;
  padding:11px 22px;border-radius:999px;font-weight:600;font-size:14.5px;
  border:1px solid transparent;cursor:pointer;transition:transform .15s ease, box-shadow .15s ease, background .15s ease;
  white-space:nowrap;
}
.btn:focus-visible{outline:2px solid var(--cyan-400);outline-offset:2px;}
.btn--primary{background:var(--blue-600);color:var(--white);box-shadow:var(--shadow-sm);}
.btn--primary:hover{background:var(--blue-500);transform:translateY(-1px);box-shadow:var(--shadow-md);}
.btn--ghost{background:transparent;color:var(--navy-900);border-color:var(--gray-300);}
.btn--ghost:hover{background:var(--gray-50);}
.btn--outline{background:transparent;color:var(--blue-600);border-color:var(--blue-600);}
.btn--outline:hover{background:var(--blue-600);color:var(--white);}
.btn--lg{padding:14px 28px;font-size:15.5px;}

/* ==========================================================================
   Header
   ========================================================================== */
.header{
  position:fixed;top:0;left:0;right:0;z-index:100;
  height:var(--header-h);
  background:rgba(255,255,255,.85);
  backdrop-filter:blur(10px);
  border-bottom:1px solid var(--gray-100);
}
.header__inner{
  height:100%;display:flex;align-items:center;justify-content:space-between;gap:24px;
}
.brand{display:flex;align-items:center;gap:10px;}
.brand__name{font-family:var(--font-display);font-weight:700;font-size:19px;color:var(--navy-900);}
.nav{display:flex;gap:28px;}
.nav__link{font-size:14.5px;font-weight:500;color:var(--navy-900);opacity:.75;transition:opacity .15s;}
.nav__link:hover{opacity:1;}
.header__actions{display:flex;align-items:center;gap:12px;}

.menu-toggle{
  display:none;width:36px;height:36px;border:none;background:none;cursor:pointer;
  flex-direction:column;justify-content:center;gap:5px;padding:0;
}
.menu-toggle span{display:block;height:2px;background:var(--navy-900);border-radius:2px;}

.mobile-nav{
  display:none;flex-direction:column;gap:4px;padding:12px 24px 20px;
  background:var(--white);border-top:1px solid var(--gray-100);
}
.mobile-nav.is-open{display:flex;}
.mobile-nav .nav__link{padding:10px 0;border-bottom:1px solid var(--gray-100);}
.mobile-nav .btn{margin-top:10px;}

@media (max-width:900px){
  .nav{display:none;}
  .header__actions .btn--ghost{display:none;}
  .menu-toggle{display:flex;}
}
@media (max-width:520px){
  .header__actions .btn--primary{display:none;}
}

/* ==========================================================================
   Hero
   ========================================================================== */
.hero{padding:calc(var(--header-h) + 72px) 0 90px;background:
  radial-gradient(1000px 500px at 85% -10%, rgba(47,95,224,.08), transparent 60%),
  var(--white);
}
.hero__inner{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center;}
.eyebrow{
  display:inline-block;font-size:13px;font-weight:600;letter-spacing:.02em;
  color:var(--blue-600);background:rgba(47,95,224,.08);
  padding:6px 14px;border-radius:999px;margin-bottom:18px;
}
.hero__title{font-size:clamp(32px,4vw,50px);font-weight:800;letter-spacing:-.01em;margin-bottom:20px;}
.hero__desc{font-size:17px;max-width:480px;margin-bottom:32px;}
.hero__actions{display:flex;gap:14px;margin-bottom:28px;flex-wrap:wrap;}
.hero__trust{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--gray-400);}
.hero__trust .dot{width:4px;height:4px;border-radius:50%;background:var(--gray-300);}

.panel-svg{width:100%;height:auto;}
.panel-bg{fill:var(--gray-50);stroke:var(--gray-100);}
.dot-red{fill:#F87171;}.dot-yellow{fill:#FBBF24;}.dot-green{fill:#34D399;}
.card-float{fill:var(--white);stroke:var(--gray-100);filter:drop-shadow(0 6px 14px rgba(16,24,40,.06));}
.card-chart{fill:var(--navy-900);}
.card-label{font-family:var(--font-body);font-size:11px;fill:var(--gray-400);}
.card-num{font-family:var(--font-mono);font-size:18px;font-weight:600;fill:var(--navy-900);}
.pulse-dot{fill:var(--cyan-400);}
.bar{fill:var(--blue-500);}
.bar-5, .bar-9{fill:var(--cyan-400);}

.card-1{animation:float 5s ease-in-out infinite;}
.card-2{animation:float 5s ease-in-out infinite .4s;}
.card-3{animation:float 5s ease-in-out infinite .8s;}
@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
.pulse-dot{animation:pulse 1.8s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.35;}}
.bar{transform-origin:bottom;animation:rise .9s ease-out both;}
.bar-2{animation-delay:.05s;}.bar-3{animation-delay:.1s;}.bar-4{animation-delay:.15s;}
.bar-5{animation-delay:.2s;}.bar-6{animation-delay:.25s;}.bar-7{animation-delay:.3s;}
.bar-8{animation-delay:.35s;}.bar-9{animation-delay:.4s;}
@keyframes rise{from{transform:scaleY(0);}to{transform:scaleY(1);}}

@media (max-width:900px){
  .hero__inner{grid-template-columns:1fr;}
  .hero__visual{order:-1;}
}

/* ==========================================================================
   Sections
   ========================================================================== */
.section{padding:96px 0;}
.section--tint{background:var(--gray-50);}
.section--dark{background:var(--navy-900);}
.section__head{max-width:620px;margin-bottom:52px;}
.section__head h2{font-size:clamp(24px,3vw,34px);margin-top:10px;}

.grid{display:grid;gap:24px;}
.grid--3{grid-template-columns:repeat(3,1fr);}
.grid--4{grid-template-columns:repeat(4,1fr);}
@media (max-width:900px){.grid--3{grid-template-columns:1fr 1fr;} .grid--4{grid-template-columns:1fr 1fr;}}
@media (max-width:560px){.grid--3{grid-template-columns:1fr;} .grid--4{grid-template-columns:1fr 1fr;}}

/* Beneficios */
.card-b{
  background:var(--white);border:1px solid var(--gray-100);border-radius:var(--radius-md);
  padding:28px;transition:transform .2s ease, box-shadow .2s ease;
}
.card-b:hover{transform:translateY(-4px);box-shadow:var(--shadow-md);}
.icon-box{
  width:44px;height:44px;border-radius:12px;background:rgba(47,95,224,.08);
  display:flex;align-items:center;justify-content:center;margin-bottom:16px;
}
.icon-box svg{width:22px;height:22px;fill:none;stroke:var(--blue-600);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
.card-b h3{font-size:17px;margin-bottom:8px;}
.card-b p{font-size:14.5px;}

/* Caracteristicas */
.card-f{
  background:var(--white);border-radius:var(--radius-md);padding:28px;
  box-shadow:var(--shadow-sm);transition:box-shadow .2s ease, transform .2s ease;
  border-top:3px solid var(--blue-600);
}
.card-f:hover{box-shadow:var(--shadow-md);transform:translateY(-3px);}
.card-f h3{font-size:17px;margin-bottom:8px;}
.card-f p{font-size:14.5px;}

/* Por que elegirnos */
.why__inner{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start;}
.why__text p{margin-top:14px;font-size:15.5px;max-width:420px;}
.why__list li{
  padding:18px 0;border-bottom:1px solid var(--gray-100);font-size:15px;color:var(--gray-400);
}
.why__list li:first-child{padding-top:0;}
.why__list strong{color:var(--navy-900);display:block;font-family:var(--font-display);margin-bottom:4px;font-size:15.5px;}
@media (max-width:800px){.why__inner{grid-template-columns:1fr;}}

/* Estadisticas */
.stats{text-align:center;}
.stat__num{
  display:block;font-family:var(--font-mono);font-size:clamp(28px,4vw,42px);font-weight:600;
  color:var(--white);
}
.stat__label{display:block;margin-top:8px;font-size:13.5px;color:rgba(255,255,255,.55);}

/* Planes */
.plan{
  background:var(--white);border:1px solid var(--gray-100);border-radius:var(--radius-lg);
  padding:32px;display:flex;flex-direction:column;gap:18px;position:relative;
}
.plan--featured{border-color:var(--blue-600);box-shadow:var(--shadow-lg);}
.plan__badge{
  position:absolute;top:-13px;left:32px;background:var(--blue-600);color:var(--white);
  font-size:12px;font-weight:600;padding:4px 12px;border-radius:999px;
}
.plan h3{font-size:18px;}
.plan__price{font-family:var(--font-mono);font-size:32px;font-weight:600;color:var(--navy-900);}
.plan__price span{font-family:var(--font-body);font-size:14px;font-weight:400;color:var(--gray-400);}
.plan__list li{font-size:14.5px;color:var(--gray-400);padding:7px 0;border-bottom:1px solid var(--gray-100);}
.plan__list li:last-child{border-bottom:none;}
.plan .btn{margin-top:6px;}

/* Testimonios */
.testimonial{
  background:var(--white);border-radius:var(--radius-md);padding:28px;box-shadow:var(--shadow-sm);
}
.testimonial p{color:var(--slate-900);font-size:15px;margin-bottom:20px;}
.testimonial__author strong{display:block;font-size:14.5px;color:var(--navy-900);}
.testimonial__author span{font-size:13px;color:var(--gray-400);}

/* ==========================================================================
   Footer
   ========================================================================== */
.footer{background:var(--navy-900);color:var(--gray-300);padding:64px 0 0;}
.footer__inner{
  display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:40px;padding-bottom:48px;
  border-bottom:1px solid rgba(255,255,255,.08);
}
.footer__brand p{margin-top:10px;font-size:14px;color:var(--gray-400);max-width:240px;}
.footer .brand__name{color:var(--white);}
.footer__col h4{color:var(--white);font-size:14px;margin-bottom:16px;font-family:var(--font-display);}
.footer__col a,.footer__col span{display:block;font-size:14px;color:var(--gray-400);padding:6px 0;}
.footer__col a:hover{color:var(--cyan-400);}
.footer__social{display:flex;gap:10px;}
.footer__social a{
  width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.06);
  display:flex;align-items:center;justify-content:center;font-size:12px;padding:0;
}
.footer__bottom{text-align:center;padding:22px 0;font-size:13px;color:var(--gray-400);}

@media (max-width:800px){
  .footer__inner{grid-template-columns:1fr 1fr;}
}
