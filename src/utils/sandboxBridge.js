// src/utils/sandboxBridge.js
//
// A small script Orbit appends to every HTML module before loading it into
// the sandbox iframe — the module's own HTML is never edited.
//
//  1. FIRST-ANSWER CAPTURE. Quiz-bank modules keep the learner's choice per
//     question in a top-level `chosenAns` object (whatever their answer
//     function is called — ans(), ansM(), or an addEventListener closure).
//     Top-level const/let bindings of classic scripts share one global
//     scope, so this script can read `chosenAns` directly. Every new value
//     is posted to Orbit as ORBIT_ANSWER; the server keeps only the first
//     answer per question (retries inside the module earn no XP).
//     A capture-phase click listener flushes pending answers BEFORE the
//     module's own click handlers run, so all answers are posted ahead of
//     the module's HTML_SIMULATION_SUBMIT message.
//  2. EXIT CONTAINMENT. After submitting, modules call window.close(),
//     history.back() and finally location.replace("about:blank"). Inside an
//     iframe, history.back() walks the TOP-LEVEL session history — it could
//     navigate the learner off the Orbit page. close/back/go are neutralised
//     here; the about:blank replace only ever affects the iframe, and Orbit
//     closes the overlay itself.
const BRIDGE_SOURCE = `
(function () {
  if (window.__orbitBridge) return;
  window.__orbitBridge = true;
  var sent = {};
  function post(msg) {
    try { msg.fromOrbitBridge = true; window.parent.postMessage(msg, '*'); } catch (e) {}
  }
  function poll() {
    var bank;
    try { bank = (typeof chosenAns !== 'undefined') ? chosenAns : null; } catch (e) { bank = null; }
    if (!bank || typeof bank !== 'object') return;
    Object.keys(bank).forEach(function (qid) {
      var v = bank[qid];
      if (v === undefined || v === null || v === '') return;
      v = String(v);
      if (sent[qid] === v) return;
      sent[qid] = v;
      post({ type: 'ORBIT_ANSWER', qid: String(qid), chosen: v });
    });
  }
  document.addEventListener('click', poll, true);
  document.addEventListener('click', function () { setTimeout(poll, 0); }, false);
  document.addEventListener('change', function () { setTimeout(poll, 0); }, true);
  document.addEventListener('keyup', function () { setTimeout(poll, 0); }, true);
  setInterval(poll, 750);
  try { window.close = function () {}; } catch (e) {}
  try { window.history.back = function () {}; window.history.go = function () {}; } catch (e) {}
})();
`;

export function withOrbitBridge(htmlSource) {
  const html = String(htmlSource || '');
  const tag = `<script data-orbit-bridge>${BRIDGE_SOURCE}</script>`;
  // Append after the module's own scripts so `chosenAns` already exists.
  const closeBody = html.lastIndexOf('</body>');
  return closeBody >= 0 ? html.slice(0, closeBody) + tag + html.slice(closeBody) : html + tag;
}
