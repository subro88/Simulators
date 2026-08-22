/* ═══════════════════════════════════════════════════════════════════
   shared/share-params.js — "Share your setup" link for parameter-driven tools

   Generic, zero-config: serialises every id'd <input>/<select> on the page
   into location.hash '#c=', copies the link, and on load restores those
   values and fires input/change so the tool recomputes with its own logic.

   Drop-in: add AFTER the tool's own app.js —
     <script src="../../shared/share-params.js?v=1" defer></script>

   Self-protecting: does nothing if the page already has its own #btn-share
   (the builder tools ship a bespoke, state-aware share), or if there are no
   shareable controls. Zero dependencies.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (document.getElementById('btn-share')) return;        // tool has its own share — never double up

  /* ── URL-safe binary helpers ─────────────────────────────────── */
  function b64urlEncode(u8) { var s = ''; for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64urlDecode(str) { str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; var bin = atob(str), u8 = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return u8; }
  function deflateBytes(u8) { var cs = new CompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(cs)).arrayBuffer().then(function (b) { return new Uint8Array(b); }); }
  function inflateBytes(u8) { var ds = new DecompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer().then(function (b) { return new Uint8Array(b); }); }

  var SHARE_MAX = 1800;      // hash-length ceiling — refuse rather than emit a truncated link
  var SKIP_TYPES = { file: 1, password: 1, submit: 1, button: 1, image: 1, reset: 1 };
  /* answer boxes & scratch fields belong to Practice/Quiz, not to the shared setup */
  var SKIP_IDS = /^(pp-|quiz-|qq-|ans|answer)/i;

  /* ── which controls make up "the setup" ──────────────────────── */
  function controls() {
    var out = [], els = document.querySelectorAll('input[id], select[id]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.tagName === 'INPUT' && SKIP_TYPES[el.type]) continue;
      if (SKIP_IDS.test(el.id)) continue;
      if (el.closest && el.closest('.user-guide, .seo-article, .quiz-panel, #quiz-panel, .practice-panel, #practice-panel, .question-panel')) continue;  // not part of the sim setup
      out.push(el);
    }
    return out;
  }

  function readParams() {
    var p = {}, els = controls();
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      p[el.id] = (el.type === 'checkbox' || el.type === 'radio') ? (el.checked ? 1 : 0) : el.value;
    }
    return p;
  }

  function applyParams(p) {
    var els = controls(), n = 0;
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; if (!(el.id in p)) continue;
      var v = p[el.id];
      if (el.type === 'checkbox' || el.type === 'radio') {
        var want = !!(+v); if (el.checked !== want) { el.checked = want; fire(el); } else el.checked = want;
      } else if (el.value !== String(v)) { el.value = String(v); fire(el); }
      n++;
    }
    return n;
  }
  function fire(el) {
    try { el.dispatchEvent(new Event('input',  { bubbles: true })); } catch (e) {}
    try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
  }

  /* ── the button (injected into the standard header actions row) ── */
  function makeButton() {
    var host = document.querySelector('.head-actions');
    if (!host) return null;
    var b = document.createElement('button');
    b.id = 'btn-share';
    b.className = 'btn-link';
    b.type = 'button';
    b.title = 'Copy a shareable link to this exact setup';
    b.setAttribute('aria-label', 'Copy shareable link to this setup');
    b.innerHTML = '🔗 Share<span class="btn-share-ext"> your setup</span>';
    var guide = host.querySelector('.btn-guide');
    if (guide) host.insertBefore(b, guide); else host.appendChild(b);
    return b;
  }

  function flash(label, ok) {
    var b = document.getElementById('btn-share'); if (!b) return;
    if (b._orig == null) b._orig = b.innerHTML;
    clearTimeout(b._ft);
    b.textContent = label;
    b.style.color = ok === false ? '#ff6b6b' : (ok ? '#43c66a' : '');
    b._ft = setTimeout(function () { b.innerHTML = b._orig; b.style.color = ''; }, 1900);
  }

  /* ── share ───────────────────────────────────────────────────── */
  function shareLink() {
    try {
      var json = JSON.stringify(readParams());
      var U = new TextEncoder().encode(json);
      var canZip = (typeof CompressionStream !== 'undefined');
      var zipped = canZip ? deflateBytes(U) : Promise.resolve(null);
      return zipped.then(function (z) {
        /* param sets are tiny — deflate sometimes costs more than it saves, so take the shorter */
        var useZip = !!(z && z.length < U.length);
        var body = useZip ? z : U;
        var out = new Uint8Array(body.length + 1);
        out[0] = useZip ? 1 : 0; out.set(body, 1);
        var enc = b64urlEncode(out);
        if (enc.length > SHARE_MAX) { flash('⚠ Too big', false); return; }
        var url = location.origin + location.pathname + '#c=' + enc;
        try { window.history.replaceState(null, '', '#c=' + enc); } catch (e) {}
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(
            function () { flash('✓ Link copied!', true); },
            function () { flash('↑ In address bar'); });
        } else { flash('↑ In address bar'); }
      }).catch(function () { flash('✗ Failed', false); });
    } catch (e) { flash('✗ Failed', false); return Promise.resolve(); }
  }

  /* ── restore ─────────────────────────────────────────────────── */
  function loadFromHash() {
    var h = location.hash || ''; if (h.indexOf('#c=') !== 0) return;
    var enc = h.slice(3);
    Promise.resolve().then(function () {
      var all = b64urlDecode(enc), flag = all[0], body = all.subarray(1);
      return (flag === 1) ? inflateBytes(body) : Promise.resolve(body);
    }).then(function (U) {
      var p = JSON.parse(new TextDecoder().decode(U));
      if (!p || typeof p !== 'object' || Array.isArray(p)) return;   // shape mismatch → ignore
      applyParams(p);
    }).catch(function () {});                                        // corrupt link → leave defaults
  }

  function boot() {
    if (!controls().length) return;             // nothing worth sharing on this page
    var b = makeButton(); if (!b) return;
    b.addEventListener('click', shareLink);
    setTimeout(loadFromHash, 0);                // after the tool's own init (rAF-free: not throttled)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
