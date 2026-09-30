const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = document.documentElement;
const cssVar = n => getComputedStyle(html).getPropertyValue(n).trim();

// ---------- Theme ----------
const themeBtn = $('#theme-toggle');
const setTheme = t => {
  html.dataset.theme = t;
  localStorage.setItem('theme', t);
  themeBtn.innerHTML = `<i class="fas fa-${t === 'dark' ? 'sun' : 'moon'}"></i>`;
  chart && renderChart();
};
html.dataset.theme = localStorage.getItem('theme') || 'dark';
themeBtn.innerHTML = `<i class="fas fa-${html.dataset.theme === 'dark' ? 'sun' : 'moon'}"></i>`;
themeBtn.addEventListener('click', () => setTheme(html.dataset.theme === 'dark' ? 'light' : 'dark'));

// ---------- Chart (data inlined from chartData.json) ----------
let chart = null;
const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'], latency = [350, 310, 260, 205, 140, 95];
function renderChart() {
  const c = cssVar('--primary'), grid = cssVar('--border'), txt = cssVar('--muted');
  chart?.destroy();
  chart = new Chart($('#demoChart'), {
    type: 'line',
    data: { labels: weeks, datasets: [{ label: 'Pipeline optimization (latency ms)', data: latency, borderColor: c, backgroundColor: c + '33', fill: true, tension: 0.4 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: txt } } },
      scales: { x: { grid: { color: grid }, ticks: { color: txt } }, y: { grid: { color: grid }, ticks: { color: txt } } }
    }
  });
}

// ---------- GitHub (session cached) ----------
const GITHUB_USERNAME = 'anubhavwadhwa011-jpg';
function renderRepos(repos) {
  const grid = $('#github-grid');
  grid.replaceChildren();
  repos.forEach(r => {
    const a = document.createElement('a');
    a.className = 'repo-card'; a.href = r.html_url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    const desc = r.description ? (r.description.length > 60 ? r.description.slice(0, 60) + '...' : r.description) : 'No description provided.';
    a.innerHTML = '<h3></h3><p></p><div class="repo-stats"><span><i class="fas fa-star"></i> </span><span></span></div>';
    a.querySelector('h3').textContent = r.name;
    a.querySelector('p').textContent = desc;
    const [stars, lang] = a.querySelectorAll('.repo-stats span');
    stars.append(r.stargazers_count); lang.textContent = r.language || 'Code';
    grid.appendChild(a);
  });
  window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches &&
    gsap.from('.repo-card', { y: 40, opacity: 0, stagger: 0.08, duration: 0.7, ease: 'power3.out', clearProps: 'all' });
  window.ScrollTrigger && ScrollTrigger.refresh();
}
(async () => {
  const cached = sessionStorage.getItem('githubRepos');
  if (cached) return renderRepos(JSON.parse(cached));
  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=15`);
    if (!res.ok) throw new Error('GitHub request failed');
    const top = (await res.json()).filter(r => !r.fork).sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);
    sessionStorage.setItem('githubRepos', JSON.stringify(top));
    renderRepos(top);
  } catch {
    $('#github-grid').innerHTML = '<p class="text-muted">Could not load repositories. Please check my GitHub profile directly.</p>';
  }
})();

// ---------- Chat widget ----------
const fab = $('#chat-fab'), panel = $('#chat-panel'), input = $('#chat-input'), body = $('#chat-body'), form = $('#chat-form');
const sendBtn = $('button', form);
let open = false;
function toggleChat() {
  open = !open;
  fab.setAttribute('aria-expanded', open);
  panel.classList.toggle('hidden', !open);
  open ? input.focus() : fab.focus();
}
fab.addEventListener('click', toggleChat);
$('#close-chat').addEventListener('click', toggleChat);
$('#hero-chat').addEventListener('click', () => !open && toggleChat());
document.addEventListener('keydown', e => e.key === 'Escape' && open && toggleChat());
panel.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const f = $$('button, input', panel), first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
  else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
});
function addMsg(text, who) {
  const d = document.createElement('div');
  d.className = `message ${who}`; d.textContent = text; // textContent keeps streamed output XSS-safe
  body.appendChild(d); body.scrollTop = body.scrollHeight;
  return d;
}
form.addEventListener('submit', async e => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;
  addMsg(message, 'user');
  input.value = ''; input.disabled = sendBtn.disabled = true;
  const out = addMsg('...', 'system');
  try {
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
    if (!res.ok) throw new Error(res.status === 429 ? 'Too many requests. Slow down.' : 'Server error.');
    const reader = res.body.getReader(), dec = new TextDecoder();
    let full = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      full += dec.decode(value, { stream: true });
      out.textContent = full; body.scrollTop = body.scrollHeight;
    }
  } catch (err) {
    out.textContent = `Error: ${err.message} Please reach out via the contact form instead.`;
  } finally {
    input.disabled = sendBtn.disabled = false; input.focus();
  }
});

// ---------- GSAP: rolling + floating ----------
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.create({ trigger: '#demoChart', start: 'top 85%', once: true, onEnter: renderChart });

// Endless random drift: each leg picks a new target, so motion never loops visibly.
const drift = (el, r) => gsap.to(el, {
  x: gsap.utils.random(-r, r), y: gsap.utils.random(-r, r), rotation: gsap.utils.random(-r / 12, r / 12),
  duration: gsap.utils.random(4, 8), ease: 'sine.inOut', onComplete: drift, onCompleteParams: [el, r]
});

gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
  // 1. Hero: characters roll up out of a mask
  const title = $('#hero-title'), text = title.textContent;
  title.setAttribute('aria-label', text);
  title.innerHTML = [...text].map(c => `<span class="ch" aria-hidden="true"><span>${c}</span></span>`).join('');
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.bg', { opacity: 0, scale: 1.12, duration: 2.2 }, 0)
    .from('.navbar, .status-strip', { yPercent: -100, opacity: 0, duration: 1 }, 0)
    .from('.ch > span', { yPercent: 115, rotationX: -90, transformOrigin: '50% 100%', stagger: 0.06, duration: 1.3 }, 0.2)
    .from('.reveal', { y: 30, opacity: 0, stagger: 0.1, duration: 1 }, 0.8)
    .from('.float-layer span', { scale: 0, opacity: 0, stagger: 0.12, duration: 1, ease: 'back.out(2)' }, 1);

  // 2. Floating layers (each on its own wrapper so nothing fights over transforms)
  drift('.bg-float', 40);
  drift('.o1', 120); drift('.o2', 120);
  $$('.float-layer span').forEach(s => drift(s, 24));

  // 3. Pointer parallax: image and chips at different depths
  const bx = gsap.quickTo('.bg-img', 'x', { duration: 1.4, ease: 'power3' }), by = gsap.quickTo('.bg-img', 'y', { duration: 1.4, ease: 'power3' });
  const lx = gsap.quickTo('.float-layer', 'x', { duration: 1, ease: 'power3' }), ly = gsap.quickTo('.float-layer', 'y', { duration: 1, ease: 'power3' });
  const onMove = e => {
    const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
    bx(nx * -50); by(ny * -50); lx(nx * 40); ly(ny * 40);
  };
  addEventListener('pointermove', onMove);

  // 4. Scroll: progress bar + background slowly rolls and zooms
  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
  gsap.to('.bg-roll', { rotation: 9, scale: 1.18, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 1.2 } });

  // 5. Marquee rows roll in opposite directions and react to scroll velocity
  const rolls = $$('.track').map((t, i) => {
    const s = t.firstElementChild;
    for (let n = 0; n < 3; n++) t.append(s.cloneNode(true));
    const vars = { xPercent: i ? 0 : -50, duration: 30, ease: 'none', repeat: -1 };
    return i ? gsap.fromTo(t, { xPercent: -50 }, vars) : gsap.to(t, vars);
  });
  const skew = gsap.quickTo('.track', 'skewX', { duration: 0.4, ease: 'power3' });
  ScrollTrigger.create({
    onUpdate(self) {
      const v = self.getVelocity();
      gsap.to(rolls, { timeScale: 1 + Math.min(Math.abs(v) / 250, 8), duration: 0.15, overwrite: true });
      gsap.to(rolls, { timeScale: 1, duration: 1, delay: 0.15 });
      skew(gsap.utils.clamp(-10, 10, -v / 250));
    }
  });
  ScrollTrigger.addEventListener('scrollEnd', () => skew(0));

  // 6. Bento boxes roll in on a 3D axis, scrubbed to scroll position
  $$('.bento-box').forEach((box, i) => gsap.from(box, {
    rotationX: -60, x: i % 2 ? 70 : -70, y: 110, opacity: 0, transformOrigin: '50% 0%', ease: 'power3.out',
    scrollTrigger: { trigger: box, start: 'top 92%', end: 'top 52%', scrub: 0.6 }
  }));
  gsap.from('.skill-tag', { scale: 0.5, opacity: 0, y: 20, stagger: 0.07, ease: 'back.out(2)', scrollTrigger: { trigger: '.skills', start: 'top 75%' } });

  return () => removeEventListener('pointermove', onMove);
});