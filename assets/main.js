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

  /* ---------- Soluções: Mostrador 360° ---------- */
  const dial = $('.dial');
  if (dial) {
    const items = $$('.dial__item', dial);
    const btns = items.map(li => $('.dial__btn', li));
    const list = $('.dial__list', dial);
    const rot = $('.dial__rot', dial);
    const degEl = $('.dial__deg', dial);
    const mdesc = $('.dial__mdesc', dial);
    const desktop = window.matchMedia('(min-width: 1024px)');
    const canHover = window.matchMedia('(hover: hover)');
    const pad = n => String(Math.round(n)).padStart(3, '0') + '°';
    const ease = k => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

    // Anel: círculo base + 5 marcas a cada 72° (0° no topo, sentido horário)
    const ns = 'http://www.w3.org/2000/svg';
    const ring = $('.dial__ring', dial);
    const C = 260, R = 250;
    const pt = (a, r) => { const t = (a - 90) * Math.PI / 180; return [C + r * Math.cos(t), C + r * Math.sin(t)]; };
    const el = (tag, attrs, parent) => {
      const n = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      parent.append(n);
      return n;
    };
    el('circle', { class: 'dial__base', cx: C, cy: C, r: R, pathLength: 100 }, ring);
    const marks = items.map(li => {
      const a = +li.dataset.deg;
      const g = el('g', { class: 'dial__mk' }, ring);
      const [s1, s2] = [pt(a - 14, R), pt(a + 14, R)];
      el('path', { class: 'dial__seg', d: `M${s1} A${R} ${R} 0 0 1 ${s2}` }, g);
      const [t1, t2] = [pt(a, R - 10), pt(a, R + 10)];
      el('line', { class: 'dial__tick', x1: t1[0], y1: t1[1], x2: t2[0], y2: t2[1] }, g);
      const n = pt(a, R);
      el('circle', { class: 'dial__node', cx: n[0], cy: n[1], r: 5 }, g);
      const l = pt(a, R + 32);
      el('text', { class: 'dial__lbl', x: l[0], y: l[1], 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, g).textContent = pad(a);
      return g;
    });

    // Divide um parágrafo em linhas reais para a revelação linha a linha
    const splitLines = p => {
      const text = p.dataset.text || (p.dataset.text = p.textContent.trim());
      p.textContent = '';
      const words = text.split(/\s+/).map(w => {
        const s = document.createElement('span');
        s.textContent = w + ' ';
        p.append(s);
        return s;
      });
      const lines = [];
      let top = null;
      words.forEach(s => {
        if (s.offsetTop !== top) { lines.push([]); top = s.offsetTop; }
        lines[lines.length - 1].push(s.textContent);
      });
      p.textContent = '';
      lines.forEach((l, i) => {
        const s = document.createElement('span');
        s.className = 'ln';
        s.style.setProperty('--l', i);
        s.textContent = l.join('').trim();
        p.append(s, ' ');
      });
    };
    const splitAll = () => items.forEach(li => splitLines($('.dial__panel p', li)));

    let current = -1, angle = 0, shown = 0, counterRaf = 0;
    const countTo = target => {
      cancelAnimationFrame(counterRaf);
      if (reduced) { shown = target; degEl.textContent = pad(target); return; }
      const from = shown, t0 = performance.now(), dur = 900;
      const tick = now => {
        const k = clamp((now - t0) / dur);
        shown = from + (target - from) * ease(k);
        degEl.textContent = pad(shown);
        if (k < 1) counterRaf = requestAnimationFrame(tick);
      };
      counterRaf = requestAnimationFrame(tick);
    };

    const activate = i => {
      if (i === current) return;
      current = i;
      const target = +items[i].dataset.deg;
      // caminho mais curto até ao novo ângulo
      const delta = ((target - angle) % 360 + 540) % 360 - 180;
      angle += delta;
      rot.style.transform = `rotate(${angle}deg)`;
      countTo(target);
      items.forEach((li, k) => {
        li.classList.toggle('is-active', k === i);
        btns[k].setAttribute('aria-expanded', String(k === i));
        marks[k].classList.toggle('is-on', k === i);
      });
      if (!desktop.matches) {
        mdesc.classList.remove('is-on');
        mdesc.innerHTML = '';
        const p = document.createElement('p');
        p.textContent = $('.dial__panel p', items[i]).dataset.text || $('.dial__panel p', items[i]).textContent;
        mdesc.append(p);
        splitLines(p);
        void mdesc.offsetWidth;
        mdesc.classList.add('is-on');
      }
    };

    // Clique (todos os dispositivos)
    btns.forEach((b, i) => b.addEventListener('click', () => {
      activate(i);
      if (!desktop.matches) items[i].scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
    }));

    // Hover com atraso de 120ms (só desktop com rato). Só conta movimento real do rato,
    // e fica bloqueado enquanto a lista se reajusta, para não ativar o item que "passa" por baixo.
    let hoverT, lockUntil = 0, lastX = -1, lastY = -1;
    btns.forEach((b, i) => {
      b.addEventListener('mousemove', e => {
        if (!desktop.matches || !canHover.matches) return;
        if (e.clientX === lastX && e.clientY === lastY) return;
        lastX = e.clientX; lastY = e.clientY;
        if (i === current || performance.now() < lockUntil) return;
        clearTimeout(hoverT);
        hoverT = setTimeout(() => { activate(i); lockUntil = performance.now() + 650; }, 120);
      });
      b.addEventListener('mouseleave', () => clearTimeout(hoverT));
    });

    // Teclado: setas mudam de item
    list.addEventListener('keydown', e => {
      const k = btns.indexOf(document.activeElement);
      if (k < 0) return;
      const next = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!next) return;
      e.preventDefault();
      const j = (k + next + btns.length) % btns.length;
      btns[j].focus();
      btns[j].click();
    });

    // Telemóvel: o item centrado na faixa fica ativo
    let stripRaf = 0;
    list.addEventListener('scroll', () => {
      if (desktop.matches) return;
      cancelAnimationFrame(stripRaf);
      stripRaf = requestAnimationFrame(() => {
        const mid = list.getBoundingClientRect().left + list.clientWidth / 2;
        let best = 0, dist = Infinity;
        items.forEach((li, k) => {
          const r = li.getBoundingClientRect();
          const d = Math.abs(r.left + r.width / 2 - mid);
          if (d < dist) { dist = d; best = k; }
        });
        activate(best);
      });
    }, { passive: true });

    // Entrada: uma vez, quando a secção aparece
    if ('IntersectionObserver' in window && !reduced) {
      const dio = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) { dial.classList.add('is-in'); dio.disconnect(); }
      }, { threshold: .2 });
      dio.observe(dial);
    } else dial.classList.add('is-in');

    let resizeT;
    window.addEventListener('resize', () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => { splitAll(); const c = current; current = -1; activate(c); }, 200);
    });
    splitAll();
    activate(0);
  }

  /* ---------- Efeitos de scroll ---------- */
  const orbitFill = $('.orbit__fill');
  const orbitDeg = $('.orbit__deg');
  const orbit = $('.orbit');
  const spin = $('.mark__spin');
  const mark = $('.mark');
  setTimeout(() => mark.classList.add('is-ready'), 2300);
  const dot = $('.mark__dot');
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

    // Hero: o símbolo gira com o scroll; o ponto percorre a órbita
    if (y < vh * 1.4) {
      spin.style.transform = `rotate(${y * .12}deg)`;
      mark.style.setProperty('--open', clamp(y / (vh * .75)).toFixed(3));
      dot.style.transform = `rotate(${-50 + y * .14}deg)`;
    }
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
