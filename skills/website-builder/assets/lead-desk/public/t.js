/* Lead Desk helper for any website. Add once to every page, before </body>:
     <script src="https://<your lead desk address>/t.js" defer></script>
   It does three things, with no cookies and nothing that identifies a visitor:
   1. Counts the page view (and success-page views) so the Lead Desk can show
      conversion rates per page and source.
   2. Remembers where the visitor came from (utm_ tags or the referring site)
      for this browser tab.
   3. Fills hidden fields in every form that sends to the Lead Desk, so each
      lead arrives labelled with its page, goal, lead magnet and source. */
(function () {
  var me = document.currentScript;
  if (!me) return;
  var desk = new URL(me.src).origin;
  var store = {};
  try { store = JSON.parse(sessionStorage.getItem('desk_src') || '{}'); } catch (e) {}
  var qs = new URLSearchParams(location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) { if (qs.get(k)) store[k] = qs.get(k).slice(0, 200); });
  if (qs.get('gclid')) { store.utm_source = store.utm_source || 'google'; store.utm_medium = store.utm_medium || 'cpc'; }
  if (qs.get('fbclid')) { store.utm_source = store.utm_source || 'facebook'; }
  if (!store._ref && document.referrer && new URL(document.referrer).host !== location.host) store._ref = document.referrer.slice(0, 500);
  try { sessionStorage.setItem('desk_src', JSON.stringify(store)); } catch (e) {}

  var source = store.utm_source || (store._ref ? new URL(store._ref).hostname.replace(/^www\./, '') : 'direct');
  var role = document.querySelector('meta[name="page-role"]');
  var kind = role && role.content === 'success' ? 'success' : 'view';
  var data = new URLSearchParams({ kind: kind, page: location.pathname, source: source });
  if (navigator.sendBeacon) navigator.sendBeacon(desk + '/api/event', data);
  else fetch(desk + '/api/event', { method: 'POST', body: data, keepalive: true, mode: 'no-cors' });

  var loaded = String(Date.now());
  function put(form, name, value) {
    if (!value) return;
    var el = form.querySelector('input[name="' + name + '"]');
    if (!el) { el = document.createElement('input'); el.type = 'hidden'; el.name = name; form.appendChild(el); }
    if (!el.value) el.value = value;
  }
  function prepare(form) {
    var button = form.querySelector('[data-cta]');
    var cta = form.getAttribute('data-cta') || (button ? button.getAttribute('data-cta') : '');
    put(form, '_page', location.href.split('#')[0]);
    put(form, '_goal', cta || '');
    put(form, '_magnet', form.getAttribute('data-magnet') || '');
    var success = form.getAttribute('data-success');
    if (success) put(form, '_success', new URL(success, location.href).href);
    put(form, '_t', loaded);
    Object.keys(store).forEach(function (k) { put(form, k, store[k]); });
    if (!form.querySelector('input[name="_hp"]')) {
      var trap = document.createElement('input');
      trap.type = 'text'; trap.name = '_hp'; trap.tabIndex = -1; trap.autocomplete = 'off'; trap.setAttribute('aria-hidden', 'true');
      trap.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
      form.appendChild(trap);
    }
  }
  var forms = document.querySelectorAll('form');
  for (var i = 0; i < forms.length; i++) {
    var action = forms[i].getAttribute('action') || '';
    if (forms[i].hasAttribute('data-desk') || action.indexOf(desk + '/api/lead') === 0) prepare(forms[i]);
  }
})();
