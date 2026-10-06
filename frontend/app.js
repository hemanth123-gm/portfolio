(() => {
const $ = (s) => document.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
$('#yr').textContent = new Date().getFullYear();

/* ---------- Matrix / binary rain ---------- */
const rain = $('#rain'), rc = rain.getContext('2d');
let cols, drops;
function sizeRain() {
  rain.width = innerWidth; rain.height = innerHeight;
  cols = Math.floor(rain.width / 18); drops = Array(cols).fill(0).map(() => Math.random() * -50);
}
sizeRain(); addEventListener('resize', sizeRain);
const glyphs = '01<>/\\{}[]#$%&*ABCDEF'.split('');
function drawRain() {
  rc.fillStyle = 'rgba(5,5,6,.12)'; rc.fillRect(0, 0, rain.width, rain.height);
  rc.fillStyle = '#ff1e2d'; rc.font = '15px Share Tech Mono, monospace';
  drops.forEach((y, i) => {
    rc.fillText(glyphs[(Math.random() * glyphs.length) | 0], i * 18, y * 18);
    drops[i] = y * 18 > rain.height && Math.random() > 0.975 ? 0 : y + 1;
  });
}
if (!reduce) setInterval(drawRain, 70);

/* ---------- Three.js 3D scene ---------- */
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100); camera.position.z = 9;
const RED = 0xff1e2d;
const core = new THREE.Group(); scene.add(core);
core.add(new THREE.Mesh(new THREE.IcosahedronGeometry(2, 1), new THREE.MeshBasicMaterial({ color: RED, wireframe: true, transparent: true, opacity: .55 })));
core.add(new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), new THREE.MeshBasicMaterial({ color: 0xa30010, wireframe: true })));
const rings = [0, 1, 2].map((i) => {
  const r = new THREE.Mesh(new THREE.TorusGeometry(2.8 + i * .5, .01, 8, 120), new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: .6 }));
  r.rotation.set(i * 1.1, i * .7, 0); core.add(r); return r;
});
// network node cloud
const N = 220, pos = new Float32Array(N * 3);
for (let i = 0; i < N * 3; i++) pos[i] = (Math.random() - .5) * 26;
const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: RED, size: .07, transparent: true, opacity: .8 })); scene.add(pts);
const lp = []; for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
  const d = Math.hypot(pos[i*3]-pos[j*3], pos[i*3+1]-pos[j*3+1], pos[i*3+2]-pos[j*3+2]);
  if (d < 2.6) lp.push(pos[i*3], pos[i*3+1], pos[i*3+2], pos[j*3], pos[j*3+1], pos[j*3+2]);
}
const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lp), 3));
const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: RED, transparent: true, opacity: .13 })); scene.add(lines);

let mx = 0, my = 0, sy = 0;
addEventListener('mousemove', (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
addEventListener('scroll', () => { sy = scrollY; }, { passive: true });
function fit() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
fit(); addEventListener('resize', fit);
const clock = new THREE.Clock();
(function loop() {
  const t = clock.getElapsedTime();
  if (!reduce) { core.rotation.y = t * .25 + mx; core.rotation.x = t * .12 + my; }
  rings.forEach((r, i) => { r.rotation.z = t * (.2 + i * .1); });
  const wide = innerWidth > 820;
  core.position.x = wide ? -4 + Math.min(sy / 250, 4) : 0; core.position.y = wide ? 0 : 2.6;
  core.scale.setScalar(Math.max(.35, 1 - sy / 1800));
  pts.rotation.y = lines.rotation.y = t * .02 + mx * .3;
  pts.rotation.x = lines.rotation.x = my * .2 + sy * .0003;
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
})();

/* ---------- 3D tilt (photo + cards) ---------- */
function tilt(el, max = 10) {
  el.addEventListener('mousemove', (e) => {
    const b = el.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
    el.style.transform = `rotateY(${x * max * 2}deg) rotateX(${-y * max * 2}deg)`;
  });
  el.addEventListener('mouseleave', () => { el.style.transform = ''; });
}
if (!reduce) tilt($('#photo'), 9);

/* ---------- Load profile from backend ---------- */
const chips = (a) => a.map((s) => `<span class="chip">${esc(s)}</span>`).join('');
function render(p) {
  $('#summary').textContent = p.summary;
  let i = 0, j = 0, del = false;
  const el = $('#typed');
  (function type() {
    const w = p.roles[i];
    el.textContent = w.slice(0, j);
    if (!del && j++ === w.length) { del = true; return setTimeout(type, 1400); }
    if (del && --j < 0) { del = false; j = 0; i = (i + 1) % p.roles.length; }
    setTimeout(type, del ? 35 : 80);
  })();
  $('#labs').innerHTML = p.labs.map((l) => `<div class="card reveal"><span class="tag">lab</span><h3>${esc(l.name)}</h3><p>${esc(l.desc)}</p></div>`).join('');
  $('#soft').innerHTML = chips(p.soft);
  $('#projectGrid').innerHTML = p.projects.map((x) => `<article class="card reveal"><span class="tag">${esc(x.tag)}</span><h3>${esc(x.name)}</h3><p>${esc(x.desc)}</p><div class="chips">${chips(x.stack)}</div><a class="go" href="${esc(x.link)}" target="_blank" rel="noopener">View on GitHub</a></article>`).join('');
  $('#skillGrid').innerHTML = Object.entries(p.skills).map(([k, v]) => `<div class="card reveal"><h3>${esc(k)}</h3><div class="chips">${chips(v)}</div></div>`).join('');
  $('#eduList').innerHTML = p.education.map((e) => `<div class="reveal"><h3>${esc(e.school)}</h3><p>${esc(e.what)}</p><small>${esc(e.meta)}</small></div>`).join('');
  $('#extra').innerHTML = [['Languages', p.languages], ['Hobbies', p.hobbies]].map(([t, a]) => `<div class="card reveal"><h3>${t}</h3><div class="chips">${chips(a)}</div></div>`).join('');
  const c = p.contact;
  $('#links').innerHTML = `<h3>Reach me</h3><a href="mailto:${esc(c.email)}">${esc(c.email)}</a><a href="tel:${esc(c.phone)}">${esc(c.phone)}</a><a href="${esc(c.linkedin)}" target="_blank" rel="noopener">LinkedIn</a><a href="${esc(c.github)}" target="_blank" rel="noopener">GitHub</a><a href="${esc(c.tryhackme)}" target="_blank" rel="noopener">TryHackMe</a>`;
  document.querySelectorAll('.card').forEach((c) => { if (!reduce) tilt(c, 4); });
  const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach((n) => io.observe(n));
}
fetch('/api/profile').then((r) => r.json()).then(render).catch(() => { $('#summary').textContent = 'Start the backend (npm start) to load portfolio data.'; });

/* ---------- Contact form -> backend ---------- */
$('#form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('#formMsg'), f = e.target;
  msg.textContent = 'Sending...';
  try {
    const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(f))) });
    const d = await r.json();
    msg.textContent = r.ok ? 'Message sent. I will reply soon.' : d.error;
    if (r.ok) f.reset();
  } catch { msg.textContent = 'Could not reach the server. Try again.'; }
});
})();
