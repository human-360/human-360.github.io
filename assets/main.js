/* HUMAN 360 · interações */

(() => {
  const doc = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- Texto dividido em palavras para o reveal ---------- */
  $$('[data-split]').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const wi = document.createElement('span');
            wi.className = 'wi';
            wi.style.setProperty('--i', i++);
            wi.textContent = part;
            w.append(wi);
            frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    el.style.setProperty('--n', i);
  });

  /* ---------- Reveal ao entrar no ecrã ---------- */
  const revealables = $$('[data-split], [data-reveal]');
  if (!('IntersectionObserver' in window) || reduced) {
    revealables.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px 8% 0px' });
    revealables.forEach(el => io.observe(el));
  }
  requestAnimationFrame(() => doc.classList.add('is-loaded'));

  /* ---------- Graus contam ao entrar (000° → 060° …) ---------- */
  const counters = [...$$('.eyebrow .deg'), ...$$('[data-count]')];
  const runCount = el => {
    const end = parseInt(el.textContent, 10);
    if (!end) return;
    const start = Math.max(0, end - (el.hasAttribute('data-count') ? end : 60));
    const t0 = performance.now(), dur = 1100;
    const tick = now => {
      const k = clamp((now - t0) / dur);
      const v = Math.round(start + (end - start) * (1 - Math.pow(1 - k, 3)));
      el.textContent = String(v).padStart(3, '0') + '°';
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window && !reduced) {
    const cio = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); }
    }), { threshold: 1 });
    counters.forEach(el => cio.observe(el));
  }

  /* ---------- Header ---------- */
  const header = $('.header');
  let lastY = window.scrollY;

  /* ---------- Menu móvel ---------- */
  const burger = $('.burger');
  const menu = $('#menu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', String(open));
    $('.burger__label').textContent = open ? 'Fechar' : 'Menu';
    menu.hidden = !open;
    menu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    header.classList.remove('is-hidden');
    if (open) $('a', menu).focus();
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); }
  });
  window.matchMedia('(min-width: 1080px)').addEventListener('change', e => { if (e.matches && !menu.hidden) setMenu(false); });

  /* ---------- Link ativo na navegação ---------- */
  const navLinks = $$('.nav a');
  if ('IntersectionObserver' in window) {
    const navIo = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        navLinks.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(s => navIo.observe(s));
  }

  /* ---------- Soluções: lista que abre com fundo verde ---------- */
  const sol = $('.sol');
  if (sol) {
    const rows = $$('.sol__item', sol);
    const setOpen = row => {
      rows.forEach(r => {
        const on = r === row;
        r.classList.toggle('is-open', on);
        $('.sol__btn', r).setAttribute('aria-expanded', String(on));
      });
      sol.classList.toggle('has-open', !!row);
    };
    rows.forEach(r => $('.sol__btn', r).addEventListener('click', () => setOpen(r.classList.contains('is-open') ? null : r)));

    if ('IntersectionObserver' in window && !reduced) {
      const sio = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) { sol.classList.add('is-in'); sio.disconnect(); }
      }, { threshold: .15 });
      sio.observe(sol);
    } else sol.classList.add('is-in');
  }

  /* ---------- Efeitos de scroll ---------- */
  const orbitFill = $('.orbit__fill');
  const orbitDeg = $('.orbit__deg');
  const orbit = $('.orbit');
  const footer = $('.footer');
  const philo = $('#filosofia');
  const parallax = $$('.bento__photo, .pull');
  const titles = $$('[data-split]');
  const bands = $$('.marquee').map(el => ({ el, track: $('.marquee__track', el), dir: +el.dataset.dir || 1, w: 0 }));
  const stepsEl = $('.steps');
  const steps = $$('.step');
  const nodes = $$('.cycle__node');
  const cycleSvg = $('.cycle svg');
  const cycle = $('.cycle');
  const cNum = $('.cycle__num');
  const cName = $('.cycle__name');
  let active = -1;

  // Valores já escritos: só tocamos no DOM quando algo muda (evita trabalho por frame)
  const last = {};
  const put = (el, key, prop, val) => {
    if (last[key] === val) return;
    last[key] = val;
    el.style.setProperty(prop, val);
  };
  let maxScroll = 0;
  const measure = () => {
    maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    bands.forEach(b => { b.w = b.track.scrollWidth; });
  };
  measure();
  window.addEventListener('load', measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  const commit = $('.commit');

  const onScroll = () => {
    // 1) Leituras primeiro (todas juntas, um só cálculo de layout)
    const y = window.scrollY;
    const vh = window.innerHeight;
    const p = maxScroll > 0 ? clamp(y / maxScroll) : 0;
    const pr = philo.getBoundingClientRect();
    const fTop = footer.getBoundingClientRect().top;
    const px = reduced ? [] : parallax.map(el => el.getBoundingClientRect());
    const sr = stepsEl && !reduced ? stepsEl.getBoundingClientRect() : null;
    const cTop = sr && commit ? commit.getBoundingClientRect().top : 0;
    const tr = reduced ? [] : titles.map(el => el.getBoundingClientRect().top);
    const br = reduced ? [] : bands.map(b => b.el.getBoundingClientRect());

    // 2) Escritas depois
    // Indicador: a página completa 360°
    put(orbitFill, 'of', 'stroke-dashoffset', (100 - p * 100).toFixed(2));
    const deg = String(Math.round(p * 360)).padStart(3, '0') + '°';
    if (last.deg !== deg) { last.deg = deg; orbitDeg.textContent = deg; }
    orbit.classList.toggle('on-dark', pr.top < vh - 40 && pr.bottom > vh - 40);

    // Header fixo: fica sempre visível, só ganha fundo ao descer
    header.classList.toggle('is-scrolled', y > 24);
    lastY = y;

    if (reduced) return;

    // Parallax da fotografia do Sobre e rotação do anel do compromisso
    parallax.forEach((el, i) => {
      const r = px[i];
      if (r.bottom < -100 || r.top > vh + 100) return;
      const off = (r.top + r.height / 2 - vh / 2) / vh;
      put(el, 'py' + i, '--py', (off * -50).toFixed(0) + 'px');
      put(el, 'rot' + i, '--rot', (off * -90).toFixed(0) + 'deg');
    });

    // Títulos: as palavras acendem enquanto o título sobe no ecrã
    titles.forEach((el, i) => {
      const tp = clamp((vh * .92 - tr[i]) / (vh * .5));
      put(el, 'tp' + i, '--tp', tp.toFixed(2));
    });

    // Faixas tipográficas: deslizam em sentidos opostos ao ritmo do scroll
    bands.forEach((b, i) => {
      const r = br[i];
      if (r.bottom < -50 || r.top > vh + 50) return;
      const shift = (vh - r.top) * .45;
      const mx = b.dir > 0 ? -shift : shift - b.w / 4;
      put(b.track, 'mx' + i, '--mx', mx.toFixed(0) + 'px');
    });

    // Rodapé: o símbolo completa a volta com a página
    orbit.classList.toggle('is-off', y < vh * .5 || fTop < vh - 60);

    // Filosofia: o verde-petróleo cresce em círculo (só enquanto entra no ecrã)
    const t = clamp((vh - pr.top) / (vh * .95));
    put(philo, 'r', '--r', (6 + t * 144).toFixed(1) + '%');

    // Metodologia: percurso circular
    if (sr) {
      const mp = clamp((vh * .55 - sr.top) / sr.height);
      const mps = mp.toFixed(3);
      put(stepsEl, 'mp', '--p', mps);
      if (cycleSvg) put(cycleSvg, 'mps', '--p', mps);
      const idx = Math.min(steps.length - 1, Math.floor(mp * steps.length));
      if (cycle) cycle.classList.toggle('is-done', cTop < vh * .6);
      if (idx !== active) {
        active = idx;
        steps.forEach((s, i) => {
          s.classList.toggle('is-active', i === idx);
          s.classList.toggle('is-past', i < idx);
        });
        nodes.forEach((n, i) => n.classList.toggle('is-on', i <= idx));
        const st = steps[idx];
        cNum.textContent = $('.step__n', st).textContent;
        cName.textContent = $('h3', st).textContent;
      }
    }
  };

  /* ---------- Scroll suave com inércia (só rato/trackpad; telemóvel mantém o nativo) ---------- */
  if (window.Lenis && !reduced && window.matchMedia('(pointer: fine)').matches) {
    const lenis = new window.Lenis({ lerp: .085, wheelMultiplier: .95 });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id.length > 1 ? $(id) : null;
      if (!target && id !== '#') return;
      e.preventDefault();
      lenis.scrollTo(target || 0, { offset: -(header.offsetHeight - 1), duration: 1.4 });
      if (target) history.replaceState(null, '', id);
    }));
  }

  let ticking = false;
  const requestTick = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  };
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', () => { measure(); requestTick(); });
  onScroll();
  if (reduced) steps.forEach(s => s.classList.add('is-past'));

  $('[data-year]').textContent = new Date().getFullYear();
})();
