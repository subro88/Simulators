/* MechSimulator — KaTeX auto-render helper.
   Watches the live-equations panel (#lp-eq-body) and Show-Calculations
   modal body (#calc-modal-body) and renders LaTeX in classical
   notation any time their innerHTML changes. App code only needs to
   write LaTeX-delimited strings (\(...\) inline, \[...\] display);
   this file handles all rendering. Works on every major browser and
   mobile device because KaTeX uses CSS + web fonts (no plugins).
*/
(function () {
  'use strict';
  var DELIMS = [
    { left: '\\[', right: '\\]', display: true },
    { left: '\\(', right: '\\)', display: false }
  ];
   var TARGETS = ['learn-panels', 'lp-eq-body', 'lp-states-body', 'lp-perf-body', 'lp-coach-body', 'calc-modal-body'];

  function render(el) {
    if (!el || !window.renderMathInElement) return;
    try {
      window.renderMathInElement(el, {
        delimiters: DELIMS,
        throwOnError: false,
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre']
      });
    } catch (e) { /* silent — never break the simulator */ }
  }

  function setupObservers() {
    if (!window.MutationObserver) return;
    TARGETS.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var pending = false;
      var obs = new MutationObserver(function () {
        if (pending) return;
        pending = true;
        /* Defer one tick so all inner changes settle before render */
        setTimeout(function () {
          pending = false;
          render(el);
        }, 0);
      });
      obs.observe(el, { childList: true, subtree: true, characterData: true });
      /* Initial render in case content was set before observer attached */
      render(el);
    });
  }

  function init() {
    if (window.renderMathInElement) {
      setupObservers();
      return;
    }
    /* KaTeX is loaded with `defer` — poll until ready, then set up. */
    var attempts = 0;
    var iv = setInterval(function () {
      attempts++;
      if (window.renderMathInElement) {
        clearInterval(iv);
        setupObservers();
      } else if (attempts > 100) { /* 20s safety bail-out */
        clearInterval(iv);
      }
    }, 200);
  }

  /* Expose for direct calls when needed */
  window.MMLatex = { render: render };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
