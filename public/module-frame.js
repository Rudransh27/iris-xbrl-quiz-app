// public/module-frame.js
//
// Runs one HTML learning module. Quiz.jsx loads module-frame.html in its
// sandboxed iframe and posts the module's HTML here (the module unchanged,
// plus Orbit's bridge script — src/utils/sandboxBridge.js); this page then
// becomes that module, exactly as if it had been loaded directly.
//
// Why a separate page: module HTML is full of inline <script> blocks and
// onclick="..." handlers. Loaded from its own URL, this page gets its own
// Content-Security-Policy (nginx: the module-frame.html location), which
// allows inline scripts, so the app's policy doesn't have to. (A blob: frame
// would inherit the app's policy instead.) The iframe's sandbox flags still
// apply to everything the module does.
//
// Only the page that embeds this frame — on this same host — can hand it
// HTML, and only once.
(function () {
  'use strict';
  if (window.parent === window) return; // opened on its own: nothing to run

  // This file's URL origin, which is the Orbit app's (location.origin is
  // the URL's origin even when the sandbox makes the document's opaque).
  var appOrigin = window.location.origin;
  var tries = 0;
  var ready = setInterval(announce, 250);

  function announce() {
    // Repeated a few times in case the app isn't listening yet.
    if (++tries > 40) clearInterval(ready);
    window.parent.postMessage({ type: 'ORBIT_MODULE_FRAME_READY' }, appOrigin);
  }

  function onMessage(event) {
    if (event.source !== window.parent || event.origin !== appOrigin) return;
    var data = event.data;
    if (!data || data.type !== 'ORBIT_MODULE_HTML' || typeof data.html !== 'string') return;
    clearInterval(ready);
    window.removeEventListener('message', onMessage);
    // Replaces this page with the module; its scripts and handlers run as
    // the HTML is parsed, under this page's policy and the iframe's sandbox.
    document.open();
    document.write(data.html);
    document.close();
  }

  window.addEventListener('message', onMessage);
  announce();
})();
