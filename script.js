const DURATION = 15;
const steps = [...document.querySelectorAll('.step')];
const claim = document.getElementById('claim');
const modal = document.getElementById('modal');

// Unlocks as soon as any one follow is verified; the others stay optional
function updateClaim() {
  const ready = steps.some(b => b.classList.contains('done'));
  claim.disabled = !ready;
  claim.querySelector('.label').textContent = ready ? '🎁 Claim Your Free Dessert' : '🔒 Locked';
}

// Completed follows are remembered per browser, keyed by the social link
const DONE_KEY = 'doneSteps';
function loadDone() {
  try { return JSON.parse(localStorage.getItem(DONE_KEY)) || []; } catch (e) { return []; }
}
function saveDone(url) {
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify([...new Set([...loadDone(), url])]));
  } catch (e) { /* storage blocked: the follow is only remembered for this page load */ }
}
function markDone(btn) {
  btn.classList.remove('verifying');
  btn.classList.add('done');
  btn.querySelector('.status').textContent = 'Completed ✔';
}

const done = loadDone();
steps.forEach(btn => {
  const status = btn.querySelector('.status');
  if (done.includes(btn.dataset.url)) markDone(btn);

  btn.addEventListener('click', () => {
    // Always open the link, so a completed platform can still be visited
    window.open(btn.dataset.url, '_blank', 'noopener');
    if (btn.classList.contains('verifying') || btn.classList.contains('done')) return;
    btn.classList.add('verifying');
    let left = DURATION;
    status.textContent = `Verifying... ${left}s`;
    const timer = setInterval(() => {
      left--;
      if (left > 0) {
        status.textContent = `Verifying... ${left}s`;
      } else {
        clearInterval(timer);
        markDone(btn);
        saveDone(btn.dataset.url);
        updateClaim();
      }
    }, 1000);
  });
});
updateClaim();

// Random 4-character control number (letters and digits). Generated once per browser and kept,
// so it only changes on a new device or after the browser's site data is cleared.
const CONTROL_KEY = 'controlNo';
let memoryControlNo = null;
function newControlNumber() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
function controlNumber() {
  try {
    const saved = localStorage.getItem(CONTROL_KEY);
    if (saved) return saved;
    const code = newControlNumber();
    localStorage.setItem(CONTROL_KEY, code);
    return code;
  } catch (e) {
    // Storage blocked (e.g. private mode): keep one number for this page load only
    memoryControlNo ??= newControlNumber();
    return memoryControlNo;
  }
}

// Burst of confetti on the first claim only (skipped if the viewer prefers reduced motion)
let confettiFired = false;
function fireConfetti() {
  if (confettiFired || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  confettiFired = true;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '10' });
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const colors = ['#ff7a1a', '#c8102e', '#f7efe1', '#ffd166', '#7ee09a'];
  const pieces = Array.from({ length: 140 }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 120,
    y: canvas.height * 0.6,
    vx: (Math.random() - 0.5) * 12,
    vy: -Math.random() * 14 - 6,
    size: Math.random() * 7 + 5,
    spin: Math.random() * Math.PI,
    spinSpeed: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  const start = performance.now();
  (function frame(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pieces) {
      p.vy += 0.35;   // gravity
      p.vx *= 0.99;   // air drag
      p.x += p.vx;
      p.y += p.vy;
      p.spin += p.spinSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (elapsed < 3000) requestAnimationFrame(frame);
    else canvas.remove();
  })(start);
}

claim.addEventListener('click', () => {
  if (claim.disabled) return;
  document.getElementById('controlNo').textContent = controlNumber();
  modal.hidden = false;
  fireConfetti();
});
document.getElementById('close').addEventListener('click', () => { modal.hidden = true; });
modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
