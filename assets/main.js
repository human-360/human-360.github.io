/* HUMAN 360 · interações */

/* ===== CONFIGURAÇÃO PENDENTE =====
   formEndpoint: URL que recebe o formulário via POST (JSON). Ex.: Formspree, Basin, ou API própria.
                 Enquanto estiver vazio, o formulário valida mas NÃO envia, e informa o visitante.
   whatsappNumber: número em formato internacional, só dígitos (ex.: 244900000000). Vazio = botão oculto. */
const CONFIG = {
  formEndpoint: '',
  whatsappNumber: '',
  whatsappMessage: 'Olá. Gostaria de conhecer as soluções da HUMAN 360.'
};

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
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
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

    // "Falar sobre esta área": vai ao formulário com a área já escolhida
    $$('.sol__cta', sol).forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const select = $('#f-area');
      select.value = a.dataset.area;
      select.removeAttribute('aria-invalid');
      $('#e-area').textContent = '';
      $('#contactos').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      setTimeout(() => $('#f-nome').focus({ preventScroll: true }), reduced ? 0 : 800);
    }));

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
  const stepsEl = $('.steps');
  const steps = $$('.step');
  const nodes = $$('.cycle__node');
  const cycleSvg = $('.cycle svg');
  const cycle = $('.cycle');
  const cNum = $('.cycle__num');
  const cName = $('.cycle__name');
  let active = -1;

  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    const p = max > 0 ? clamp(y / max) : 0;

    // Indicador: a página completa 360°
    orbitFill.style.strokeDashoffset = 100 - p * 100;
    orbitDeg.textContent = String(Math.round(p * 360)).padStart(3, '0') + '°';
    const pr = philo.getBoundingClientRect();
    orbit.classList.toggle('on-dark', pr.top < vh - 40 && pr.bottom > vh - 40);

    // Header discreto: esconde ao descer, volta ao subir
    header.classList.toggle('is-scrolled', y > 24);
    if (menu.hidden) header.classList.toggle('is-hidden', y > vh * .9 && y > lastY + 2);
    if (y < lastY - 2) header.classList.remove('is-hidden');
    lastY = y;

    if (reduced) return;

    // Rodapé: o símbolo completa a volta com a página
    orbit.classList.toggle('is-off', footer.getBoundingClientRect().top < vh - 60);

    // Filosofia: o verde-petróleo cresce em círculo
    const t = clamp((vh - pr.top) / (vh * .95));
    philo.style.setProperty('--r', (6 + t * 144).toFixed(2) + '%');

    // Metodologia: percurso circular
    if (stepsEl) {
      const r = stepsEl.getBoundingClientRect();
      const mp = clamp((vh * .55 - r.top) / r.height);
      stepsEl.style.setProperty('--p', mp.toFixed(4));
      if (cycleSvg) cycleSvg.style.setProperty('--p', mp.toFixed(4));
      const idx = Math.min(steps.length - 1, Math.floor(mp * steps.length));
      const commit = $('.commit');
      if (cycle) cycle.classList.toggle('is-done', commit.getBoundingClientRect().top < vh * .6);
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

  let ticking = false;
  const requestTick = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  };
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  onScroll();
  if (reduced) steps.forEach(s => s.classList.add('is-past'));

  /* ---------- WhatsApp (só aparece com número configurado) ---------- */
  const wa = $('[data-whatsapp]');
  if (wa && /^\d{8,15}$/.test(CONFIG.whatsappNumber)) {
    wa.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(CONFIG.whatsappMessage)}`;
    wa.hidden = false;
  }

  /* ---------- CTA de contacto leva ao formulário ---------- */
  $$('[data-focus-form]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const first = $('#f-nome');
    $('#form').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => first.focus({ preventScroll: true }), reduced ? 0 : 600);
  }));

  /* ---------- Formulário ---------- */
  const form = $('#form');
  const status = $('.form__status');
  const rules = {
    nome: v => v.trim().length >= 2 || 'Indique o seu nome.',
    empresa: v => v.trim().length >= 2 || 'Indique o nome da empresa.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Indique um email válido.',
    telefone: v => !v.trim() || /^[+\d][\d\s().-]{7,19}$/.test(v.trim()) || 'Verifique o número de telefone.',
    area: v => !!v || 'Selecione uma área de interesse.',
    mensagem: v => v.trim().length >= 10 || 'Descreva brevemente o seu pedido (mínimo 10 caracteres).',
    consentimento: (v, el) => el.checked || 'É necessário autorizar a utilização dos dados.'
  };
  const errIds = { nome: 'e-nome', empresa: 'e-empresa', email: 'e-email', telefone: 'e-tel', area: 'e-area', mensagem: 'e-msg', consentimento: 'e-ok' };

  const check = el => {
    const res = rules[el.name](el.value, el);
    const msg = res === true ? '' : res;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    $('#' + errIds[el.name]).textContent = msg;
    return !msg;
  };
  Object.keys(rules).forEach(name => {
    const el = form.elements[name];
    el.addEventListener('blur', () => { if (el.value || el.type === 'checkbox') check(el); });
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') check(el); });
    el.addEventListener('change', () => { if (el.getAttribute('aria-invalid') === 'true') check(el); });
  });

  const setStatus = (msg, kind) => {
    status.textContent = msg;
    status.className = 'form__status' + (kind ? ' is-' + kind : '');
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    setStatus('');
    const fields = Object.keys(rules).map(n => form.elements[n]);
    const invalid = fields.filter(el => !check(el));
    if (invalid.length) { invalid[0].focus(); return; }
    if (form.elements.website.value) return; // armadilha anti-spam

    if (!CONFIG.formEndpoint) {
      console.info('[HUMAN 360] Formulário sem endpoint configurado (CONFIG.formEndpoint em assets/main.js).');
      setStatus('O envio de mensagens por este formulário ainda não está ativo. A sua mensagem não foi enviada. Pedimos desculpa pelo incómodo.', 'warn');
      return;
    }

    const btn = $('button[type="submit"]', form);
    btn.disabled = true;
    setStatus('A enviar…');
    const data = Object.fromEntries(['nome', 'empresa', 'email', 'telefone', 'area', 'mensagem'].map(n => [n, form.elements[n].value.trim()]));
    try {
      const res = await fetch(CONFIG.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      fields.forEach(el => el.removeAttribute('aria-invalid'));
      setStatus('Obrigado. A sua mensagem foi enviada e a nossa equipa entrará em contacto.', 'ok');
    } catch (err) {
      console.error('[HUMAN 360] Falha no envio do formulário', err);
      setStatus('Não foi possível enviar a mensagem. Por favor, tente novamente dentro de alguns instantes.', 'warn');
    } finally {
      btn.disabled = false;
    }
  });

  $('[data-year]').textContent = new Date().getFullYear();
})();
