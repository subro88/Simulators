/* wide-tool-notice.js — v1
   A short, dismissible note for the simulators that genuinely need a larger
   screen: the circuit/logic builders (whose component palette alone is wider
   than a phone) and the wide fixed-stage diagrams.

   These tools stay usable on a phone — the stage scrolls inside its own box —
   but the honest thing is to say a bigger screen works better rather than let
   a student conclude the tool is broken.

   Self-contained: injects its own styles, no CSS dependency, no bump of
   shared/site.css. Opt in per tool with:
     <script src="../../shared/wide-tool-notice.js?v=1" defer></script>

   Notes:
   - Rendered only below WIDE_BREAKPOINT, so desktop is untouched.
   - Inserted before the simulator, never over it, and never over the article —
     nothing is hidden from the reader or from a crawler.
   - Dismissal is remembered per tool in localStorage.
*/
(function () {
  'use strict';

  var WIDE_BREAKPOINT = 760;   // matches the tools' own mobile breakpoints
  if (window.innerWidth > WIDE_BREAKPOINT) return;

  // Per-tool key: dismissing it on one wide tool should not silence the others.
  var slug = (location.pathname.replace(/\/+$/, '').split('/').pop() || 'tool');
  var KEY = 'wideToolNotice:' + slug;
  try { if (localStorage.getItem(KEY) === '1') return; } catch (e) { /* private mode */ }

  function init() {
    var app = document.getElementById('app');
    if (!app) return;

    // Sit directly above the simulator: after the header, before the canvas.
    var anchor = app.querySelector('.canvas-card, .ad-slot, .controls-bar');
    if (!anchor) return;

    var style = document.createElement('style');
    style.textContent =
      '.wide-tool-notice{display:flex;align-items:flex-start;gap:10px;' +
      'background:rgba(245,200,66,.08);border:1px solid rgba(245,200,66,.35);' +
      'border-radius:12px;padding:10px 12px;margin:0;' +
      'font-size:.78rem;line-height:1.5;color:var(--text-dim,#6b7a99);}' +
      '.wide-tool-notice b{color:var(--gold,#f5c842);font-weight:700;}' +
      '.wide-tool-notice .wtn-icon{flex:0 0 auto;font-size:1rem;line-height:1.3;}' +
      '.wide-tool-notice .wtn-text{flex:1 1 auto;min-width:0;}' +
      '.wide-tool-notice .wtn-close{flex:0 0 auto;background:none;border:0;' +
      'color:var(--text-dim,#6b7a99);font-size:1.1rem;line-height:1;cursor:pointer;' +
      'padding:2px 4px;border-radius:6px;}' +
      '.wide-tool-notice .wtn-close:hover{color:var(--text,#dde3f0);}' +
      '@media (min-width:761px){.wide-tool-notice{display:none;}}';
    document.head.appendChild(style);

    var box = document.createElement('div');
    box.className = 'wide-tool-notice';
    box.setAttribute('role', 'note');
    // Deliberately short: it sits above the simulator, so every extra line is
    // vertical space the student has to scroll past on a phone.
    box.innerHTML =
      '<span class="wtn-icon" aria-hidden="true">&#128241;</span>' +
      '<span class="wtn-text"><b>Best on a larger screen.</b> Drag the diagram ' +
      'sideways to see all of it, or open this simulator on a desktop for the ' +
      'full view.</span>' +
      '<button class="wtn-close" type="button" aria-label="Dismiss">&times;</button>';

    anchor.parentNode.insertBefore(box, anchor);

    box.querySelector('.wtn-close').addEventListener('click', function () {
      try { localStorage.setItem(KEY, '1'); } catch (e) { /* ignore */ }
      if (box.parentNode) box.parentNode.removeChild(box);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
