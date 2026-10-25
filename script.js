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

steps.forEach(btn => {
  const status = btn.querySelector('.status');
  btn.addEventListener('click', () => {
    if (btn.classList.contains('verifying') || btn.classList.contains('done')) return;
    window.open(btn.dataset.url, '_blank', 'noopener');
    btn.classList.add('verifying');
    let left = DURATION;
    status.textContent = `Verifying... ${left}s`;
    const timer = setInterval(() => {
      left--;
      if (left > 0) {
        status.textContent = `Verifying... ${left}s`;
      } else {
        clearInterval(timer);
        btn.classList.remove('verifying');
        btn.classList.add('done');
        status.textContent = 'Done ✔';
        updateClaim();
      }
    }, 1000);
  });
});

claim.addEventListener('click', () => { if (!claim.disabled) modal.hidden = false; });
document.getElementById('close').addEventListener('click', () => { modal.hidden = true; });
modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
