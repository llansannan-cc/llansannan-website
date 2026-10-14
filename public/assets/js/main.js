/* Llansannan Community Council — main.js */

/* ── Language toggle ─────────────────────────────────────────────────────── */
function toggleLang() {
  const html = document.documentElement;
  const current = html.getAttribute('data-lang') || 'en';
  const next = current === 'en' ? 'cy' : 'en';
  html.setAttribute('data-lang', next);
  html.setAttribute('lang', next === 'en' ? 'en-GB' : 'cy-GB');
  try { localStorage.setItem('lang', next); } catch(e) {}
}

// Restore saved language on page load
(function() {
  try {
    const saved = localStorage.getItem('lang');
    if (saved === 'cy') {
      document.documentElement.setAttribute('data-lang', 'cy');
      document.documentElement.setAttribute('lang', 'cy-GB');
    }
  } catch(e) {}
})();

/* ── Mobile nav ──────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.getElementById('hamburger');
  const mobNav = document.getElementById('mob-nav');

  if (hamburger && mobNav) {
    hamburger.addEventListener('click', function() {
      const isOpen = mobNav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      mobNav.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    });

    // Close mobile nav on outside click
    document.addEventListener('click', function(e) {
      if (!hamburger.contains(e.target) && !mobNav.contains(e.target)) {
        mobNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobNav.setAttribute('aria-hidden', 'true');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && mobNav.classList.contains('open')) {
        mobNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobNav.setAttribute('aria-hidden', 'true');
        hamburger.focus();
      }
    });
  }

  // Mark active nav link
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-links a.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href !== '/' && currentPath.startsWith(href)) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else if (href === '/' && currentPath === '/') {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
});

/* ── PDF links open in a new window ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a[href$=".pdf"], a[href*=".pdf?"]').forEach(function(a) {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    var s = document.createElement('span');
    s.className = 'new-window-note';
    s.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
    s.textContent = ' (opens in a new window / yn agor mewn ffenestr newydd)';
    a.appendChild(s);
  });
});
