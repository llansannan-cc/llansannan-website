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

/* ── Live "next meeting" (UK time) ───────────────────────────────────────── */
/* Pages are built ahead of time, so the next meeting is re-worked-out here  */
/* from the real clock. A meeting counts as over 3 hours after it starts.    */
function llUkStamp() {
  var p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  var g = function (t) { return p.filter(function (x) { return x.type === t; })[0].value; };
  return g('year') + '-' + g('month') + '-' + g('day') + 'T' + g('hour') + ':' + g('minute');
}

document.addEventListener('DOMContentLoaded', function () {
  var stamp;
  try { stamp = llUkStamp(); } catch (e) { return; }

  // Homepage banner
  var nm = document.querySelector('.next-meeting[data-schedule]');
  if (nm) {
    try {
      var list = JSON.parse(nm.getAttribute('data-schedule'));
      var next = list.filter(function (m) { return m.end >= stamp; })[0];
      var wrap = document.getElementById('next-meeting-wrap');
      if (!next) { if (wrap) wrap.hidden = true; }
      else {
        var set = function (k, v) { var el = nm.querySelector('[data-nm="' + k + '"]'); if (el) el.textContent = v; };
        set('date_cy', next.date_cy); set('date_en', next.date_en);
        set('meta_cy', next.time + ' — ' + next.location_cy);
        set('meta_en', next.time + ' — ' + next.location_en);
      }
    } catch (e) {}
  }

  // Meetings table
  var rows = document.querySelectorAll('tr[data-end]');
  var found = false;
  rows.forEach(function (tr) {
    var past = tr.getAttribute('data-end') < stamp;
    var isNext = !past && !found;
    if (isNext) found = true;
    tr.classList.toggle('next-row', isNext);
    var badge = tr.querySelector('.nm-badge');
    if (badge) badge.hidden = !isNext;
  });
});
