// Lead Desk admin. Plain JavaScript, no build step.
(function () {
  var app = document.getElementById('app');
  var state = { me: null, mail: false };
  var statuses = [['new', 'New'], ['contacted', 'Contacted'], ['qualified', 'Qualified'], ['customer', 'Customer'], ['lost', 'Lost']];
  var label = function (s) { var f = statuses.find(function (x) { return x[0] === s; }); return f ? f[1] : s; };

  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function when(iso) { if (!iso) return ''; var d = new Date(iso); return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); }
  function money(n) { var c = state.currency || ''; return n ? c + Number(n).toLocaleString() : (c + '0'); }
  function api(path, opts) {
    opts = opts || {};
    return fetch(path, { method: opts.method || 'GET', headers: opts.body ? { 'content-type': 'application/json' } : {}, body: opts.body ? JSON.stringify(opts.body) : undefined, credentials: 'same-origin' })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'Unexpected answer (' + r.status + ')' }; }).then(function (j) { if (r.status === 401 && path.indexOf('/api/auth/') !== 0) { start(); throw new Error('signed out'); } return j; }); });
  }
  function msg(el, text, ok) { el.innerHTML = text ? '<div class="msg ' + (ok ? 'ok' : 'err') + '">' + esc(text) + '</div>' : ''; }
  function hashParam(name) { var m = location.hash.match(new RegExp('[#&]' + name + '=([^&]+)')); return m ? decodeURIComponent(m[1]) : ''; }

  // ---------- signed out ----------
  function showLogin(hasAdmins) {
    app.innerHTML = '<div class="card narrow"><h1>Lead Desk</h1>' +
      (hasAdmins ? '<p class="muted">Sign in to see your leads.</p>' : '<p class="muted">No one has set up an account yet. Open the invite link you were given to set your password.</p>') +
      '<form id="f"><label for="e">Email</label><input id="e" type="email" autocomplete="username" required>' +
      '<label for="p">Password</label><input id="p" type="password" autocomplete="current-password" required>' +
      '<div id="m"></div><p><button>Sign in</button></p></form>' +
      '<p class="muted small">Forgot your password? Ask an owner to send you a new invite link from the Team page.</p></div>';
    document.getElementById('f').onsubmit = function (ev) {
      ev.preventDefault(); var b = ev.target.querySelector('button'); b.disabled = true;
      api('/api/auth/login', { method: 'POST', body: { email: document.getElementById('e').value, pass: document.getElementById('p').value } })
        .then(function (j) { b.disabled = false; if (j.ok) start(); else msg(document.getElementById('m'), j.error); });
    };
  }
  function showAccept(code) {
    app.innerHTML = '<div class="card narrow"><h1>Welcome to the Lead Desk</h1><p class="muted">Choose a password to finish setting up your account.</p>' +
      '<form id="f"><label for="n">Your name</label><input id="n" autocomplete="name">' +
      '<label for="p">Password (at least 10 characters)</label><input id="p" type="password" autocomplete="new-password" minlength="10" required>' +
      '<label for="p2">Type it again</label><input id="p2" type="password" autocomplete="new-password" required>' +
      '<div id="m"></div><p><button>Set password and sign in</button></p></form></div>';
    document.getElementById('f').onsubmit = function (ev) {
      ev.preventDefault();
      var p = document.getElementById('p').value;
      if (p !== document.getElementById('p2').value) return msg(document.getElementById('m'), 'The two passwords are different.');
      var b = ev.target.querySelector('button'); b.disabled = true;
      api('/api/auth/accept', { method: 'POST', body: { invite: code, pass: p, name: document.getElementById('n').value } })
        .then(function (j) { b.disabled = false; if (j.ok) { history.replaceState(null, '', '/admin/#leads'); start(); } else msg(document.getElementById('m'), j.error); });
    };
  }

  // ---------- signed in shell ----------
  function shell(tab, inner) {
    var tabs = [['leads', 'Leads'], ['dashboard', 'Results'], ['team', 'Team'], ['settings', 'Settings']];
    app.innerHTML = '<header class="top"><b>Lead Desk</b><nav class="tabs">' +
      tabs.map(function (t) { return '<a href="#' + t[0] + '" class="' + (t[0] === tab ? 'on' : '') + '">' + t[1] + '</a>'; }).join('') +
      '</nav><button class="ghost small" id="out">Sign out</button></header><main id="main">' + inner + '</main>';
    document.getElementById('out').onclick = function () { api('/api/auth/logout', { method: 'POST' }).then(start); };
    return document.getElementById('main');
  }

  function leadsView() {
    var main = shell('leads', '<div class="card"><div class="row">' +
      '<div><label for="q">Search</label><input id="q" placeholder="Name, email, phone or message"></div>' +
      '<div><label for="s">Status</label><select id="s"><option value="">All</option>' + statuses.map(function (s) { return '<option value="' + s[0] + '">' + s[1] + '</option>'; }).join('') + '</select></div>' +
      '<div style="flex:0 0 auto"><button class="ghost" id="csv">Download all (CSV)</button></div></div></div>' +
      '<div class="card" id="list"><p class="muted">Loading…</p></div>');
    var q = document.getElementById('q'), s = document.getElementById('s'), t;
    function load() {
      api('/api/leads?limit=200&q=' + encodeURIComponent(q.value) + '&status=' + s.value).then(function (j) {
        var el = document.getElementById('list'); if (!el) return;
        if (!j.leads || !j.leads.length) { el.innerHTML = '<p class="muted">No leads yet. When someone fills in a form on your site, they appear here.</p>'; return; }
        el.innerHTML = '<table><thead><tr><th class="hide-sm">When</th><th>Name</th><th class="hide-sm">Contact</th><th class="hide-sm">Came from</th><th>Status</th></tr></thead><tbody>' +
          j.leads.map(function (l) {
            return '<tr class="click" data-id="' + l.id + '"><td class="small hide-sm">' + esc(when(l.created_at)) + '</td><td><b>' + esc(l.name || l.email || l.phone || '(no name)') + '</b><div class="small muted">' + esc(l.magnet || l.page || '') + '</div><div class="small muted show-sm">' + esc(when(l.created_at)) + ' · ' + esc(l.source) + '</div></td>' +
              '<td class="hide-sm small">' + esc(l.email) + (l.phone ? '<br>' + esc(l.phone) : '') + '</td><td class="hide-sm small">' + esc(l.source) + '</td>' +
              '<td><span class="pill ' + esc(l.status) + '">' + esc(label(l.status)) + '</span></td></tr>';
          }).join('') + '</tbody></table>';
        el.querySelectorAll('tr.click').forEach(function (r) { r.onclick = function () { location.hash = 'lead=' + r.getAttribute('data-id'); }; });
      });
    }
    q.oninput = function () { clearTimeout(t); t = setTimeout(load, 250); };
    s.onchange = load;
    document.getElementById('csv').onclick = function () { location.href = '/api/leads.csv'; };
    load();
  }

  function leadView(id) {
    var main = shell('leads', '<p><a href="#leads">← All leads</a></p><div id="lead"><p class="muted">Loading…</p></div>');
    api('/api/leads/' + id).then(function (j) {
      var el = document.getElementById('lead'); if (!j.ok) { el.innerHTML = '<div class="card">' + esc(j.error) + '</div>'; return; }
      var l = j.lead, extra = Object.keys(l.fields || {});
      el.innerHTML = '<div class="grid2"><div class="card"><h1>' + esc(l.name || '(no name)') + '</h1><dl>' +
        (l.email ? '<dt>Email</dt><dd><a href="mailto:' + esc(l.email) + '">' + esc(l.email) + '</a></dd>' : '') +
        (l.phone ? '<dt>Phone</dt><dd><a href="tel:' + esc(l.phone) + '">' + esc(l.phone) + '</a></dd>' : '') +
        (l.message ? '<dt>Message</dt><dd>' + esc(l.message) + '</dd>' : '') +
        extra.map(function (k) { return '<dt>' + esc(k) + '</dt><dd>' + esc(l.fields[k]) + '</dd>'; }).join('') +
        '<dt>When</dt><dd>' + esc(when(l.created_at)) + '</dd></dl></div>' +
        '<div class="card"><h2>Where they came from</h2><dl>' +
        '<dt>Source</dt><dd>' + esc(l.source || 'direct') + '</dd>' + (l.medium ? '<dt>Medium</dt><dd>' + esc(l.medium) + '</dd>' : '') +
        (l.campaign ? '<dt>Campaign</dt><dd>' + esc(l.campaign) + '</dd>' : '') + (l.page ? '<dt>Page</dt><dd>' + esc(l.page) + '</dd>' : '') +
        (l.goal ? '<dt>Goal</dt><dd>' + esc(l.goal) + '</dd>' : '') + (l.magnet ? '<dt>Lead magnet</dt><dd>' + esc(l.magnet) + '</dd>' : '') +
        (l.referrer ? '<dt>Referrer</dt><dd>' + esc(l.referrer) + '</dd>' : '') + '</dl></div></div>' +
        '<div class="card"><h2>Progress</h2><div class="row"><div><label for="st">Status</label><select id="st">' +
        statuses.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === l.status ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></div>' +
        '<div><label for="v">Money from this customer</label><input id="v" type="number" min="0" step="0.01" value="' + esc(l.value == null ? '' : l.value) + '" placeholder="0"></div>' +
        '<div style="flex:0 0 auto"><button id="save">Save</button></div></div><div id="m"></div>' +
        '<label for="note">Add a note</label><textarea id="note" placeholder="Called, left a voicemail. Booked for Tuesday."></textarea><p><button class="ghost" id="addnote">Add note</button></p>' +
        '<div id="notes">' + j.notes.map(function (n) { return '<p class="small"><b>' + esc(n.author) + '</b> <span class="muted">' + esc(when(n.created_at)) + '</span><br>' + esc(n.body) + '</p>'; }).join('') + '</div></div>' +
        '<p><button class="danger" id="del">Delete this lead</button></p>';
      document.getElementById('save').onclick = function () {
        var body = { value: document.getElementById('v').value }; var st = document.getElementById('st').value; if (st !== l.status) body.status = st;
        api('/api/leads/' + id, { method: 'PATCH', body: body }).then(function (r) { if (r.ok) leadView(id); else msg(document.getElementById('m'), r.error); });
      };
      document.getElementById('addnote').onclick = function () {
        var n = document.getElementById('note').value.trim(); if (!n) return;
        api('/api/leads/' + id, { method: 'PATCH', body: { note: n } }).then(function () { leadView(id); });
      };
      document.getElementById('del').onclick = function () {
        if (!confirm('Delete this lead for good? This cannot be undone.')) return;
        api('/api/leads/' + id, { method: 'DELETE' }).then(function () { location.hash = 'leads'; });
      };
    });
  }

  function bars(rows, key) {
    var max = Math.max.apply(null, rows.map(function (r) { return r[key] || 0; }).concat([1]));
    return rows.length ? '<div class="bars">' + rows.map(function (r) {
      return '<div><span class="name" title="' + esc(r.name) + '">' + esc(r.name) + '</span><span class="bar" style="width:' + Math.round(50 * (r[key] || 0) / max) + '%"></span><span>' + (r[key] || 0) +
        (r.customers ? ' <span class="muted small">(' + r.customers + ' customer' + (r.customers > 1 ? 's' : '') + ')</span>' : '') + '</span></div>';
    }).join('') + '</div>' : '<p class="muted small">Nothing yet.</p>';
  }
  function dashboardView() {
    var main = shell('dashboard', '<div class="row card"><div><label for="d">Period</label><select id="d"><option value="7">Last 7 days</option><option value="30" selected>Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last year</option></select></div></div><div id="dash"><p class="muted">Loading…</p></div>');
    function load() {
      api('/api/stats?days=' + document.getElementById('d').value).then(function (s) {
        var t = s.totals || {}, el = document.getElementById('dash'); if (!el) return;
        var rate = t.leads ? Math.round(100 * (t.customers || 0) / t.leads) : 0;
        el.innerHTML = '<div class="stats"><div class="stat"><div class="n">' + (t.leads || 0) + '</div><div class="l">New leads</div></div>' +
          '<div class="stat"><div class="n">' + (t.waiting || 0) + '</div><div class="l">Still marked New</div></div>' +
          '<div class="stat"><div class="n">' + (t.customers || 0) + '</div><div class="l">Became customers (' + rate + '%)</div></div>' +
          '<div class="stat"><div class="n">' + esc(money(t.revenue)) + '</div><div class="l">Money from them</div></div></div>' +
          '<div class="grid2"><div class="card"><h2>Leads by source</h2>' + bars(s.bySource || [], 'leads') + '</div>' +
          '<div class="card"><h2>Leads by lead magnet</h2>' + bars((s.byMagnet || []).filter(function (r) { return r.name !== '(none)'; }), 'leads') + '</div>' +
          '<div class="card"><h2>Leads by page</h2>' + bars(s.byPage || [], 'leads') + '</div>' +
          '<div class="card"><h2>Conversion rate by page</h2>' + ((s.pages || []).length ? '<table><thead><tr><th>Page</th><th>Visits</th><th>Leads</th><th>Rate</th></tr></thead><tbody>' +
            s.pages.map(function (p) { return '<tr><td class="small">' + esc(p.page) + '</td><td>' + p.views + '</td><td>' + p.leads + '</td><td><b>' + p.rate + '%</b></td></tr>'; }).join('') + '</tbody></table>'
            : '<p class="muted small">Add the Lead Desk helper script to your site to count visits. Then each page shows its conversion rate here.</p>') + '</div></div>';
      });
    }
    document.getElementById('d').onchange = load; load();
  }

  function teamView() {
    var owner = state.me.role === 'owner';
    var main = shell('team', '<div class="card"><h2>Invite someone</h2><p class="muted small">They get a link to choose their own password. The link works once, for 7 days.' + (state.mail ? ' It is also emailed to them.' : '') + '</p>' +
      '<form id="inv" class="row"><div><label for="ie">Their email</label><input id="ie" type="email" required></div>' +
      (owner ? '<div><label for="ir">Role</label><select id="ir"><option value="admin">Admin: sees and works leads</option><option value="owner">Owner: also changes settings and team</option></select></div>' : '') +
      '<div style="flex:0 0 auto"><button>Create invite</button></div></form><div id="link"></div></div>' +
      '<div class="card"><h2>People</h2><div id="people"><p class="muted">Loading…</p></div></div>' +
      '<div class="card"><h2>You</h2><label><input type="checkbox" id="me-notify" style="width:auto"' + (state.me.notify ? ' checked' : '') + '> Email me about new leads and summaries</label></div>');
    document.getElementById('me-notify').onchange = function (ev) { api('/api/me', { method: 'PATCH', body: { notify: ev.target.checked } }); };
    document.getElementById('inv').onsubmit = function (ev) {
      ev.preventDefault();
      api('/api/team/invite', { method: 'POST', body: { email: document.getElementById('ie').value, role: owner ? document.getElementById('ir').value : 'admin' } }).then(function (j) {
        var el = document.getElementById('link');
        if (!j.ok) return msg(el, j.error);
        el.innerHTML = '<div class="msg ok">' + (j.emailed ? 'Invite emailed. ' : '') + 'Send them this link:</div><div class="copybox"><input readonly value="' + esc(j.link) + '"><button class="ghost" id="cp">Copy</button></div>';
        document.getElementById('cp').onclick = function () { navigator.clipboard.writeText(j.link); this.textContent = 'Copied'; };
        loadPeople();
      });
    };
    function loadPeople() {
      api('/api/team').then(function (j) {
        document.getElementById('people').innerHTML = '<table><thead><tr><th>Email</th><th>Role</th><th class="hide-sm">Last sign-in</th><th></th></tr></thead><tbody>' +
          j.team.map(function (p) {
            return '<tr><td>' + esc(p.name ? p.name + ' · ' : '') + esc(p.email) + (p.active ? '' : ' <span class="muted small">(invite not used yet)</span>') + '</td><td>' + esc(p.role) + '</td><td class="hide-sm small">' + esc(when(p.last_login)) + '</td>' +
              '<td>' + (owner && p.email !== state.me.email ? '<button class="ghost small" data-rm="' + esc(p.email) + '">Remove</button>' : '') + '</td></tr>';
          }).join('') + '</tbody></table>';
        document.querySelectorAll('[data-rm]').forEach(function (b) {
          b.onclick = function () { if (confirm('Remove ' + b.getAttribute('data-rm') + '? They will be signed out.')) api('/api/team/' + encodeURIComponent(b.getAttribute('data-rm')), { method: 'DELETE' }).then(loadPeople); };
        });
      });
    }
    loadPeople();
  }

  function settingsView() {
    var main = shell('settings', '<div id="set"><p class="muted">Loading…</p></div>');
    api('/api/settings').then(function (j) {
      var s = j.settings, owner = state.me.role === 'owner', dis = owner ? '' : ' disabled';
      document.getElementById('set').innerHTML = (owner ? '' : '<div class="msg err">Only an owner can change these settings.</div>') +
        '<form id="f"><div class="card"><h2>Which websites can send leads</h2><p class="muted small">Your website addresses, one per line, like https://yourbusiness.com. Forms on other sites are refused. Leave empty only while testing.</p>' +
        '<textarea id="allowed_origins"' + dis + ' placeholder="' + esc(j.siteOrigins || 'https://yourbusiness.com') + '">' + esc(s.allowed_origins) + '</textarea></div>' +
        '<div class="card"><h2>Email alerts</h2>' + (j.mail ? '<p class="muted small">Sent through Cloudflare Email Routing to every person on the Team page who has alerts on. Each address must be verified in Cloudflare Email Routing first.</p>' +
          '<label for="mail_from">Send from (an address on your domain)</label><input id="mail_from"' + dis + ' placeholder="leads@yourbusiness.com" value="' + esc(s.mail_from) + '">' +
          '<label for="notify_email">New lead emails</label><select id="notify_email"' + dis + '><option value="on">On</option><option value="off"' + (s.notify_email === 'off' ? ' selected' : '') + '>Off</option></select>'
          : '<p class="muted small">Email alerts need your domain on Cloudflare with Email Routing turned on. Ask Claude: "Turn on email alerts for my Lead Desk."</p>') + '</div>' +
        '<div class="card"><h2>Chat or app alerts</h2><p class="muted small">Paste a webhook link from Slack, Discord, Google Chat, Microsoft Teams, Zapier or Make. Each new lead is posted there. This is also how leads reach another tool, like your email list or CRM.</p>' +
        '<label for="notify_webhook">Webhook link</label><input id="notify_webhook"' + dis + ' value="' + esc(s.notify_webhook) + '" placeholder="Paste the webhook link here"></div>' +
        '<div class="card"><h2>Phone alerts</h2><p class="muted small">Free, no account: install the ntfy app on your phone, tap +, and subscribe to a long, hard-to-guess topic name. Type the same name here.</p>' +
        '<label for="notify_ntfy">ntfy topic name</label><input id="notify_ntfy"' + dis + ' value="' + esc(s.notify_ntfy) + '" placeholder="yourbusiness-leads-7f3k9q2"></div>' +
        '<div class="card"><h2>Summary</h2><label for="digest">Send a summary of leads and results</label><select id="digest"' + dis + '>' +
        [['off', 'Never'], ['daily', 'Every day'], ['weekly', 'Every Monday']].map(function (o) { return '<option value="' + o[0] + '"' + (s.digest === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
        '<label for="currency">Currency symbol</label><input id="currency"' + dis + ' value="' + esc(s.currency) + '" placeholder="$"></div>' +
        (owner ? '<p class="row"><button>Save settings</button><button type="button" class="ghost" id="test">Send a test alert</button></p>' : '') + '<div id="m"></div></form>';
      if (!owner) return;
      document.getElementById('f').onsubmit = function (ev) {
        ev.preventDefault(); var body = {};
        ['allowed_origins', 'mail_from', 'notify_email', 'notify_webhook', 'notify_ntfy', 'digest', 'currency'].forEach(function (k) { var e = document.getElementById(k); if (e) body[k] = e.value; });
        api('/api/settings', { method: 'PUT', body: body }).then(function (r) { state.currency = body.currency; msg(document.getElementById('m'), r.ok ? 'Saved.' : r.error, r.ok); });
      };
      document.getElementById('test').onclick = function () {
        api('/api/settings/test', { method: 'POST' }).then(function (r) {
          var parts = Object.keys(r.results || {}).map(function (k) { return k + ': ' + r.results[k]; });
          msg(document.getElementById('m'), parts.length ? 'Test sent. ' + parts.join(', ') + '.' : 'No alerts are set up yet. Save a webhook, phone topic or email first.', parts.length > 0);
        });
      };
    });
  }

  function route() {
    if (!state.me) return;
    var lead = hashParam('lead');
    if (lead) return leadView(lead);
    var tab = (location.hash.replace('#', '') || 'leads').split('&')[0];
    ({ dashboard: dashboardView, team: teamView, settings: settingsView }[tab] || leadsView)();
  }

  function start() {
    var invite = hashParam('invite');
    api('/api/auth/status').then(function (j) {
      state.mail = j.mail;
      if (invite) return showAccept(invite);
      if (!j.me) { state.me = null; return showLogin(j.hasAdmins); }
      state.me = j.me;
      api('/api/settings').then(function (s) { state.currency = (s.settings && s.settings.currency) || ''; route(); });
    });
  }
  window.addEventListener('hashchange', function () { if (hashParam('invite')) return start(); route(); });
  start();
})();
