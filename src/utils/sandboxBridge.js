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
//  2. SERVER FEEDBACK (opt-in). A module that declares
//     <meta name="orbit-feedback" content="server"> receives its HTML with
//     the answers removed, and calls
//       orbitCheck(qid, answer).then(r => r.ok && r.isCorrect / r.correct.key / r.correct.text)
//     to have Orbit record + grade the answer and reveal the right one.
//  3. EXIT CONTAINMENT. After submitting, modules call window.close(),
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
      // An empty string IS an answer: modules record "Check" on an empty
      // fill-in-the-blank as a wrong attempt and reveal the correct text.
      if (v === undefined || v === null) return;
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
  var pending = {}, seq = 0;
  window.orbitCheck = function (qid, chosen) {
    return new Promise(function (resolve) {
      var id = 'c' + (++seq);
      var answer = chosen == null ? '' : String(chosen);
      pending[id] = resolve;
      sent[String(qid)] = answer; // the poll needn't post it again
      post({ type: 'ORBIT_CHECK', id: id, qid: String(qid), chosen: answer });
      setTimeout(function () { if (pending[id]) { delete pending[id]; resolve({ ok: false }); } }, 15000);
    });
  };
  window.addEventListener('message', function (e) {
    if (e.source !== window.parent) return;
    var d = e.data || {};
    if (d.type !== 'ORBIT_CHECK_RESULT' || !pending[d.id]) return;
    var done = pending[d.id]; delete pending[d.id];
    done(d.result || { ok: false });
  });
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
